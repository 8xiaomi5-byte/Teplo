import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  signInAnonymously
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { fetchVerificationStatus, VerificationStatusResponse } from '../lib/verificationService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthLoading: boolean;
  isVerifiedAccount: boolean;
  uniqueProfilesViewedCount: number;
  paymentStatus: 'none' | 'pending' | 'paid' | 'failed' | 'refunded';
  refreshVerificationStatus: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInGuest: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (e: string, p: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Verification & Profile-view limits state
  const [isVerifiedAccount, setIsVerifiedAccount] = useState<boolean>(false);
  const [uniqueProfilesViewedCount, setUniqueProfilesViewedCount] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'none' | 'pending' | 'paid' | 'failed' | 'refunded'>('none');

  const refreshVerificationStatus = useCallback(async () => {
    if (!auth.currentUser) {
      setIsVerifiedAccount(false);
      setUniqueProfilesViewedCount(0);
      setPaymentStatus('none');
      return;
    }
    const status = await fetchVerificationStatus(auth.currentUser);
    if (status) {
      setIsVerifiedAccount(status.verified);
      setUniqueProfilesViewedCount(status.uniqueProfilesViewedCount);
      setPaymentStatus(status.paymentStatus);
    }
  }, []);

  useEffect(() => {
    let firestoreUnsub: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Listen to authoritative Firestore user record in real-time
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(
              userRef,
              {
                uid: currentUser.uid,
                name: currentUser.displayName || 'Гость',
                email: currentUser.email || '',
                avatarUrl:
                  currentUser.photoURL ||
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuAe84ZEXPHizdm7jXM6WHByRWlXpNty4-quce-GImZl2CGITjvcuI0etaAgJrppEcgkvB6RIacHjupo-ZiLw4KQks4JOMa_N2tyB4H7Ol7VsR4D3vKeiB3fQ867kru30bx3t4iNfN9J2kCI1IpNFR5FWofkwFdzaAO9aG_EJLnZq13GKp47gq-zWg8E1SCYReKE5TkW5_oCAcq0wPVEdNRWp4SbUHhX6guGpzUCy8DQFriaf4MqHa0W',
                city: 'Москва',
                createdAt: new Date().toISOString(),
                isVerified: false,
                verified: false,
                paymentStatus: 'none',
              },
              { merge: true }
            );
          }

          // Realtime listener on user document
          firestoreUnsub = onSnapshot(userRef, (docSnap) => {
            const data = docSnap.data();
            if (data) {
              const verified = data.verified === true;
              setIsVerifiedAccount(verified);
              if (data.paymentStatus) {
                setPaymentStatus(data.paymentStatus);
              }
              if (typeof data.uniqueProfilesViewedCount === 'number') {
                setUniqueProfilesViewedCount(data.uniqueProfilesViewedCount);
              }
            }
          });

          // Fetch initial server status
          await refreshVerificationStatus();
        } catch (err: any) {
          console.error('Error syncing user profile to Firestore:', err);
        }
      } else {
        setIsVerifiedAccount(false);
        setUniqueProfilesViewedCount(0);
        setPaymentStatus('none');
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (firestoreUnsub) firestoreUnsub();
    };
  }, [refreshVerificationStatus]);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.message?.includes('popup-closed-by-user')) {
        console.info('Google sign-in popup was closed by the user.');
        return;
      }
      console.error('Google Sign In Error:', err);
      const friendlyMsg =
        err.code === 'auth/cancelled-popup-request'
          ? 'Вход был отменен'
          : 'Не удалось войти через Google. Попробуйте войти по Email или в новой вкладке.';
      setError(friendlyMsg);
      throw new Error(friendlyMsg);
    }
  };

  const signInGuest = async () => {
    setError(null);
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.warn('Firebase anonymous sign in disabled or restricted:', err);
      if (err.code === 'auth/admin-restricted-operation' || err.message?.includes('admin-restricted-operation')) {
        try {
          const guestEmail = `guest_${Date.now().toString().slice(-6)}@teplo.demo`;
          const guestPassword = `guest_${Date.now()}Aa1!`;
          const res = await createUserWithEmailAndPassword(auth, guestEmail, guestPassword);
          if (res.user) {
            await updateProfile(res.user, { displayName: 'Гость Тепла' });
            const userRef = doc(db, 'users', res.user.uid);
            await setDoc(
              userRef,
              {
                uid: res.user.uid,
                name: 'Гость Тепла',
                email: guestEmail,
                createdAt: new Date().toISOString(),
                isVerified: false,
                verified: false,
                paymentStatus: 'none',
                isAnonymous: true,
                city: 'Москва',
                avatarUrl:
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuAe84ZEXPHizdm7jXM6WHByRWlXpNty4-quce-GImZl2CGITjvcuI0etaAgJrppEcgkvB6RIacHjupo-ZiLw4KQks4JOMa_N2tyB4H7Ol7VsR4D3vKeiB3fQ867kru30bx3t4iNfN9J2kCI1IpNFR5FWofkwFdzaAO9aG_EJLnZq13GKp47gq-zWg8E1SCYReKE5TkW5_oCAcq0wPVEdNRWp4SbUHhX6guGpzUCy8DQFriaf4MqHa0W',
              },
              { merge: true }
            );
          }
          return;
        } catch (guestFallbackErr: any) {
          console.error('Guest fallback creation error:', guestFallbackErr);
        }
      }
      const msg = 'Гостевой вход временно недоступен. Пожалуйста, используйте Email или Google.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      console.error('Email login error:', err);
      setError(err.message || 'Неверный email или пароль');
      throw err;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    setError(null);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        await updateProfile(res.user, { displayName: name });
        const userRef = doc(db, 'users', res.user.uid);
        await setDoc(
          userRef,
          {
            uid: res.user.uid,
            name,
            email,
            createdAt: new Date().toISOString(),
            isVerified: false,
            verified: false,
            paymentStatus: 'none',
            city: 'Москва',
            avatarUrl:
              'https://lh3.googleusercontent.com/aida-public/AB6AXuAe84ZEXPHizdm7jXM6WHByRWlXpNty4-quce-GImZl2CGITjvcuI0etaAgJrppEcgkvB6RIacHjupo-ZiLw4KQks4JOMa_N2tyB4H7Ol7VsR4D3vKeiB3fQ867kru30bx3t4iNfN9J2kCI1IpNFR5FWofkwFdzaAO9aG_EJLnZq13GKp47gq-zWg8E1SCYReKE5TkW5_oCAcq0wPVEdNRWp4SbUHhX6guGpzUCy8DQFriaf4MqHa0W',
          },
          { merge: true }
        );
      }
    } catch (err: any) {
      console.error('Register error:', err);
      setError(err.message || 'Ошибка при регистрации');
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setIsVerifiedAccount(false);
      setUniqueProfilesViewedCount(0);
      setPaymentStatus('none');
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthLoading: loading,
        isVerifiedAccount,
        uniqueProfilesViewedCount,
        paymentStatus,
        refreshVerificationStatus,
        signInWithGoogle,
        signInGuest,
        loginWithEmail,
        registerWithEmail,
        signOut,
        error,
        clearError: () => setError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
