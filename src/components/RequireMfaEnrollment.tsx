import React, { useState, useEffect } from 'react';
import { getAuth, multiFactor, TotpMultiFactorGenerator, TotpSecret } from 'firebase/auth';
import { doc, getFirestore, getDoc } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { USERS_COLLECTION } from '@easy-csp/shared-types';
import { Shield, AlertCircle, CheckCircle, Key } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from './common/button';
import { Input } from './common/input';
import { SignOutButton } from './auth/SignOutButton';

export const RequireMfaEnrollment: React.FC = () => {
  const [totpSecret, setTotpSecret] = useState<TotpSecret | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  const auth = getAuth();
  const firestore = getFirestore();
  const user = auth.currentUser;

  useEffect(() => {
    document.body.classList.add('signin-page');
    return () => {
      document.body.classList.remove('signin-page');
    };
  }, []);

  const startEnrollment = async () => {
    if (!user) return;

    try {
      setEnrolling(true);
      setError(null);

      const multiFactorSession = await multiFactor(user).getSession();
      const secret = await TotpMultiFactorGenerator.generateSecret(multiFactorSession);
      setTotpSecret(secret);
    } catch (err) {
      const firebaseError = err as { code?: string; message?: string };

      if (firebaseError.code === 'auth/requires-recent-login') {
        setError('Your session has expired. Please sign out and sign in again to set up 2FA.');
      } else {
        setError(firebaseError.message || 'Failed to start 2FA enrollment');
      }
      setEnrolling(false);
    }
  };

  const completeEnrollment = async () => {
    if (!user || !totpSecret) return;

    try {
      setError(null);

      const multiFactorAssertion = TotpMultiFactorGenerator.assertionForEnrollment(
        totpSecret,
        verificationCode
      );

      await multiFactor(user).enroll(multiFactorAssertion, 'Authenticator App');

      // Register user in backend if not already registered
      try {
        const userDoc = await getDoc(doc(firestore, USERS_COLLECTION, user.uid));
        if (!userDoc.exists() || !userDoc.data()?.plaidUid) {
          const functions = getFunctions();
          const registerUserFn = httpsCallable(functions, 'registerUser');
          await registerUserFn();
        }
      } catch (regError) {
        console.warn('User registration failed (may already exist):', regError);
      }

      // Reload to trigger App.tsx re-check
      window.location.reload();
    } catch (err) {
      const firebaseError = err as { code?: string; message?: string };
      setError(firebaseError.message || 'Invalid verification code. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-surface rounded-lg shadow-lg p-6 bg-card flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h2 className="text-2xl font-bold">Two-Factor Authentication Required</h2>
          </div>
        </div>

        <div className="ml-auto">
          <SignOutButton />
        </div>

        <div className="my-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm">
            For your security, Easy CSP requires two-factor authentication. You'll need an authenticator app like Google Authenticator, Authy, or 1Password.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {!totpSecret && (
          <div>
            <p className="text-sm text-muted mb-4">
              Set up your authenticator app to secure your account.
            </p>
            <Button
              variant="primary"
              onClick={startEnrollment}
              disabled={enrolling}
              className="w-full flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" />
              {enrolling ? 'Setting up...' : 'Set Up Authenticator App'}
            </Button>
          </div>
        )}

        {totpSecret && (
          <div className="space-y-4">
            <div className="p-4 bg-background rounded-lg border border-border">
              <h4 className="font-semibold mb-2">Step 1: Scan QR Code</h4>
              <p className="text-sm text-muted mb-3">
                Scan this QR code with your authenticator app.
              </p>
              <div className="flex justify-center mb-3">
                <QRCodeSVG
                  value={`otpauth://totp/${encodeURIComponent('Easy CSP')}:${encodeURIComponent(user?.email || '')}?secret=${totpSecret.secretKey}&issuer=${encodeURIComponent('Easy CSP')}`}
                  size={192}
                />
              </div>
              <p className="text-xs text-muted text-center">
                Or manually enter: <code className="bg-background px-2 py-1 rounded break-all">{totpSecret.secretKey}</code>
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Step 2: Enter Verification Code</h4>
              <Input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit code"
                maxLength={6}
                autoFocus
              />
            </div>

            <Button
              variant="primary"
              onClick={completeEnrollment}
              disabled={verificationCode.length !== 6}
              className="w-full"
            >
              Verify and Enable 2FA
            </Button>
          </div>
        )}

        <div className="mt-4">
          <div className="flex items-start gap-2 text-xs text-muted">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Once set up, you'll enter a code from your authenticator app each time you sign in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
