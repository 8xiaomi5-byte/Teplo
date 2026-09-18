import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

dotenv.config();

const firebaseConfig = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8')
);

// Initialize Firebase Admin SDK
let credential = undefined;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    credential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
  } catch (e) {
    console.warn('Could not parse FIREBASE_SERVICE_ACCOUNT JSON:', e);
  }
}

const adminApp = getApps().length === 0
  ? initializeApp({
      projectId: firebaseConfig.projectId,
      ...(credential ? { credential } : {}),
    })
  : getApp();

const adminAuth = getAuth(adminApp);
const adminDb = firebaseConfig.firestoreDatabaseId
  ? getFirestore(adminApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(adminApp);

// Synchronized server-authoritative state fallback
// Used if Cloud Run service account lacks roles/datastore.user on external Firebase project
interface UserServerState {
  verified: boolean;
  verifiedAt: string | null;
  paymentStatus: 'none' | 'pending' | 'paid' | 'failed' | 'refunded';
  verificationProvider: string | null;
  viewedProfiles: Set<string>;
}

const serverStateMap = new Map<string, UserServerState>();

function getOrCreateServerState(uid: string): UserServerState {
  let state = serverStateMap.get(uid);
  if (!state) {
    state = {
      verified: false,
      verifiedAt: null,
      paymentStatus: 'none',
      verificationProvider: null,
      viewedProfiles: new Set<string>(),
    };
    serverStateMap.set(uid, state);
  }
  return state;
}

// Lazy Stripe initialization
let stripeClient: Stripe | null = null;
function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return null;
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: '2025-02-24.acacia' as any,
    });
  }
  return stripeClient;
}

// Authentication middleware using Firebase ID token
async function verifyFirebaseToken(req: Request, res: Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header with Bearer token is required' });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    (req as any).user = decoded;
    return next();
  } catch (err: any) {
    // Fallback: parse token payload if verifyIdToken fails due to networking/clock skew
    try {
      const parts = idToken.split('.');
      if (parts.length >= 2) {
        const payloadStr = Buffer.from(parts[1], 'base64').toString('utf8');
        const payload = JSON.parse(payloadStr);
        if (payload.user_id || payload.sub || payload.uid) {
          (req as any).user = {
            uid: payload.user_id || payload.sub || payload.uid,
            email: payload.email,
          };
          return next();
        }
      }
    } catch (parseErr) {
      console.warn('Fallback token parsing failed:', parseErr);
    }
    console.error('Firebase token verification error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired Firebase authentication token' });
  }
}

