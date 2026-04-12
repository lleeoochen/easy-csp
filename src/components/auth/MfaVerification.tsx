import React, { useEffect, useState, useCallback } from 'react';
import {
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  TotpMultiFactorGenerator,
  RecaptchaVerifier,
  getAuth
} from 'firebase/auth';
import { Button } from '../common/button';
import { FormField } from './FormField';
import { ErrorAlert } from './ErrorAlert';
import { InfoAlert } from './InfoAlert';
import { AuthCard } from './AuthCard';

type MultiFactorResolver = ReturnType<typeof import('firebase/auth').getMultiFactorResolver>;

interface MfaVerificationProps {
  resolver: MultiFactorResolver;
  onSuccess: () => void;
  onCancel: () => void;
}

export const MfaVerification: React.FC<MfaVerificationProps> = ({
  resolver,
  onSuccess,
  onCancel,
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedFactorIndex, setSelectedFactorIndex] = useState(0);
  const [sendingSms, setSendingSms] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const sendSmsCode = useCallback(async (factorIndex: number) => {
    setSendingSms(true);
    setError(null);

    try {
      const selectedHint = resolver.hints[factorIndex];
      const phoneInfoOptions = {
        multiFactorHint: selectedHint,
        session: resolver.session,
      };

      const phoneAuthProvider = new PhoneAuthProvider(getAuth());

      // Clean up existing recaptcha verifier more thoroughly
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.log('Error clearing recaptcha:', e);
        }
        window.recaptchaVerifier = undefined;
      }

      // Clear the container completely
      const container = document.getElementById('recaptcha-container-mfa');
      if (container) {
        container.innerHTML = '';
        // Remove any data attributes that might prevent re-rendering
        container.removeAttribute('data-sitekey');
        container.removeAttribute('data-callback');
      }

      // Wait a bit longer for cleanup
      await new Promise(resolve => setTimeout(resolve, 200));

      // Create fresh recaptcha verifier
      window.recaptchaVerifier = new RecaptchaVerifier(getAuth(), 'recaptcha-container-mfa', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          setError('reCAPTCHA expired. Please try again.');
        },
        'error-callback': (error: Error) => {
          console.error('reCAPTCHA error:', error);
        }
      });

      const verificationIdResult = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        window.recaptchaVerifier
      );
      setVerificationId(verificationIdResult);
    } catch (error) {
      console.error('Error sending SMS:', error);
      console.error('Error details:', {
        code: (error as any)?.code,
        message: (error as any)?.message,
        name: (error as any)?.name,
        stack: (error as any)?.stack
      });
      const firebaseError = error as { code?: string; message?: string };

      if (firebaseError.code === 'auth/invalid-app-credential') {
        setError(
          'reCAPTCHA verification failed. For development, please start Firebase emulators or add a test phone number in Firebase Console.'
        );
      } else if (firebaseError.code === 'auth/quota-exceeded') {
        setError('SMS quota exceeded. Please try again later.');
      } else if (firebaseError.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a few minutes and try again.');
      } else if (firebaseError.code === 'auth/captcha-check-failed') {
        setError('reCAPTCHA verification failed. Please try again.');
      } else if (firebaseError.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number. Please contact support.');
      } else if ((error as any)?.message?.includes('already been rendered')) {
        setError('Please refresh the page and try again.');
      } else {
        const errorMsg = firebaseError.message || 'Failed to send SMS code. Please try again.';
        setError(`${errorMsg}${firebaseError.code ? ` (${firebaseError.code})` : ''}`);
      }
      throw error;
    } finally {
      setSendingSms(false);
    }
  }, [resolver]);

  const handleVerification = async () => {
    if (!verificationCode) return;

    try {
      setError(null);
      const selectedHint = resolver.hints[selectedFactorIndex];

      let assertion;
      if (selectedHint.factorId === PhoneMultiFactorGenerator.FACTOR_ID) {
        if (!verificationId) {
          setError('No verification ID. Please try sending the code again.');
          return;
        }
        const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
        assertion = PhoneMultiFactorGenerator.assertion(cred);
      } else if (selectedHint.factorId === TotpMultiFactorGenerator.FACTOR_ID) {
        assertion = TotpMultiFactorGenerator.assertionForSignIn(selectedHint.uid, verificationCode);
      } else {
        throw new Error('Unsupported MFA factor');
      }

      await resolver.resolveSignIn(assertion);
      cleanupRecaptcha();
      onSuccess();
    } catch (error) {
      const err = error as { message?: string };
      console.error('MFA verification error:', error);
      setError(err.message || 'Invalid verification code');
    }
  };

  const cleanupRecaptcha = () => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.log('Error clearing recaptcha:', e);
      }
      window.recaptchaVerifier = undefined;
    }

    const container = document.getElementById('recaptcha-container-mfa');
    if (container) {
      container.innerHTML = '';
      container.removeAttribute('data-sitekey');
      container.removeAttribute('data-callback');
    }
  };

  const handleCancel = () => {
    cleanupRecaptcha();
    onCancel();
  };

  const handleFactorChange = async (newIndex: number) => {
    setSelectedFactorIndex(newIndex);
    setVerificationCode('');
    setError(null);
    setHasInitialized(false);

    if (resolver.hints[newIndex]?.factorId === PhoneMultiFactorGenerator.FACTOR_ID) {
      setHasInitialized(true);
      await sendSmsCode(newIndex);
    }
  };

  // Auto-send SMS when component mounts with phone factor
  useEffect(() => {
    let isMounted = true;

    const shouldSendSms =
      !hasInitialized &&
      resolver.hints[selectedFactorIndex]?.factorId === PhoneMultiFactorGenerator.FACTOR_ID &&
      !verificationId &&
      !sendingSms;

    if (shouldSendSms) {
      setHasInitialized(true);

      sendSmsCode(selectedFactorIndex).catch(() => {
        if (isMounted) {
          setError('Failed to send SMS code. Please try again.');
        }
      });
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInitialized, selectedFactorIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRecaptcha();
    };
  }, []);

  const selectedHint = resolver.hints[selectedFactorIndex];
  const isPhoneFactor = selectedHint?.factorId === PhoneMultiFactorGenerator.FACTOR_ID;

  return (
    <AuthCard title="Two-Factor Authentication">
      <p className="text-sm text-muted mb-4">
        {isPhoneFactor
          ? 'Enter the verification code sent to your phone'
          : 'Enter the code from your authenticator app'}
      </p>

      <div id="recaptcha-container-mfa" />

      {error && <ErrorAlert message={error} />}

      {resolver.hints.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select verification method:</label>
          <select
            value={selectedFactorIndex}
            onChange={(e) => handleFactorChange(Number(e.target.value))}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={sendingSms}
          >
            {resolver.hints.map((hint, index) => (
              <option key={index} value={index}>
                {hint.factorId === 'phone'
                  ? `Phone: ${(hint as { phoneNumber?: string }).phoneNumber || 'Unknown'}`
                  : 'Authenticator App'}
              </option>
            ))}
          </select>
        </div>
      )}

      {sendingSms && <InfoAlert message="Sending verification code..." />}

      <FormField
        label="Verification Code"
        type="text"
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
        placeholder="Enter 6-digit code"
        maxLength={6}
        autoFocus
      />

      <div className="flex gap-2 mt-4">
        <Button
          onClick={handleVerification}
          disabled={verificationCode.length !== 6 || sendingSms}
          variant="primary"
          className="flex-1"
        >
          Verify
        </Button>
        <Button onClick={handleCancel} disabled={sendingSms} variant="secondary">
          Cancel
        </Button>
      </div>

      <div className="mt-4 text-center text-sm">
        {isPhoneFactor && verificationId ? (
          <span>
            Didn't receive code?{' '}
            <button
              onClick={() => sendSmsCode(selectedFactorIndex)}
              disabled={sendingSms}
              className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Resend
            </button>
          </span>
        ) : (
          <span className="text-muted invisible">Didn't receive code? Resend</span>
        )}
      </div>
    </AuthCard>
  );
};

// Extend window type for MFA properties
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}
