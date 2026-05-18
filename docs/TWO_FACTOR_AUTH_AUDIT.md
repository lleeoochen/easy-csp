# Two-Factor Authentication Audit

**Date:** 2026-05-17
**Scope:** easy-csp (frontend) — Firebase Auth MFA
**Current Implementation:** Firebase Identity Platform (phone SMS + TOTP)

---

## Summary

The current 2FA implementation is **functional but fragile**. It supports both phone SMS and TOTP (authenticator app) enrollment, with SMS as the mandatory method during onboarding. The primary pain points are reCAPTCHA lifecycle management, SMS delivery reliability, and state synchronization between Firebase Auth and Firestore. The implementation has accumulated workarounds for edge cases that make it brittle.

---

## Current Implementation Audit

### Architecture

| Component | File | Purpose |
|-----------|------|---------|
| Mandatory enrollment | `RequireMfaEnrollment.tsx` | Forces phone SMS enrollment after sign-up |
| Settings enrollment | `TwoFactorSettings.tsx` | Optional TOTP enrollment/unenrollment |
| Sign-in verification | `MfaVerification.tsx` | Handles MFA challenge during sign-in (phone + TOTP) |
| App gate | `App.tsx` | Checks `mfaEnabled` in Firestore, blocks access if false |
| Sign-in flow | `SignInPage.tsx` | Catches `auth/multi-factor-auth-required` error |

### Flow

```
Sign Up → Email Verification → Phone SMS Enrollment (mandatory) → App Access
                                                                      ↓
                                                          Settings: Add TOTP (optional)
```

### Issues Found

| # | Issue | Severity | Notes |
|---|-------|----------|-------|
| 1 | reCAPTCHA lifecycle is fragile | 🔴 High | ~40 lines of cleanup/re-creation code in `MfaVerification.tsx`. Widget leaks between renders, expires silently, fails on mobile. |
| 2 | `auth/requires-recent-login` is a dead end | 🔴 High | Reauthentication code is commented out. User told to sign out and back in — breaks the mandatory enrollment flow. |
| 3 | State drift between Firebase Auth and Firestore | 🟡 Medium | If Firestore write fails after successful enrollment, user is enrolled in Auth but `mfaEnabled` stays false → infinite enrollment loop. |
| 4 | `window.location.reload()` after enrollment | 🟡 Medium | Brute-force state reset. Loses in-memory state, poor UX. |
| 5 | Dual MFA methods with no migration path | 🟡 Medium | Mandatory enrollment is phone-only, settings allows TOTP. Unenroll removes ALL factors at once. No way to switch from phone → TOTP without disabling entirely. |
| 6 | SMS delivery is unreliable | 🟡 Medium | Carrier delays, international formatting issues, quota limits. Multiple error handlers for SMS-specific failures. |
| 7 | No recovery codes | 🔴 High | If user loses phone AND authenticator app, they're permanently locked out. No backup codes generated during enrollment. |
| 8 | reCAPTCHA CSS hacks for mobile | 🟠 Low | Inline `<style>` tags scaling reCAPTCHA widget. Fragile across devices. |
| 9 | No rate limiting on verification attempts | 🟡 Medium | User can submit incorrect codes indefinitely (Firebase may rate-limit server-side, but no client-side feedback). |
| 10 | Console.log statements in production | 🟠 Low | Extensive debug logging (`console.log('Starting SMS enrollment...')`) left in. |

---

## Approaches Comparison

### Approach 1: Firebase TOTP-Only (Recommended)

**Keep Firebase Auth MFA but drop phone/SMS entirely. Use TOTP (authenticator app) as the sole method.**

| Pros | Cons |
|------|------|
| No reCAPTCHA needed | Users must install an authenticator app |
| No SMS delivery issues | Slightly higher onboarding friction |
| Works offline | No fallback if user loses authenticator |
| Free (no per-SMS cost) | Less familiar to non-technical users |
| More secure (immune to SIM-swap) | |
| 80% of code already exists in `TwoFactorSettings.tsx` | |
| Eliminates the entire reCAPTCHA edge case class | |

**Effort:** ~2-4 hours. Promote `TwoFactorSettings` TOTP logic to mandatory enrollment, delete all phone/reCAPTCHA code.

**Implementation:**
1. Replace `RequireMfaEnrollment` with TOTP enrollment (QR code → verify code → done)
2. Remove all `RecaptchaVerifier`, `PhoneAuthProvider`, `PhoneMultiFactorGenerator` imports
3. Remove `recaptcha-container` divs and CSS hacks
4. Add recovery codes generation during enrollment
5. Simplify `MfaVerification` to TOTP-only path

---

### Approach 2: Third-Party SMS Service (Twilio Verify / Vonage Verify)

**Replace Firebase phone MFA with a dedicated verification API. Handle 2FA at the application layer instead of Firebase Auth's built-in MFA.**

