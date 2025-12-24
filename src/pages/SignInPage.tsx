import React, { useEffect, useRef, useCallback } from 'react';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';
import { getAuth, EmailAuthProvider } from 'firebase/auth';
import { httpsCallable, getFunctions } from "firebase/functions";

interface SignInPageProps {
  onSuccess?: () => void;
}

const SignInPage: React.FC<SignInPageProps> = ({ onSuccess }) => {
  // Function to register user in the backend - wrapped in useCallback to avoid recreation on each render
  const registerUser = useCallback(async (): Promise<void> => {
    try {
      const functions = getFunctions();
      const registerUserFn = httpsCallable(functions, 'registerUser');
      await registerUserFn();
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    }
  }, []);
  const uiRef = useRef<firebaseui.auth.AuthUI | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Firebase UI if not already done
    const auth = getAuth();

    if (!uiRef.current) {
      uiRef.current = new firebaseui.auth.AuthUI(auth);
    }

    // Configure Firebase UI
    const uiConfig: firebaseui.auth.Config = {
      signInFlow: 'popup',
      signInOptions: [
        EmailAuthProvider.PROVIDER_ID,
      ],
      callbacks: {
        signInSuccessWithAuthResult: () => {
          // Register the user in the backend
          // Using .then/.catch because callback must return a boolean, not a Promise
          registerUser()
            .then(() => {
              if (onSuccess) {
                onSuccess();
              }
            })
            .catch(error => {
              console.error("Error registering user:", error);
            });

          return false; // Don't redirect
        },
      },
    };

    // Start Firebase UI auth flow
    if (containerRef.current) {
      uiRef.current.start(containerRef.current, uiConfig);
    }

    // Clean up
    return () => {
      if (uiRef.current) {
        uiRef.current.reset();
      }
    };
  }, [onSuccess, registerUser]);

  return (
    <div className="signin-container">
      <h2>Sign in to Easy CSP</h2>
      <div ref={containerRef} id="firebaseui-auth-container"></div>
    </div>
  );
};

export default SignInPage;
