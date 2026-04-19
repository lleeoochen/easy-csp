# Field Names Summary: Net Worth Normalized Accounts

## Overview

This document summarizes the field naming strategy for the Net Worth Normalized Accounts feature. The strategy prioritizes **backward compatibility** and **migration simplicity** by preserving existing field names wherever possible.

---

## Key Principle

**Preserve existing field names to minimize migration complexity and maintain backward compatibility.**

---

## FinancialAccount Interface (New Top-Level Collection)

### Field Breakdown

| Field Name | Status | Description | Notes |
|------------|--------|-------------|-------|
| `id` | **NEW** | Firestore auto-generated doc ID | **PRIMARY KEY** for all references |
| `uid` | **NEW** | User ID | Ownership field |
| `accountId` | **EXISTING** | Plaid's account_id | **NOT** the Firestore doc ID |
| `accountName` | **EXISTING** | Account name | Kept as-is |
| `balance` | **EXISTING** | Current balance | Kept as-is |
| `accountType` | **EXISTING** | Account type enum | Kept as-is |
| `isManual` | **NEW** | Manual vs linked flag | Distinguishes account source |
| `institutionId` | **NEW** | Plaid Item ID | Matches Transaction.institutionId |
| `institutionName` | **NEW** | Institution name | Denormalized for display |
| `nickname` | **NEW** | User-defined name | Optional display override |
| `linkedFundId` | **NEW** | Fund linkage | Optional goal tracking |
| `lastSyncTimestamp` | **NEW** | Last sync time | Denormalized for display |

### Important Distinctions

**`id` vs `accountId`**:
- `id` = Firestore document ID (e.g., "abc123xyz") - **PRIMARY KEY**
- `accountId` = Plaid's account_id (e.g., "plaid_account_xyz") - **METADATA**

**Why keep both?**:
- `id` is the new primary key for all Firestore references
- `accountId` is kept for Plaid sync matching and backward compatibility
- During migration, existing `accountId` values are preserved as-is

---

## FinancialInstitution Interface (Updated)

### Changes

| Field Name | Status | Description |
|------------|--------|-------------|
| `docId` | **EXISTING** | Firestore document ID (optional) |
| `uid` | **EXISTING** | User ID |
| `institutionId` | **EXISTING** | Plaid Item ID |
| `institutionName` | **EXISTING** | Institution name |
| `status` | **EXISTING** | Sync status |
| `lastSyncTimestamp` | **EXISTING** | Last sync time |
| `cursor` | **EXISTING** | Plaid sync cursor |
| `plaidErrorCode` | **EXISTING** | Error details |
| `accounts` | **REMOVED** | Nested accounts array |

**Summary**: All existing fields preserved. Only change is removing the `accounts` array.

---

## Transaction Interface (Updated)

### Changes

| Field Name | Status | Description | Migration Impact |
|------------|--------|-------------|------------------|
| `id` | **EXISTING** | Transaction ID | No change |
| `uid` | **EXISTING** | User ID | No change |
| `institutionId` | **KEPT** | Plaid Item ID | **No change** - kept for backward compatibility |
| `accountId` | **UPDATED MEANING** | Now references Account.id | **Changed** - now references Firestore doc ID |
| `name` | **EXISTING** | Transaction name | No change |
| `amount` | **EXISTING** | Transaction amount | No change |
| `datetime` | **EXISTING** | Transaction datetime | No change |
| `plaidCategory` | **EXISTING** | Plaid category | No change |
| `category` | **EXISTING** | CSP category | No change |
| `hidden` | **EXISTING** | Hidden flag | No change |
| `fundId` | **EXISTING** | Fund linkage | No change |
| `splitParentId` | **EXISTING** | Split reference | No change |
| `nickname` | **EXISTING** | User nickname | No change |

### Key Points

**`institutionId` is KEPT**:
- Still references Plaid Item ID
- Provides backward compatibility
- Enables institution-level filtering
- No migration needed for this field

**`accountId` meaning UPDATED**:
- **Before**: Referenced Plaid's account_id (nested in institution)
- **After**: References FinancialAccount.id (Firestore doc ID from top-level collection)
- **Migration**: Update all transaction accountId values to new FinancialAccount.id

---

## Fund Interface (Updated)

### Changes

| Field Name | Status | Description | Migration Impact |
|------------|--------|-------------|------------------|
| `id` | **EXISTING** | Fund ID | No change |
| `name` | **EXISTING** | Fund name | No change |
| `uid` | **EXISTING** | User ID | No change |
| `type` | **EXISTING** | Fund type | No change |
| `targetAmount` | **EXISTING** | Target amount | No change |
| `financialInstitutionId` | **KEPT** | Plaid Item ID | **Kept** for backward compatibility |
| `accountId` | **UPDATED MEANING** | Now references Account.id | **Changed** - now references Firestore doc ID |
| `currentBalance` | **KEPT** | Manual balance | **Kept** for backward compatibility |

### Key Points

**`financialInstitutionId` is KEPT**:
- Maintained for backward compatibility
- Will be `undefined` for new account-linked funds
- Legacy funds keep this field populated

**`currentBalance` is KEPT**:
- Maintained for backward compatibility
- Will be `undefined` for new account-linked funds (balance comes from FinancialAccount.balance)
- Legacy manual funds keep this field populated

**`accountId` meaning UPDATED**:
- **Before**: Referenced Plaid's account_id (nested in institution)
- **After**: References FinancialAccount.id (Firestore doc ID from top-level collection)
- **Migration**: Update all fund accountId values to new FinancialAccount.id

---