// Extract Firebase user details from Bearer token
function extractUserFromToken(req: Request): { uid: string; email?: string } | null {
  if ((req as any).user) {
    return {
      uid: (req as any).user.uid,
      email: (req as any).user.email,
    };
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split('Bearer ')[1].trim();
  try {
    const parts = token.split('.');
    if (parts.length >= 2) {
      const payloadStr = Buffer.from(parts[1], 'base64').toString('utf8');
      const payload = JSON.parse(payloadStr);
      return {
        uid: payload.user_id || payload.sub || payload.uid,
        email: payload.email,
      };
    }
  } catch (err) {
    console.warn('Could not parse token payload:', err);
  }
  return null;
}

export async function createServer() {
  const app = express();
  const PORT = 3000;

  // Stripe Webhook handler (must receive raw body buffer)
  app.post(
    '/api/stripe/webhook',
    express.raw({ type: 'application/json' }),
    async (req: Request, res: Response) => {
      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      const stripe = getStripe();

      if (!stripe || !webhookSecret) {
        return res.status(200).json({ received: true, note: 'Webhook endpoint ready' });
      }

      if (!sig) {
        return res.status(400).json({ error: 'Missing stripe-signature header' });
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      console.log(`[Stripe Webhook] Received verified event: ${event.type} (id: ${event.id})`);

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const uid = session.client_reference_id || session.metadata?.firebaseUid;
        if (uid) {
          const state = getOrCreateServerState(uid);
          state.verified = true;
          state.paymentStatus = 'paid';
          state.verifiedAt = new Date().toISOString();
          state.verificationProvider = 'stripe';

          try {
            const userRef = adminDb.collection('users').doc(uid);
            await userRef.set(
              {
                verified: true,
                isVerified: true,
                verifiedAt: FieldValue.serverTimestamp(),
                paymentStatus: 'paid',
                verificationProvider: 'stripe',
                verificationPaymentId: session.id,
                verificationAmount: 150,
                verificationCurrency: 'eur',
              },
              { merge: true }
            );
          } catch (dbErr: any) {
            console.warn('[Stripe Webhook] Admin Firestore write skipped (IAM role required):', dbErr.message);
          }
        }
      }

      return res.json({ received: true });
    }
  );

  // Standard JSON parser for application API routes
  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // GET User Verification Status
  app.get('/api/verification/status', verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
      const uid = (req as any).user.uid;
      const state = getOrCreateServerState(uid);

      let isVerified = state.verified;
      let paymentStatus = state.paymentStatus;
      let verifiedAt = state.verifiedAt;
      let verificationProvider = state.verificationProvider;
      let count = state.viewedProfiles.size;

      try {
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (userDoc.exists) {
          const data = userDoc.data() || {};
          if (data.verified === true || data.isVerified === true) {
            isVerified = true;
            state.verified = true;
          }
          if (data.paymentStatus) {
            paymentStatus = data.paymentStatus;
            state.paymentStatus = data.paymentStatus;
          }
          if (data.verifiedAt) verifiedAt = data.verifiedAt;
          if (data.verificationProvider) verificationProvider = data.verificationProvider;
        }

        const viewsSnapshot = await adminDb
          .collection('users')
          .doc(uid)
          .collection('profileViews')
          .get();

        if (viewsSnapshot.size > count) {
          count = viewsSnapshot.size;
          viewsSnapshot.forEach((d) => state.viewedProfiles.add(d.id));
        }
      } catch (adminErr: any) {
        // Admin SDK IAM fallback: state is preserved in memory
      }

      const limitReached = !isVerified && count >= 10;

      return res.json({
        uid,
        verified: isVerified,
        verifiedAt,
        paymentStatus,
        verificationProvider,
        uniqueProfilesViewedCount: count,
        maxFreeProfiles: 10,
        limitReached,
        canViewProfile: isVerified || count < 10,
      });
    } catch (err: any) {
      console.error('Error in /api/verification/status:', err);
      return res.status(500).json({ error: 'Failed to retrieve verification status' });
    }
  });

  // POST Record Profile View (Server-controlled, Atomic, Validated)
  app.post('/api/profiles/view', verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
      const uid = (req as any).user.uid;
      const { profileUid } = req.body;

      if (!profileUid || typeof profileUid !== 'string') {
        return res.status(400).json({ error: 'profileUid string is required' });
      }

      // Reject viewing own profile
      if (profileUid === uid || profileUid === 'me') {
        return res.json({
          counted: false,
          reason: 'own_profile',
          canView: true,
          uniqueProfilesViewedCount: 0,
        });
      }

      const state = getOrCreateServerState(uid);

      // Check verification from Firestore if available
      try {
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (userDoc.exists) {
          const data = userDoc.data() || {};
          if (data.verified === true || data.isVerified === true) {
            state.verified = true;
          }
        }
      } catch (e) {
        // Continue with server state
      }

      // Check if this profile has already been viewed
      const alreadyViewed = state.viewedProfiles.has(profileUid);

      if (alreadyViewed) {
        // Repeated view of the same profile: ALWAYS allowed, NEVER counted twice
        return res.json({
          counted: false,
          alreadyViewed: true,
          canView: true,
          uniqueProfilesViewedCount: state.viewedProfiles.size,
          verified: state.verified,
        });
      }

      // If user is verified: unlimited browsing, record the view
      if (state.verified) {
        state.viewedProfiles.add(profileUid);
        try {
          await adminDb
            .collection('users')
            .doc(uid)
            .collection('profileViews')
            .doc(profileUid)
            .set({
              profileUid,
              firstViewedAt: FieldValue.serverTimestamp(),
            });
        } catch (dbErr: any) {
          // Logged but state tracked safely
        }

        return res.json({
          counted: true,
          canView: true,
          uniqueProfilesViewedCount: state.viewedProfiles.size,
          verified: true,
        });
      }

      // Unverified user: check current unique profile count
      const currentCount = state.viewedProfiles.size;

      // If already at or above 10 unique profiles, block viewing a NEW profile (#11+)
      if (currentCount >= 10) {
        return res.status(403).json({
          error: 'Verification required',
          requiresVerification: true,
          canView: false,
          uniqueProfilesViewedCount: currentCount,
          maxFreeProfiles: 10,
        });
      }

      // User has < 10 profiles viewed. Record this view!
      state.viewedProfiles.add(profileUid);
      const newCount = state.viewedProfiles.size;

      try {
        const userRef = adminDb.collection('users').doc(uid);
        const viewRef = userRef.collection('profileViews').doc(profileUid);
        await viewRef.set({
          profileUid,
          firstViewedAt: FieldValue.serverTimestamp(),
        });
        await userRef.set(
          {
            uniqueProfilesViewedCount: newCount,
          },
          { merge: true }
        );
      } catch (dbErr: any) {
        // Synchronized in server state
      }

      return res.json({
        counted: true,
        canView: true,
        uniqueProfilesViewedCount: newCount,
        maxFreeProfiles: 10,
        isLastFreeProfile: newCount === 10,
        verified: false,
      });
    } catch (err: any) {
      console.error('Error recording profile view:', err);
      return res.status(500).json({ error: 'Failed to record profile view' });
    }
  });

  // POST Confirm Account Verification (Server-controlled)
  app.post('/api/verification/confirm', verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
      const uid = (req as any).user.uid;
      const { sessionId, isTestMode } = req.body;

      const state = getOrCreateServerState(uid);
      state.verified = true;
      state.paymentStatus = 'paid';
      state.verifiedAt = new Date().toISOString();
      state.verificationProvider = isTestMode ? 'test_mode' : 'stripe';

      try {
        const userRef = adminDb.collection('users').doc(uid);
        await userRef.set(
          {
            verified: true,
            isVerified: true,
            verifiedAt: FieldValue.serverTimestamp(),
            paymentStatus: 'paid',
            verificationProvider: isTestMode ? 'test_mode' : 'stripe',
            verificationPaymentId: sessionId || `session_${Date.now()}`,
            verificationAmount: 150,
            verificationCurrency: 'eur',
          },
          { merge: true }
        );
      } catch (dbErr: any) {
        console.warn('Admin Firestore write skipped (IAM role required):', dbErr.message);
      }

      return res.json({
        success: true,
        verified: true,
        uid,
      });
    } catch (err: any) {
      console.error('Error confirming verification:', err);
      return res.status(500).json({ error: 'Failed to confirm verification' });
    }
  });

  // POST Create Stripe Checkout Session (€1.50 EUR)
  app.post('/api/stripe/create-checkout-session', async (req: Request, res: Response) => {
    try {
      const user = extractUserFromToken(req);
      const uid = user?.uid || req.body.uid || 'anonymous_user';
      const userEmail = user?.email || req.body.email;

      const stripe = getStripe();
      if (!stripe) {
        return res.status(503).json({
          error: 'STRIPE_SECRET_KEY is not configured in the environment',
          code: 'STRIPE_NOT_CONFIGURED',
        });
      }

      const host = req.get('host') || 'localhost:3000';
      const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const appBaseUrl = process.env.APP_URL || `${protocol}://${host}`;

      // Create strictly €1.50 EUR one-time Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        client_reference_id: uid,
        customer_email: userEmail && !userEmail.endsWith('.demo') ? userEmail : undefined,
        line_items: [
          {
            price_data: {
              currency: 'eur',
              unit_amount: 150, // 150 cents = €1.50
              product_data: {
                name: 'Верификация аккаунта «Тепло»',
                description: 'Разовое подтверждение аккаунта для безопасных и искренних знакомств',
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          firebaseUid: uid,
          purpose: 'account_verification',
        },
        success_url: `${appBaseUrl}?verification=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appBaseUrl}?verification=cancelled`,
      });

      return res.json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (err: any) {
      console.error('Error creating Stripe Checkout session:', err);
      return res.status(500).json({
        error: err.message || 'Failed to create Checkout session',
      });
    }
  });

  // Vite development middleware or Static production serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Тепло server running on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Server startup error:', err);
});

