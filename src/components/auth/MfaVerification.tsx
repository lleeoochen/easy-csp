import React, { useState } from 'react';
import { TotpMultiFactorGenerator } from 'firebase/auth';
import { Button } from '@/components/common/button';
import { FormField } from './FormField';
import { ErrorAlert } from './ErrorAlert';
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

  const handleVerification = async () => {
    if (!verificationCode) return;

    try {
      setError(null);
      const hint = resolver.hints[0];
      const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, verificationCode);
      await resolver.resolveSignIn(assertion);
      onSuccess();
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || 'Invalid verification code');
    }
  };

  return (
    <AuthCard title="Two-Factor Authentication">
      <p className="text-sm text-muted mb-4">
        Enter the code from your authenticator app.
      </p>

      {error && <ErrorAlert message={error} />}

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
          disabled={verificationCode.length !== 6}
          variant="primary"
          className="flex-1"
        >
          Verify
        </Button>
        <Button onClick={onCancel} variant="secondary">
          Cancel
        </Button>
      </div>
    </AuthCard>
  );
};
