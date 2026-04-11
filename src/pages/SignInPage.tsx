import React, { useCallback, useState, useEffect } from 'react';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  getMultiFactorResolver
} from 'firebase/auth';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { Button } from '../components/common/button';
import { FormField } from '../components/auth/FormField';
import { ErrorAlert } from '../components/auth/ErrorAlert';
import { AuthCard } from '../components/auth/AuthCard';
import { MfaVerification } from '../components/auth/MfaVerification';

type MultiFactorResolver = ReturnType<typeof getMultiFactorResolver>;

interface SignInPageProps {
  onSuccess?: () => void;
}

const SignInPage: React.FC<SignInPageProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);

  // Add/remove signin-page class to body
  useEffect(() => {
    document.body.classList.add('signin-page');
    return () => {
      document.body.classList.remove('signin-page');
    };
  }, []);

  // Function to register user in the backend - wrapped in useCallback to avoid recreation on each render
  const registerUser = useCallback(async (): Promise<void> => {
    try {
      // Check if user already exists in Firestore to avoid unnecessary Cloud Function call
      const auth = getAuth();
      if (auth.currentUser) {
        const { getFirestore, doc, getDoc } = await import('firebase/firestore');
        const firestore = getFirestore();
        const userDoc = await getDoc(doc(firestore, 'users', auth.currentUser.uid));

        if (userDoc.exists() && userDoc.data()?.plaidUid) {
          // User already registered, skip Cloud Function call
          return;
        }
      }

      const functions = getFunctions();
      const registerUserFn = httpsCallable(functions, 'registerUser');
      await registerUserFn();
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const auth = getAuth();

      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        await registerUser();
        if (onSuccess) onSuccess();
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        await tryRegisterUser();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      const error = err as { code?: string; message?: string };
      console.error('Auth error:', error);

      if (error.code === 'auth/multi-factor-auth-required') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resolver = getMultiFactorResolver(getAuth(), err as any);
        setMfaResolver(resolver);
      } else {
        setError(getErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const tryRegisterUser = async () => {
    try {
      await registerUser();
    } catch (regError) {
      const error = regError as { code?: string; message?: string };
      if (error.code !== 'already-exists' && error.code !== 'permission-denied') {
        console.warn('User registration failed (may already exist):', error.message);
      }
    }
  };

  const getErrorMessage = (error: { code?: string; message?: string }): string => {
    const errorMessages: Record<string, string> = {
      'auth/user-not-found': 'Invalid email or password',
      'auth/wrong-password': 'Invalid email or password',
      'auth/email-already-in-use': 'Email already in use',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/invalid-email': 'Invalid email address',
    };

    return errorMessages[error.code || ''] || error.message || 'An error occurred';
  };

  const handleMfaSuccess = async () => {
    await tryRegisterUser();
    if (onSuccess) onSuccess();
    setMfaResolver(null);
  };

  const handleMfaCancel = () => {
    setMfaResolver(null);
  };

  // If MFA is required, show verification UI
  if (mfaResolver) {
    return (
      <MfaVerification
        resolver={mfaResolver}
        onSuccess={handleMfaSuccess}
        onCancel={handleMfaCancel}
      />
    );
  }

  return (
    <AuthCard title={isSignUp ? 'Create Account' : 'Easy CSP'}>
      {error && <ErrorAlert message={error} />}

      <form onSubmit={handleSignIn} className="space-y-4">
        <FormField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          autoComplete="email"
        />

        <FormField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
        />

        <Button
          type="submit"
          variant="primary"
          disabled={loading || !email || !password}
          className="w-full"
        >
          {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
          }}
          className="text-sm text-primary hover:underline"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </AuthCard>
  );
};

export default SignInPage;