## Migration Strategy Summary

### Step 1: Copy Nested Accounts to Top-Level

```typescript
// For each nested account in financialInstitutions.accounts[]
const newAccount = {
  // NEW FIELDS
  id: '<auto-generated by Firestore>',
  uid: institution.uid,
  isManual: false,
  institutionId: institution.institutionId,  // NEW: Plaid Item ID
  institutionName: institution.institutionName,
  lastSyncTimestamp: institution.lastSyncTimestamp,

  // EXISTING FIELDS (copied as-is)
  accountId: nestedAccount.accountId,        // Keep Plaid's account_id
  accountName: nestedAccount.accountName,
  balance: nestedAccount.balance,
  accountType: nestedAccount.accountType,
};
```

### Step 2: Update Transaction References

```typescript
// For each transaction
transaction.accountId = newAccount.id;  // Update to Firestore doc ID
// transaction.institutionId stays as-is (no change)
```

### Step 3: Update Fund References

```typescript
// For each fund
fund.accountId = newAccount.id;  // Update to Firestore doc ID
// fund.financialInstitutionId stays as-is (kept for backward compatibility)
// fund.currentBalance stays as-is (kept for backward compatibility)
```

### Step 4: Remove Nested Accounts

```typescript
// Remove accounts array from financialInstitutions
delete institution.accounts;
```

---

## Query Examples

### Before Migration (Nested Accounts)

```typescript
// Get institution with accounts
const institution = await getDoc(doc(firestore, 'financialInstitutions', institutionId));
const accounts = institution.data().accounts;  // Nested array

// Get transactions for an account
const transactions = await getDocs(query(
  collection(firestore, 'transactions'),
  where('institutionId', '==', institutionId),
  where('accountId', '==', plaidAccountId)  // Plaid's account_id
));
```

### After Migration (Top-Level FinancialAccounts)

```typescript
// Get all financial accounts for user
const accounts = await getDocs(query(
  collection(firestore, 'financialAccounts'),
  where('uid', '==', userId)
));

// Get transactions for a financial account
const transactions = await getDocs(query(
  collection(firestore, 'transactions'),
  where('accountId', '==', accountDocId)  // Firestore doc ID
));

// Get financial accounts for an institution (still possible)
const institutionAccounts = await getDocs(query(
  collection(firestore, 'financialAccounts'),
  where('uid', '==', userId),
  where('institutionId', '==', institutionId)
));
```

---

## Benefits of This Approach

1. **Minimal Breaking Changes**: Existing field names preserved wherever possible
2. **Simpler Migration**: Copy fields as-is, add new fields
3. **Backward Compatibility**: Keep institutionId in transactions, financialInstitutionId and currentBalance in funds
4. **Clear Semantics**: `id` is always Firestore doc ID, `accountId` is always Plaid's account_id
5. **Easier Debugging**: Field names match existing codebase, reducing confusion

---

## TypeScript Interface Updates

### Before (Nested Account)

```typescript
interface Account {
  accountId: string;         // Plaid's account_id
  accountName: string;
  balance: number;
  accountType: AccountType;
}

interface FinancialInstitution {
  institutionId: string;
  accounts: Account[];       // Nested array
}
```

### After (Top-Level FinancialAccount)

```typescript
interface FinancialAccount {
  id: string;                // NEW: Firestore doc ID (PRIMARY KEY)
  uid: string;               // NEW: User ID
  accountId: string;         // EXISTING: Plaid's account_id
  accountName: string;       // EXISTING
  balance: number;           // EXISTING
  accountType: AccountType;  // EXISTING
  isManual: boolean;         // NEW
  institutionId?: string;    // NEW: Plaid Item ID
  institutionName?: string;  // NEW
  lastSyncTimestamp?: number; // NEW
  nickname?: string;         // NEW
  linkedFundId?: string;     // NEW
}

interface FinancialInstitution {
  institutionId: string;     // EXISTING
  // accounts array removed
}
```

---

## Validation Checklist

After migration, verify:

- [ ] All nested accounts copied to top-level financialAccounts collection
- [ ] All top-level financial accounts have `id` (Firestore doc ID)
- [ ] All top-level financial accounts have `accountId` (Plaid's account_id for linked, generated for manual)
- [ ] All transactions updated: `accountId` references FinancialAccount.id
- [ ] All transactions kept: `institutionId` unchanged
- [ ] All funds updated: `accountId` references FinancialAccount.id
- [ ] All funds kept: `financialInstitutionId` and `currentBalance` unchanged
- [ ] No orphaned transactions (all accountId references valid)
- [ ] No orphaned funds (all accountId references valid)
- [ ] No duplicate financial accounts (same institutionId + accountId combination)

---

## Common Pitfalls to Avoid

1. **Don't confuse `id` with `accountId`**
   - `id` = Firestore doc ID (primary key)
   - `accountId` = Plaid's account_id (metadata)

2. **Don't remove `institutionId` from transactions**
   - Keep it for backward compatibility and filtering

3. **Don't remove `financialInstitutionId` from funds**
   - Keep it for backward compatibility

4. **Don't remove `currentBalance` from funds**
   - Keep it for backward compatibility

5. **Don't forget to update references**
   - Transaction.accountId must reference FinancialAccount.id (not Plaid's account_id)
   - Fund.accountId must reference FinancialAccount.id (not Plaid's account_id)

---

## Summary

This field naming strategy balances **backward compatibility** with **architectural improvement**. By preserving existing field names and adding new fields, we minimize migration complexity while enabling the normalized account architecture that unlocks the Net Worth feature and future enhancements.
