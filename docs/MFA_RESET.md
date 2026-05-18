# MFA Reset Process

## When to Use

When a user loses access to their authenticator app (deleted the TOTP entry, lost phone, etc.) and cannot sign in.

## Prerequisites

- You must be signed in as `lleeoochen@gmail.com` (admin)
- The `resetUserMfa` Cloud Function must be deployed

## Deploy the Function

```bash
cd /mnt/c/Users/lleeo/Documents/GitHub/easy-csp-cloud/functions
firebase deploy --only functions:resetUserMfa --project easycsp
```

## Reset a User's MFA

### Option 1: Firebase Functions Shell

```bash
cd /mnt/c/Users/lleeo/Documents/GitHub/easy-csp-cloud/functions
firebase functions:shell --project easycsp
```

Then in the shell:

```js
resetUserMfa({ data: { targetUid: 'USER_UID_HERE' }, auth: { uid: 'YOUR_ADMIN_UID' } })
```

### Option 2: From the App (Browser Console)

While signed in as admin:

```js
const { httpsCallable, getFunctions } = await import('firebase/functions');
const resetMfa = httpsCallable(getFunctions(), 'resetUserMfa');
await resetMfa({ targetUid: 'USER_UID_HERE' });
```

## What It Does

1. Removes all MFA factors from Firebase Auth for the target user
2. Sets `mfaEnabled: false` and `mfaMethod: null` in their Firestore user document

## After Reset

The user can sign in with just email/password and will be prompted to re-enroll in MFA via the `RequireMfaEnrollment` screen.

## Finding a User's UID

Firebase Console → Authentication → Users → copy the UID column value.
