import { useEffect, useState } from 'react';
import { getAuth } from "firebase/auth";

// This hook only tracks the Firebase authentication state
export const useAuthState = () => {
  const [signedIn, setSignedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const auth = getAuth();

  useEffect(() => {
    // Check if user is already signed in
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
        setSignedIn(true);
      } else {
        setUserId(null);
        setSignedIn(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return {
    signedIn,
    userId,
    loading
  };
};
