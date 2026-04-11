import React, { useState, useEffect } from 'react';
import { getAuth, multiFactor, TotpMultiFactorGenerator, TotpSecret } from 'firebase/auth';
import { doc, getDoc, updateDoc, getFirestore } from 'firebase/firestore';
import { USERS_COLLECTION, type User } from '@easy-csp/shared-types';
import { Shield, Key, AlertCircle, CheckCircle } from 'lucide-react';

export const TwoFactorSettings: React.FC = () => {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaMethod, setMfaMethod] = useState<'phone' | 'totp' | undefined>();
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [totpSecret, setTotpSecret] = useState<TotpSecret | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const auth = getAuth();
  const firestore = getFirestore();
  const user = auth.currentUser;

  useEffect(() => {
    loadMfaStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMfaStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userDoc = await getDoc(doc(firestore, USERS_COLLECTION, user.uid));
      const userData = userDoc.data() as User | undefined;

      if (userData) {
        setMfaEnabled(userData.mfaEnabled || false);
        setMfaMethod(userData.mfaMethod);
      }

      // Also check Firebase Auth MFA enrollment
      const enrolledFactors = multiFactor(user).enrolledFactors;
      if (enrolledFactors.length > 0) {
        setMfaEnabled(true);
      }
    } catch (err) {
      console.error('Error loading MFA status:', err);
      setError('Failed to load 2FA status');
    } finally {
      setLoading(false);
    }
  };

  const startTotpEnrollment = async () => {
    if (!user) return;

    try {
      setEnrolling(true);
      setError(null);

      const multiFactorSession = await multiFactor(user).getSession();
      const totpSecretObj = await TotpMultiFactorGenerator.generateSecret(multiFactorSession);

      setTotpSecret(totpSecretObj);
    } catch (err) {
      console.error('Error starting TOTP enrollment:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start 2FA enrollment';
      setError(errorMessage);
      setEnrolling(false);
    }
  };

  const completeTotpEnrollment = async () => {
    if (!user || !totpSecret) return;

    try {
      setError(null);

      const multiFactorAssertion = TotpMultiFactorGenerator.assertionForEnrollment(
        totpSecret,
        verificationCode
      );

      await multiFactor(user).enroll(multiFactorAssertion, 'Authenticator App');

      // Update Firestore
      await updateDoc(doc(firestore, USERS_COLLECTION, user.uid), {
        mfaEnabled: true,
        mfaEnrolledAt: Date.now(),
        mfaMethod: 'totp',
      });

      setMfaEnabled(true);
      setMfaMethod('totp');
      setSuccess('2FA enabled successfully!');
      setTotpSecret(null);
      setVerificationCode('');
      setEnrolling(false);
    } catch (err) {
      console.error('Error completing TOTP enrollment:', err);
      const errorMessage = err instanceof Error ? err.message : 'Invalid verification code';
      setError(errorMessage);
    }
  };

  const unenroll2FA = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const enrolledFactors = multiFactor(user).enrolledFactors;

      for (const factor of enrolledFactors) {
        await multiFactor(user).unenroll(factor);
      }

      // Update Firestore
      await updateDoc(doc(firestore, USERS_COLLECTION, user.uid), {
        mfaEnabled: false,
        mfaMethod: null,
      });

      setMfaEnabled(false);
      setMfaMethod(undefined);
      setSuccess('2FA disabled successfully');
    } catch (err) {
      console.error('Error unenrolling 2FA:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to disable 2FA';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cancelEnrollment = () => {
    setEnrolling(false);
    setTotpSecret(null);
    setVerificationCode('');
    setError(null);
  };

  if (loading) {
    return (
      <div className="p-4 bg-surface rounded-lg">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
        </div>
        <p className="text-sm text-muted mt-2">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-surface rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          <p className="text-sm text-green-500">{success}</p>
        </div>
      )}

      {!enrolling && !mfaEnabled && (
        <div>
          <p className="text-sm text-muted mb-4">
            Add an extra layer of security to your account by enabling two-factor authentication.
          </p>
          <button
            onClick={startTotpEnrollment}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Key className="w-4 h-4" />
            Enable 2FA with Authenticator App
          </button>
        </div>
      )}

      {enrolling && totpSecret && (
        <div className="space-y-4">
          <div className="p-4 bg-background rounded-lg border border-border">
            <h4 className="font-semibold mb-2">Step 1: Scan QR Code</h4>
            <p className="text-sm text-muted mb-3">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            <div className="flex justify-center mb-3">
              <img
                src={totpSecret.generateQrCodeUrl('Easy CSP', user?.email || '')}
                alt="QR Code"
                className="w-48 h-48"
              />
            </div>
            <p className="text-xs text-muted">
              Or manually enter this key: <code className="bg-background px-2 py-1 rounded">{totpSecret.secretKey}</code>
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Step 2: Enter Verification Code</h4>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={6}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={completeTotpEnrollment}
              disabled={verificationCode.length !== 6}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Verify and Enable
            </button>
            <button
              onClick={cancelEnrollment}
              className="px-4 py-2 bg-surface border border-border rounded-lg hover:bg-background transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {mfaEnabled && (
        <div className="space-y-4">
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-semibold text-green-500">2FA is enabled</p>
              <p className="text-xs text-muted">
                Method: {mfaMethod === 'totp' ? 'Authenticator App' : mfaMethod === 'phone' ? 'Phone SMS' : 'Unknown'}
              </p>
            </div>
          </div>
          <button
            onClick={unenroll2FA}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Disable 2FA
          </button>
        </div>
      )}
    </div>
  );
};
