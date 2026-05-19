import { useEffect, useState } from 'react';
import { getAuth, multiFactor } from "firebase/auth";

const AUTH_CACHE_KEY = 'easy-csp-auth-cache';

interface AuthCache {
  signedIn: boolean;
  userId: string | null;
  emailVerified: boolean;
  mfaEnrolled: boolean;
  timestamp: number;
}

function getCachedAuth(): AuthCache | null {
  const data = localStorage.getItem(AUTH_CACHE_KEY);
  if (!data) return null;
  const parsed: AuthCache = JSON.parse(data);
  if (Date.now() - parsed.timestamp > 1000 * 60 * 60 * 24) return null;
  return parsed;
}

function setCachedAuth(cache: Omit<AuthCache, 'timestamp'>) {
  localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({ ...cache, timestamp: Date.now() }));
}

export function clearCachedAuth() {
  localStorage.removeItem(AUTH_CACHE_KEY);
}

export const useAuthState = () => {
  const cached = getCachedAuth();
  const [signedIn, setSignedIn] = useState(cached?.signedIn ?? false);
  const [userId, setUserId] = useState<string | null>(cached?.userId ?? null);
  const [emailVerified, setEmailVerified] = useState(cached?.emailVerified ?? false);
  const [mfaEnrolled, setMfaEnrolled] = useState(cached?.mfaEnrolled ?? false);
  const [loading, setLoading] = useState(!cached);

  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const verified = user.emailVerified;
        const enrolled = multiFactor(user).enrolledFactors.length > 0;
        setUserId(user.uid);
        setSignedIn(true);
        setEmailVerified(verified);
        setMfaEnrolled(enrolled);
        setCachedAuth({ signedIn: true, userId: user.uid, emailVerified: verified, mfaEnrolled: enrolled });
      } else {
        setUserId(null);
        setSignedIn(false);
        setEmailVerified(false);
        setMfaEnrolled(false);
        if (navigator.onLine) {
          clearCachedAuth();
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return { signedIn, userId, emailVerified, mfaEnrolled, loading };
};
