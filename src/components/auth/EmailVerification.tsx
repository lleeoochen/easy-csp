import React, { useState, useEffect } from 'react';
import { getAuth, sendEmailVerification } from 'firebase/auth';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../common/button';
import { AuthCard } from './AuthCard';
import { SignOutButton } from './SignOutButton';

export const EmailVerification: React.FC = () => {
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    // Add signin-page class to body for background
    document.body.classList.add('signin-page');
    return () => {
      document.body.classList.remove('signin-page');
    };
  }, []);

  useEffect(() => {
    // Check email verification status every 3 seconds
    const interval = setInterval(async () => {
      if (user && !checking) {
        try {
          await user.reload();
          if (user.emailVerified) {
            // Email verified, reload the page to proceed to MFA
            window.location.reload();
          }
        } catch (err) {
          console.error('Error checking email verification:', err);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user, checking]);

  const handleResendEmail = async () => {
    if (!user) return;

    try {
      setError(null);
      await sendEmailVerification(user);
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 5000);
    } catch (err) {
      console.error('Error sending verification email:', err);
      setError('Failed to send verification email. Please try again.');
    }
  };

  const handleCheckNow = async () => {
    if (!user) return;

    try {
      setChecking(true);
      setError(null);
      await user.reload();

      if (user.emailVerified) {
        window.location.reload();
      } else {
        setError('Email not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (err) {
      console.error('Error checking verification:', err);
      setError('Failed to check verification status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <AuthCard title="Verify Your Email">
          <div className="flex items-center justify-end mb-4">
            <SignOutButton />
          </div>

          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold mb-2">Check your inbox</p>
                <p className="text-sm text-muted">
                  We sent a verification email to <span className="font-medium text-foreground">{user?.email}</span>
                </p>
                <p className="text-sm text-muted mt-2">
                  Click the link in the email to verify your account.
                </p>
              </div>
            </div>
            <Button
              onClick={handleResendEmail}
              variant="secondary"
              className="w-full"
            >
              Resend Verification Email
            </Button>
          </div>

          {emailSent && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <p className="text-sm text-green-500">Verification email sent! Check your inbox.</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <Button
            onClick={handleCheckNow}
            disabled={checking}
            variant="primary"
            className="w-full"
          >
            {checking ? 'Checking...' : "I've Verified My Email"}
          </Button>

          <div className="mt-4">
            <div className="flex items-start gap-2 text-xs text-muted">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                After verifying your email, you'll be able to set up two-factor authentication for added security.
              </p>
            </div>
          </div>
        </AuthCard>
      </div>
    </div>
  );
};
