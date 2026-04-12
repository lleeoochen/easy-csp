import React, { useState, useEffect, useRef } from 'react';
import { getAuth, multiFactor, PhoneAuthProvider, PhoneMultiFactorGenerator, RecaptchaVerifier } from 'firebase/auth';
import { doc, getFirestore, getDoc, setDoc } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { USERS_COLLECTION } from '@easy-csp/shared-types';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './common/button';
import { Input } from './common/input';
import { SignOutButton } from './auth/SignOutButton';

export const RequireMfaEnrollment: React.FC = () => {
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);
  // const [password, setPassword] = useState('');
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  const auth = getAuth();
  const firestore = getFirestore();
  const user = auth.currentUser;

  useEffect(() => {
    // Add signin-page class to body for background
    document.body.classList.add('signin-page');
    return () => {
      document.body.classList.remove('signin-page');
    };
  }, []);

  useEffect(() => {
    // Initialize reCAPTCHA when component mounts
    if (!recaptchaVerifier.current) {
      recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved, allow user to proceed
        },
        'expired-callback': () => {
          // Response expired, ask user to solve reCAPTCHA again
        }
      });
    }

    return () => {
      // Cleanup only when component unmounts
      if (recaptchaVerifier.current) {
        recaptchaVerifier.current.clear();
        recaptchaVerifier.current = null;
      }
    };
  }, [auth]);

  // const reauthenticate = async () => {
  //   if (!user || !password) return;

  //   try {
  //     setError(null);
  //     const credential = EmailAuthProvider.credential(user.email!, password);
  //     await reauthenticateWithCredential(user, credential);
  //     setNeedsReauth(false);
  //     setPassword('');
  //     // Now try enrollment again
  //     await startEnrollment();
  //   } catch (err: any) {
  //     console.error('Reauthentication error:', err);
  //     setError(err.message || 'Invalid password');
  //   }
  // };

  const startEnrollment = async () => {
    if (!user || !phoneNumber || !recaptchaVerifier.current) return;

    try {
      setEnrolling(true);
      setError(null);

      console.log('Starting SMS enrollment...');

      // Ensure phone number has country code
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+1' + formattedPhone;
      }

      console.log('Phone number:', formattedPhone);
      console.log('User:', user.email);

      const multiFactorSession = await multiFactor(user).getSession();
      console.log('Got MFA session');

      const phoneInfoOptions = {
        phoneNumber: formattedPhone,
        session: multiFactorSession,
      };

      const phoneAuthProvider = new PhoneAuthProvider(auth);
      console.log('Calling verifyPhoneNumber...');

      const verificationIdResult = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        recaptchaVerifier.current
      );

      console.log('Verification ID received');
      setVerificationId(verificationIdResult);
    } catch (err) {
      console.error('Error starting SMS enrollment:', err);
      console.error('Error details:', {
        code: err?.code,
        message: err?.message,
        name: err?.name,
        stack: err?.stack
      });

      if (err.code === 'auth/requires-recent-login') {
        setError('Your session has expired. Please sign out and sign in again to set up 2FA.');
        setNeedsReauth(true);
      } else if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format. Please include country code (e.g., +1 for US).');
      } else if (err.code === 'auth/quota-exceeded') {
        setError('SMS quota exceeded. Please try again later or contact support.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a few minutes and try again, or contact support.');
      } else if (err.code === 'auth/captcha-check-failed') {
        setError('reCAPTCHA verification failed. Please try again.');
      } else {
        const errorMessage = err.message || 'Failed to start 2FA enrollment';
        setError(`${errorMessage}${err.code ? ` (${err.code})` : ''}`);
      }
      setEnrolling(false);
    }
  };

  const completeEnrollment = async () => {
    if (!user || !verificationId) return;

    try {
      setError(null);

      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

      await multiFactor(user).enroll(multiFactorAssertion, 'Phone Number');

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
        // Don't block MFA enrollment if registration fails
      }

      // Update Firestore - use setDoc with merge to create if doesn't exist
      await setDoc(doc(firestore, USERS_COLLECTION, user.uid), {
        mfaEnabled: true,
        mfaEnrolledAt: Date.now(),
        mfaMethod: 'sms',
      }, { merge: true });

      // Reload the page to trigger App.tsx to re-check MFA status
      window.location.reload();
    } catch (err) {
      console.error('Error completing SMS enrollment:', err);
      const errorMessage = err instanceof Error ? err.message : 'Invalid verification code';
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <style>{`
        /* Scale down reCAPTCHA challenge popup on mobile */
        @media screen and (max-width: 350px) {
          .g-recaptcha {
            transform: scale(0.85);
            transform-origin: 0 0;
          }
        }
      `}</style>
      <div className="max-w-lg w-full bg-surface rounded-lg shadow-lg p-6 bg-card overflow-visible flex flex-col">
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
            For your security, Easy CSP requires two-factor authentication. This adds an extra layer of protection to your financial data.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-500">{error}</p>
              {needsReauth && (
                <div className="mt-2">
                  <SignOutButton />
                </div>
              )}
            </div>
          </div>
        )}

        {!verificationId && (
          <div>
            <p className="text-sm text-muted mb-4">
              Enter your phone number to receive verification codes via SMS. Include country code (e.g., +1 for US).
            </p>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <div className="my-4">
              <style>{`
                #recaptcha-container iframe {
                  top: auto;
                  max-width: 100% !important;
                  transform: scale(0.9);
                  transform-origin: 0 0;
                }
                @media (min-width: 640px) {
                  #recaptcha-container iframe {
                    transform: scale(1);
                  }
                }
                .g-recaptcha {
                  transform: scale(0.77);
                }
              `}</style>
              <div id="recaptcha-container"></div>
            </div>
            <Button
              variant='primary'
              onClick={startEnrollment}
              disabled={!phoneNumber || enrolling}
              className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50"
            >
              Send Verification Code
            </Button>
          </div>
        )}

        {verificationId && (
          <div className="space-y-2">
            <div className="py-4">
              <h4 className="font-semibold mb-2">Enter Verification Code</h4>
              <p className="text-sm text-muted mb-3">
                We sent a 6-digit code to {phoneNumber}
              </p>
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
              variant='primary'
              onClick={completeEnrollment}
              disabled={verificationCode.length !== 6}
              className='w-full'
            >
              Complete Setup
            </Button>
          </div>
        )}

        <div className="mt-4">
          <div className="flex items-start gap-2 text-xs text-muted">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Once set up, you'll need to enter a code sent to your phone each time you sign in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
