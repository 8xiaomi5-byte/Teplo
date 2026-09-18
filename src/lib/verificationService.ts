import { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';

export interface VerificationStatusResponse {
  uid: string;
  verified: boolean;
  verifiedAt: string | null;
  paymentStatus: 'none' | 'pending' | 'paid' | 'failed' | 'refunded';
  verificationProvider: string | null;
  uniqueProfilesViewedCount: number;
  maxFreeProfiles: number;
  limitReached: boolean;
  canViewProfile: boolean;
}

export interface ProfileViewResult {
  counted: boolean;
  alreadyViewed?: boolean;
  canView: boolean;
  uniqueProfilesViewedCount: number;
  maxFreeProfiles?: number;
  isLastFreeProfile?: boolean;
  requiresVerification?: boolean;
  verified?: boolean;
  error?: string;
}

// Check verification status from server API or Firestore user record
export async function fetchVerificationStatus(user: User | null): Promise<VerificationStatusResponse | null> {
  if (!user) return null;
  try {
    const token = await user.getIdToken();
    const res = await fetch('/api/verification/status', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (apiErr) {
    console.warn('API verification status request failed, falling back to Firestore user doc:', apiErr);
  }

  // Fallback: Read directly from Firestore (read is permitted for the authenticated owner)
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data() || {};

    const isVerified = userData.verified === true || userData.isVerified === true;
    const uniqueProfilesViewedCount = typeof userData.uniqueProfilesViewedCount === 'number'
      ? userData.uniqueProfilesViewedCount
      : 0;
    const limitReached = !isVerified && uniqueProfilesViewedCount >= 10;

    return {
      uid: user.uid,
      verified: isVerified,
      verifiedAt: userData.verifiedAt || null,
      paymentStatus: userData.paymentStatus || 'none',
      verificationProvider: userData.verificationProvider || null,
      uniqueProfilesViewedCount,
      maxFreeProfiles: 10,
      limitReached,
      canViewProfile: isVerified || uniqueProfilesViewedCount < 10,
    };
  } catch (err) {
    console.warn('Error fetching verification status from Firestore:', err);
    return null;
  }
}

// Record profile view atomically on trusted server
export async function recordProfileView(
  user: User | null,
  profileUid: string
): Promise<ProfileViewResult> {
  if (!user) {
    return {
      counted: false,
      canView: false,
      requiresVerification: true,
      uniqueProfilesViewedCount: 10,
    };
  }

  // Do not count the user's own profile or system placeholder
  if (profileUid === user.uid || profileUid === 'me') {
    return {
      counted: false,
      canView: true,
      uniqueProfilesViewedCount: 0,
    };
  }

  try {
    const token = await user.getIdToken();
    const res = await fetch('/api/profiles/view', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profileUid }),
    });

    if (res.status === 403) {
      const data = await res.json();
      return {
        counted: false,
        canView: false,
        requiresVerification: true,
        uniqueProfilesViewedCount: data.uniqueProfilesViewedCount ?? 10,
        maxFreeProfiles: 10,
      };
    }

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
    return {
      counted: data.counted ?? true,
      alreadyViewed: data.alreadyViewed ?? false,
      canView: data.canView ?? true,
      uniqueProfilesViewedCount: data.uniqueProfilesViewedCount ?? 0,
      maxFreeProfiles: 10,
      isLastFreeProfile: data.isLastFreeProfile,
      verified: data.verified,
    };
  } catch (err: any) {
    console.warn('Server record profile view failed, reading local status:', err);
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data() || {};
      const isVerified = userData.verified === true || userData.isVerified === true;
      const count = typeof userData.uniqueProfilesViewedCount === 'number' ? userData.uniqueProfilesViewedCount : 0;
      return {
        counted: false,
        canView: isVerified || count < 10,
        requiresVerification: !isVerified && count >= 10,
        uniqueProfilesViewedCount: count,
        maxFreeProfiles: 10,
        verified: isVerified,
      };
    } catch (readErr) {
      return {
        counted: false,
        canView: true,
        uniqueProfilesViewedCount: 0,
      };
    }
  }
}

// Initiate Stripe Checkout session for €1.50 EUR
export async function createVerificationCheckoutSession(
  user: User
): Promise<{ url: string; sessionId?: string; error?: string }> {
  try {
    const token = await user.getIdToken();
    const res = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Не удалось создать сессию оплаты');
    }

    return data;
  } catch (err: any) {
    console.error('Error initiating Stripe checkout:', err);
    throw err;
  }
}

// Mock verification for preview/test mode (Calls server to record verified status)
export async function executeMockVerification(user: User): Promise<boolean> {
  try {
    const token = await user.getIdToken();
    const res = await fetch('/api/verification/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isTestMode: true }),
    });
    return res.ok;
  } catch (err) {
    console.error('Error executing mock verification on server:', err);
    return false;
  }
}

// Mark account as verified via server (e.g. after returning from Stripe checkout)
export async function markAccountVerified(user: User, paymentId?: string): Promise<boolean> {
  try {
    const token = await user.getIdToken();
    const res = await fetch('/api/verification/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId: paymentId }),
    });
    return res.ok;
  } catch (err) {
    console.error('Error marking account as verified on server:', err);
    return false;
  }
}
