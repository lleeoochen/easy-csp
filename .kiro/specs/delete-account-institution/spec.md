# Delete Financial Account & Institution — Spec

## Decisions

| Action | Linked Account | Manual Account | Institution |
|--------|---------------|----------------|-------------|
| Single account | Archive (`archived: true`) | Hard delete (existing behavior) | N/A |
| Full institution | Hard delete accounts + institution | N/A | Plaid revoke + Secret delete + hard delete all accounts + institution doc |
| Transactions | Always kept | Always kept | Always kept |
| Funds check | Block if funds reference account | Block if funds reference account | Block if any funds reference any account under it |
| Restore | Set `archived: false` | N/A | Re-link via Plaid |

## Plaid Constraint

Plaid has no per-account removal API. `/item/remove` removes the entire Item (institution). Single linked account "deletion" is handled locally via archiving.

---

## Phase 1: Shared Types

- Add `archived?: boolean` to `FinancialAccount` interface
- Run `install:special` in both `easy-csp` and `easy-csp-cloud/functions`

---

## Phase 2: Cloud Function — `deleteFinancialInstitution`

**Type**: Callable (onCall)  
**Input**: `{ institutionId: string }` (Plaid Item ID)

**Steps**:
1. Validate caller is authenticated
2. Query institution doc where `uid == caller` and `institutionId == input`
3. Query all accounts where `uid == caller` and `institutionId == input`
4. Query funds where `accountId IN [account IDs]` → if any exist, return error with fund names
5. Call Plaid `/item/remove` (best-effort — log and continue if fails)
6. Delete secret from GCP Secret Manager keyed by institutionId (best-effort)
7. Batch delete all account docs
8. Delete institution doc
9. Return `{ success: true, deletedAccountIds: string[] }`

**Error responses**:
- `funds-exist`: "Cannot remove institution. Accounts have funds: [fund names]. Delete or reassign them first."
- `not-found`: "Institution not found."
- `permission-denied`: "You don't own this institution."

---

## Phase 3: Cloud Function — `archiveFinancialAccount`

**Type**: Callable (onCall)  
**Input**: `{ accountId: string }` (Firestore doc ID)

**Steps**:
1. Validate caller is authenticated
2. Get account doc, verify `uid == caller` and `isManual === false`
3. Query funds where `accountId == input` → if any exist, return error with fund names
4. Set `archived: true` on account doc
5. Return `{ success: true }`

**Error responses**:
- `funds-exist`: "Cannot archive account. It has funds: [fund names]. Delete or reassign them first."
- `not-found`: "Account not found."
- `invalid-argument`: "Manual accounts cannot be archived. Use delete instead."

---

## Phase 4: Update Sync Logic

In `TransactionActivity.ts`:

### `updateAccountBalances`
- After querying the account doc, check if `archived === true` → skip balance update

### `buildAccountIdMap`
- Exclude accounts where `archived === true` from the map
- Transactions for archived accounts will naturally be skipped (no entry in map → `continue`)

### `transformToFirestoreTransaction` loop (added + modified)
- Already handles missing map entries with a warning
- Change to `continue` (skip transaction) instead of fallback to Plaid account_id

---

## Phase 5: Frontend — Hooks & Services

### New hooks:
- `useArchiveFinancialAccount` — calls `archiveFinancialAccount` cloud function
- `useUnarchiveFinancialAccount` — sets `archived: false` via direct Firestore `updateDoc`
- `useDeleteFinancialInstitution` — calls `deleteFinancialInstitution` cloud function

### Cache invalidation:
- Invalidate accounts query
- Invalidate institutions query
- Invalidate net worth query

---

## Phase 6: Frontend — UI

### Account dropdown menu (linked accounts)
- Add "Archive Account" option

### Institution card header
- Add "Remove Institution" option (always visible, not just error state)

### Archive Account Dialog
- Simple confirmation
- Shows: account name, balance, institution name
- Warning: "This account will be hidden and no longer sync. Transactions will be kept."
- Blocked state: shows fund names that must be handled first

### Delete Institution Dialog
- Two-step confirmation: summary → type institution name to confirm
- Shows: institution name, list of accounts that will be deleted
- Warning: "This will disconnect from [Bank] and permanently delete all linked accounts. Transactions will be kept. This cannot be undone."
- Blocked state: shows fund names that must be handled first

### Archived accounts section
- Collapsible section at bottom of account list (or institution card)
- Shows archived accounts with "Restore" button
- Restore sets `archived: false`

### Net worth calculations
- Filter out `archived === true` accounts

---

## Edge Cases

| Case | Handling |
|------|----------|
| Plaid `/item/remove` fails | Log warning, continue with local cleanup |
| Secret Manager delete fails | Log warning, continue |
| Account has funds | Block with error message listing fund names |
| Institution has accounts with funds | Block with error message listing fund names |
| Sync runs for archived account | Skipped (not in accountIdMap) |
| User restores archived account | Next sync updates balance + resumes transactions |
| Manual account with transactions | Existing behavior: block deletion |
| Orphaned transactions (after institution delete) | Kept, `accountId` references deleted doc — acceptable |
