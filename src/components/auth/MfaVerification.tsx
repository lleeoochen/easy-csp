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

      // Clean up existing recaptcha verifier
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
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      window.recaptchaVerifier = new RecaptchaVerifier(getAuth(), 'recaptcha-container-mfa', {
        size: 'invisible',
      });

      const verificationIdResult = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        window.recaptchaVerifier
      );
      setVerificationId(verificationIdResult);
    } catch (error) {
      console.error('Error sending SMS:', error);
      setError('Failed to send SMS code. Please try again.');
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

    if (resolver.hints[newIndex]?.factorId === PhoneMultiFactorGenerator.FACTOR_ID) {
      await sendSmsCode(newIndex);
    }
  };

  // Auto-send SMS when component mounts with phone factor
  useEffect(() => {
    if (
      resolver.hints[selectedFactorIndex]?.factorId === PhoneMultiFactorGenerator.FACTOR_ID &&
      !verificationId &&
      !sendingSms
    ) {
      const timer = setTimeout(() => {
        sendSmsCode(selectedFactorIndex).catch(() => {
          setError('Failed to send SMS code. Please try again.');
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [resolver, selectedFactorIndex, verificationId, sendingSms, sendSmsCode]);

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
