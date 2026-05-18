# Plaid Integration QA & Security Audit

**Date:** 2026-05-16
**Scope:** easy-csp (frontend) + easy-csp-cloud (backend Cloud Functions)
**Reference:** [Plaid Launch Checklist](https://plaid.com/docs/launch-checklist/), [Plaid Webhook Verification](https://plaid.com/docs/api/webhooks/webhook-verification/), [Plaid Security Best Practices](https://plaid.com/core-exchange/docs/security/)

---

## Summary

The integration is **well-architected** with proper separation of concerns (all Plaid API calls server-side, access tokens in GCP Secret Manager, cursor-based sync). The main gaps are around **missing SYNC_MUTATION_DURING_PAGINATION handling**, **no duplicate Item prevention**, **no Link session logging**, and **limited retry logic**.

---

## Audit Checklist

### 1. Security — Token & Secret Management

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1.1 | Access tokens never exposed client-side | ✅ PASS | All Plaid API calls in Cloud Functions. Frontend only receives `link_token`. |
| 1.2 | Access tokens stored securely | ✅ PASS | Stored in GCP Secret Manager (`SecretManagerClient.storeSecret`), keyed by `item_id`. |
| 1.3 | Old secret versions destroyed on update | ✅ PASS | `storeSecret(id, value, destroySecretVersions=true)` destroys old versions. |
| 1.4 | API keys (client_id, secret) in Secret Manager | ✅ PASS | Retrieved via `SecretManagerClient.getSecret("PLAID_CLIENT_ID_" + env)`. |
| 1.5 | Environment separation (sandbox vs production) | ✅ PASS | `isDevEnvironment` flag toggles `PLAID_ENV` between SANDBOX and PROD. |
| 1.6 | Access tokens deleted when Items removed | ✅ PASS | `AccountActivity.deleteInstitution` calls `SecretManagerClient.deleteSecret`. |
| 1.7 | Cloud Functions require authentication | ✅ PASS | All `onCall` functions call `FirestoreClient.validateAuth(request.auth?.uid)`. |
| 1.8 | CORS configured appropriately | ⚠️ REVIEW | CORS allows `localhost:5173` in production. Consider removing dev origins in prod builds. |
| 1.9 | Access token lifecycle (no expiry) | ✅ PASS | Plaid tokens don't expire. Stored persistently, overwritten on re-link, deleted on Item removal. |
| 1.10 | Tokens cleaned up on user account deletion | ❌ MISSING | If a user deletes their Easy CSP account, Plaid Items are not removed and secrets remain in Secret Manager. |
| 1.11 | MFA/2FA handled by Plaid Link | ✅ PASS | Plaid Link natively handles all MFA challenges (SMS, security questions, device auth). No app code needed. |
| 1.12 | OAuth redirect URI for mobile | ⚠️ INCOMPLETE | `PLAID_REDIRECT_URI` defaults to empty. OAuth institutions (Chase, etc.) won't work on mobile without this. |

### 2. Link Integration (Frontend)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 2.1 | Uses `link_token` (not deprecated `public_key`) | ✅ PASS | Uses `linkTokenCreate` → `link_token` flow. |
| 2.2 | `onSuccess` callback handled | ✅ PASS | Calls `exchangeForPlaidAccessToken` (add mode) or `markForResync` (update mode). |
| 2.3 | `onExit` callback handled | ⚠️ PARTIAL | Logs error but doesn't surface user-facing feedback or retry option. |
| 2.4 | `onEvent` callback handled | ✅ PASS | Logs all events with metadata. |
| 2.5 | Link session IDs logged for support | ❌ MISSING | `link_session_id` from callbacks not persisted. Plaid recommends logging for support tickets. |
| 2.6 | Duplicate Item prevention | ✅ FIXED | If institution already exists, updates access token, resets status to AwaitSync, reconciles accounts. |
| 2.7 | `products` parameter minimal | ✅ PASS | Only `[Products.Transactions]` requested. |
| 2.8 | `client_name` set correctly | ✅ PASS | Set to `"easy-csp"`. |
| 2.9 | OAuth support (redirect URI) | ⚠️ PARTIAL | `PLAID_REDIRECT_URI` is configurable but defaults to empty string. Needs to be set for OAuth institutions. |
| 2.10 | Update mode for expired Items | ✅ PASS | `createUpdateLinkToken` with `access_token` (no `products`). Triggered from error banners. |
| 2.11 | Pre-initialization of Link for lower latency | ❌ MISSING | Link token fetched on button click, not pre-loaded. Adds latency to user experience. |

### 3. Token Exchange (Backend)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 3.1 | Public token validated before exchange | ✅ PASS | Checks `if (!publicToken)` before calling Plaid. |
| 3.2 | Access token stored immediately after exchange | ✅ PASS | `SecretManagerClient.storeSecret` called right after `itemPublicTokenExchange`. |
| 3.3 | Item ID and access token associated with user | ✅ PASS | `FinancialInstitution` doc stores `uid` + `institutionId`. |
| 3.4 | Accounts fetched after exchange | ✅ PASS | `accountsGet` called immediately, accounts stored in Firestore. |
| 3.5 | Initial sync triggered after exchange | ✅ PASS | Institution created with `status: AwaitSync`, which triggers Firestore listener. |

### 4. Transaction Sync

| # | Item | Status | Notes |
|---|------|--------|-------|
| 4.1 | Uses `/transactions/sync` (not deprecated `/get`) | ✅ PASS | Uses `plaidClient.transactionsSync()` with cursor-based pagination. |
| 4.2 | Cursor persisted between syncs | ✅ PASS | Cursor stored in institution doc, only updated on successful sync. |
| 4.3 | Cursor NOT updated on failure | ✅ PASS | Error handler explicitly preserves cursor: "Do NOT update cursor". |
| 4.4 | Pagination loop handles `has_more` | ✅ PASS | `while (hasMore)` loop with `hasMore = data.has_more`. |
| 4.5 | `SYNC_MUTATION_DURING_PAGINATION` handled | ❌ MISSING | No handling for this error. Should restart pagination from the original cursor when this occurs. |
| 4.6 | Added/modified/removed all handled | ✅ PASS | All three arrays processed: adds, updates (merge), and deletes. |
| 4.7 | Pending → posted conversion handled | ✅ PASS | Detects `pending_transaction_id`, removes old pending transaction. |
| 4.8 | Batch writes respect Firestore limits | ✅ PASS | Chunks operations at `MAX_BATCH_SIZE = 450` (under 500 limit). |
| 4.9 | `count` parameter set to reduce pagination | ❌ MISSING | Default count (100) used. Setting `count: 500` would reduce pages and SYNC_MUTATION risk. |
| 4.10 | Empty cursor polling has timeout | ⚠️ CONCERN | Polls with `sleep(2000)` when cursor is empty, but no max retry/timeout. Could loop indefinitely. |

### 5. Webhook Handling

| # | Item | Status | Notes |
|---|------|--------|-------|
| 5.1 | Webhook endpoint configured | N/A | App uses Firestore trigger pattern instead of Plaid webhooks. |
| 5.2 | Webhook verification (JWT/JWK) | N/A | No webhooks used. |
| 5.3 | `SYNC_UPDATES_AVAILABLE` webhook | ⚠️ MITIGATED | No webhook, but `scheduledTransactionSync` runs every 4 hours to pull new transactions. |
| 5.4 | `PENDING_DISCONNECT` webhook | ❌ MISSING | App won't know about upcoming disconnections until the Item actually errors. |
| 5.5 | `PENDING_EXPIRATION` webhook | ❌ MISSING | Same as above — no proactive notification to users. |
| 5.6 | `NEW_ACCOUNTS_AVAILABLE` webhook | ❌ MISSING | New accounts added to an institution won't be detected. |

**Note:** The Firestore trigger approach works for user-initiated syncs but misses Plaid-initiated events. This is a significant gap for a production app.

### 6. Error Handling

| # | Item | Status | Notes |
|---|------|--------|-------|
| 6.1 | Plaid errors classified and stored | ✅ PASS | `getPlaidErrorCode` extracts error codes; stored in institution doc. |
| 6.2 | `ITEM_ERROR` types handled | ✅ PASS | Sets status to `InstitutionError` with error code. |
| 6.3 | `INSTITUTION_ERROR` types handled | ✅ PASS | Same handling as ITEM_ERROR. |
| 6.4 | Non-Plaid errors handled separately | ✅ PASS | Sets status to `SyncFailed` (distinct from `InstitutionError`). |
| 6.5 | User-facing error messages | ✅ PASS | `statusUtils.ts` maps all PlaidErrorCode values to user-friendly messages. |
| 6.6 | Retry logic for transient errors | ❌ MISSING | No automatic retry for network errors or rate limits. Single attempt only. |
| 6.7 | `ITEM_LOGIN_REQUIRED` triggers update mode | ✅ PASS | Error banner shows "Reconnect" button that opens Link in update mode. |
| 6.8 | Rate limiting handled | ❌ MISSING | No exponential backoff or rate limit detection. |

### 7. Item Management

| # | Item | Status | Notes |
|---|------|--------|-------|
| 7.1 | Items can be removed by users | ✅ PASS | `deleteFinancialInstitution` Cloud Function calls `/item/remove`. |
| 7.2 | Plaid `/item/remove` called on deletion | ✅ PASS | Best-effort call in `AccountActivity.deleteInstitution`. |
| 7.3 | Associated data cleaned up on removal | ✅ PASS | Accounts batch-deleted, secret deleted. |
| 7.4 | Transactions cleaned up on removal | ❌ MISSING | Transactions for deleted institution are NOT deleted. Orphaned data remains. |
| 7.5 | Inactive/errored Items cleaned up | ❌ MISSING | No automated cleanup of Items in error state for extended periods. |

### 8. Storage & Logging

| # | Item | Status | Notes |
|---|------|--------|-------|
| 8.1 | `item_id` stored and associated with user | ✅ PASS | Stored as `institutionId` in FinancialInstitution doc. |
| 8.2 | `account_id` stored | ✅ PASS | Stored in Account docs as `accountId`. |
| 8.3 | `request_id` logged | ❌ MISSING | Plaid response `request_id` not explicitly logged. Would help with support tickets. |
| 8.4 | `link_session_id` logged | ❌ MISSING | Not captured from Link callbacks. |
| 8.5 | Access tokens never logged | ✅ PASS | No logging of access token values found. |

### 9. Production Readiness

| # | Item | Status | Notes |
|---|------|--------|-------|
| 9.1 | Production environment configured | ✅ PASS | `PLAID_SECRET_PROD` and `PLAID_CLIENT_ID_PROD` in Secret Manager. |
| 9.2 | Sandbox-specific code removed | ✅ PASS | `testImportPlaidTransaction` gated by `FUNCTIONS_EMULATOR === "true"`. |
| 9.3 | Plaid API version pinned | ✅ PASS | `"Plaid-Version": "2020-09-14"` in headers. |
| 9.4 | Plaid API version up to date | ⚠️ REVIEW | Version `2020-09-14` is old. Consider upgrading to latest for new features/fixes. |

---

## Critical Findings (Action Required)

### HIGH Priority

1. **No `SYNC_MUTATION_DURING_PAGINATION` handling**
   - **Risk:** If Plaid data changes during pagination, the sync will fail silently or produce inconsistent data.
   - **Fix:** Catch this specific error and restart the pagination loop from the original cursor (not the intermediate one).
   - **File:** `TransactionActivity.ts` → `syncTransactionsWithPlaid()`

2. **~~No webhook integration for real-time updates~~ → FIXED: Scheduled sync every 4 hours**
   - Added `scheduledTransactionSync` Cloud Function (`0 */4 * * *`) that sets all Active institutions to AwaitSync, triggering the existing Firestore listener to sync with Plaid.
   - **Remaining gap:** `PENDING_DISCONNECT`, `PENDING_EXPIRATION`, and `NEW_ACCOUNTS_AVAILABLE` webhooks still not handled. Consider adding a webhook endpoint in the future for real-time responsiveness.

3. **~~No duplicate Item prevention~~ → FIXED: Update existing institution on re-link**
   - If a user links an institution that already exists, the system now updates the access token, resets status to AwaitSync, clears errors, and reconciles accounts (adds new, updates existing).
   - **File:** `FinancialInstitutionActivity.ts` → `exchangePublicToken()` + `reconcileAccounts()`

### MEDIUM Priority

4. **Empty cursor polling has no timeout**
   - **Risk:** If Plaid never returns data, the function will loop indefinitely (until Cloud Function timeout).
   - **Fix:** Add a max retry count (e.g., 10 attempts) or total timeout check.
   - **File:** `TransactionActivity.ts` → `syncTransactionsWithPlaid()`

5. **Transactions not cleaned up on institution deletion**
   - **Risk:** Orphaned transaction documents remain in Firestore after institution removal.
   - **Fix:** Add a batch delete of all transactions where `accountId` matches deleted accounts.
   - **File:** `AccountActivity.ts` → `deleteInstitution()`

6. **No Plaid cleanup on user account deletion**
   - **Risk:** If a user deletes their Easy CSP account, Plaid Items remain active (incurring subscription fees) and access tokens persist in Secret Manager.
   - **Fix:** Add a user deletion handler that iterates all user's institutions, calls `/item/remove` for each, and deletes their secrets.

7. **OAuth redirect URI not configured**
   - **Risk:** OAuth-based institutions (Chase, Capital One, etc.) won't work on mobile without a proper redirect URI.
   - **Fix:** Set `PLAID_REDIRECT_URI` to your app's universal link / app link. Required for mobile Capacitor builds.

8. **No retry logic for transient errors**
   - **Risk:** A single network blip fails the entire sync with no recovery.
   - **Fix:** Add exponential backoff retry (2-3 attempts) for 5xx errors and network timeouts.
   - **File:** `TransactionActivity.ts`

9. **CORS includes localhost in production**
   - **Risk:** Low security risk (Cloud Functions still require auth), but violates principle of least privilege.
   - **Fix:** Use environment-based CORS configuration.
   - **File:** `index.ts` → `CORS_ORIGINS`

### LOW Priority

10. **`link_session_id` and `request_id` not logged**
   - **Impact:** Harder to debug issues with Plaid support.
   - **Fix:** Log `link_session_id` from `onSuccess`/`onExit` callbacks; log `request_id` from API responses.

11. **Plaid API version is outdated (2020-09-14)**
   - **Impact:** Missing newer features and potential bug fixes.
   - **Fix:** Review [Plaid API changelog](https://plaid.com/docs/api/versioning/) and upgrade.

12. **No `count` parameter in transactionsSync**
    - **Impact:** More pagination pages = higher chance of `SYNC_MUTATION_DURING_PAGINATION`.
    - **Fix:** Add `count: 500` to the `TransactionsSyncRequest`.

13. **Link not pre-initialized**
    - **Impact:** Slightly slower UX when user clicks "Add Account".
    - **Fix:** Call `create()` on component mount to pre-initialize Link.

---

## What's Done Well

- **Clean architecture:** All Plaid API calls server-side, frontend only handles Link UI
- **Secret management:** GCP Secret Manager with version rotation
- **Cursor preservation:** Cursor never updated on failure — correct per Plaid docs
- **Error classification:** Distinct handling for Plaid errors vs system errors
- **User-facing error UX:** Error banners with contextual actions (retry, reconnect, remove)
- **Update mode:** Properly implemented for re-authentication flows
- **Batch operations:** Respects Firestore 500-operation limit with chunking
- **Pending→posted:** Correctly handles transaction lifecycle
- **Auth on all endpoints:** Every Cloud Function validates Firebase Auth
- **Item cleanup:** Calls `/item/remove` and deletes secrets on user-initiated removal

---

## Recommended Implementation Order

1. Add `SYNC_MUTATION_DURING_PAGINATION` error handling (quick fix, high impact)
2. Add `count: 500` to transactionsSync request (one-line fix)
3. Add empty cursor polling timeout (quick fix)
4. ~~Add duplicate Item check in `exchangePublicToken`~~ ✅ DONE — updates existing institution
5. Add transaction cleanup to `deleteInstitution` (medium effort)
6. ~~Implement scheduled sync function as webhook alternative~~ ✅ DONE — every 4 hours
7. Add retry logic with exponential backoff (medium effort)
8. Add `link_session_id` / `request_id` logging (low effort)
9. Environment-based CORS (low effort)
10. Evaluate Plaid API version upgrade (research needed)