| Pros | Cons |
|------|------|
| No reCAPTCHA required | Adds a third-party dependency |
| Reliable SMS delivery (carrier-grade) | Per-verification cost (~$0.05/SMS) |
| Built-in rate limiting and fraud detection | Must manage 2FA state yourself |
| Supports SMS + WhatsApp + voice fallback | Firebase Auth won't enforce MFA at sign-in |
| Simple API (send code → verify code) | Need custom middleware to gate access |
| International phone support out of the box | |

**Effort:** ~1-2 days. Need a Cloud Function to send/verify codes, frontend changes minimal.

**How it works:**
1. User signs in with email/password (no Firebase MFA)
2. App calls Cloud Function → Twilio Verify sends SMS
3. User enters code → Cloud Function verifies with Twilio
4. On success, set `mfaVerified: true` in Firestore or a custom claim
5. App checks this flag before granting access

**Services:**
- [Twilio Verify](https://www.twilio.com/verify) — $0.05/verification, fraud detection, multi-channel
- [Vonage Verify](https://developer.vonage.com/en/verify/overview) — $0.053/verification, automatic retries + voice fallback
- [AWS SNS + Pinpoint](https://aws.amazon.com/sns/) — cheaper at scale, more setup

**Tradeoff:** Firebase Auth no longer enforces MFA at the protocol level. You're implementing "soft" 2FA — the app gates access, but the Firebase Auth session itself is valid without it. This is fine for most apps but less secure than Firebase's built-in MFA which blocks the auth token entirely.

---

### Approach 3: Firebase Phone MFA with Fixes (Status Quo+)

**Keep the current approach but fix the identified issues.**

| Pros | Cons |
|------|------|
| No migration needed | reCAPTCHA remains fundamentally fragile |
| Users already enrolled | SMS delivery still unreliable |
| Firebase enforces MFA at auth level | Ongoing maintenance burden |
| | Per-SMS cost from Firebase |
| | Still no recovery codes |

**Effort:** ~1 day to fix critical issues, ongoing maintenance.

**Fixes needed:**
1. Add reauthentication flow (un-comment and fix the `reauthenticate` function)
2. Add Firestore write retry/rollback if enrollment succeeds but Firestore fails
3. Replace `window.location.reload()` with state update
4. Add recovery codes
5. Add client-side rate limiting on verification attempts
6. Remove console.log statements

---

### Approach 4: Passkeys / WebAuthn (Future-Forward)

**Replace password + 2FA with passkeys. Single-step authentication that's phishing-resistant.**

| Pros | Cons |
|------|------|
| No passwords, no 2FA codes | Firebase support is limited (not built-in MFA) |
| Phishing-resistant by design | Requires custom auth integration |
| Best UX (biometric/device unlock) | Not all users have compatible devices |
| No SMS costs | Complex implementation |
| Industry direction (Google, Apple, Microsoft) | Fallback flow still needed |

**Effort:** ~1-2 weeks. Requires `@simplewebauthn/server` + `@simplewebauthn/browser`, custom Cloud Functions, credential storage in Firestore.

**Not recommended yet** — Firebase doesn't natively support passkeys as an MFA factor. Would require significant custom auth work. Revisit when Firebase adds native support.

---

### Approach 5: Email OTP as 2FA

**Send a one-time code to the user's verified email instead of phone.**

| Pros | Cons |
|------|------|
| No reCAPTCHA | Less secure than TOTP (email can be compromised) |
| No phone number needed | Delivery delays possible |
| Free (Firebase email sending) | Not a true "second factor" if email = primary auth |
| Simple implementation | |
| Works for all users | |

**Effort:** ~4-6 hours. Cloud Function generates OTP, stores in Firestore with TTL, sends via Firebase email or SendGrid.

**Not recommended** — email as 2FA is weak because if the attacker has the email password, they have both factors. Only suitable as a fallback, not primary 2FA.

---

## Recommendation

| Priority | Approach | Rationale |
|----------|----------|-----------|
| **1st choice** | TOTP-only (Approach 1) | Eliminates all reCAPTCHA/SMS issues. Most code already exists. More secure. Free. |
| **2nd choice** | Twilio Verify (Approach 2) | If SMS is a hard requirement for user accessibility. Reliable, simple API, no reCAPTCHA. |
| **Avoid** | Status quo fixes (Approach 3) | Polishing a fundamentally fragile approach. reCAPTCHA will keep causing issues. |
| **Future** | Passkeys (Approach 4) | Wait for Firebase native support. |

### Migration Plan (if switching to TOTP-only)

1. Add TOTP enrollment as mandatory screen (new users)
2. Existing phone-enrolled users continue working (MfaVerification already handles both)
3. Add a "Switch to Authenticator App" option in settings
4. After all users migrate, remove phone MFA code
5. Generate recovery codes during enrollment

---

## Recovery Codes (Missing from ALL current approaches)

Regardless of which approach is chosen, **recovery codes must be added**:

- Generate 8-10 single-use backup codes during enrollment
- Store hashed codes in Firestore
- Show codes once, prompt user to save them
- Allow sign-in with recovery code if primary 2FA is unavailable
- Each code can only be used once

This is critical for a financial app — users cannot be permanently locked out of their spending data.
