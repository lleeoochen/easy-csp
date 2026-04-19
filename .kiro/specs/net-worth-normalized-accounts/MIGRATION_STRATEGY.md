# Migration Strategy: Simplified Approach

## Overview

Since this is test data and we're okay with removing existing transactions and funds, the migration is drastically simplified. We only need to:

1. Copy nested accounts to top-level `financialAccounts/` collection
2. Remove `accounts[]` array from `financialInstitutions` documents
3. Delete all transactions (optional - can leave orphaned)
4. Delete all funds (optional - can leave orphaned)

---

## Migration Complexity: LOW

**Timeline: 2-3 days**
- Write migration script: 1 day
- Test on staging/emulator: 1 day
- Deploy and execute: 1 day

**Execution time: Minutes** (not hours)

---

## Migration Script

```typescript
/**
 * Simplified migration for test data
 * Copies accounts to top-level collection and optionally deletes transactions/funds
 */
async function simpleMigration(uid: string): Promise<void> {
  const firestore = getFirestore();

  console.log(`Starting migration for user: ${uid}`);

  // Step 1: Get all financial institutions for user
  const institutionsQuery = query(
    collection(firestore, 'financialInstitutions'),
    where('uid', '==', uid)
  );
  const institutionsSnapshot = await getDocs(institutionsQuery);

  let accountsCreated = 0;

  // Step 2: For each institution, copy nested accounts to top-level
  for (const institutionDoc of institutionsSnapshot.docs) {
    const institution = institutionDoc.data() as FinancialInstitution;

    // Skip if no accounts
    if (!institution.accounts || institution.accounts.length === 0) {
      console.log(`No accounts found for institution: ${institution.institutionName}`);
      continue;
    }

    console.log(`Migrating ${institution.accounts.length} accounts from ${institution.institutionName}`);

    // Create top-level account for each nested account
    for (const nestedAccount of institution.accounts) {
      const newAccount = {
        // NEW FIELDS
        uid: institution.uid,
        isManual: false,
        institutionId: institution.institutionId,
        institutionName: institution.institutionName,
        lastSyncTimestamp: institution.lastSyncTimestamp,

        // EXISTING FIELDS (copied as-is)
        accountId: nestedAccount.accountId,
        accountName: nestedAccount.accountName,
        balance: nestedAccount.balance,
        accountType: nestedAccount.accountType,
      };

      await addDoc(collection(firestore, 'financialAccounts'), newAccount);
      accountsCreated++;
    }

    // Step 3: Remove accounts array from institution
    await updateDoc(
      doc(firestore, 'financialInstitutions', institutionDoc.id),
      {
        accounts: deleteField(),
      }
    );

    console.log(`Removed accounts array from ${institution.institutionName}`);
  }

  console.log(`Created ${accountsCreated} top-level accounts`);

  // Step 4: Delete all transactions (optional)
  const transactionsQuery = query(
    collection(firestore, 'transactions'),
    where('uid', '==', uid)
  );
  const transactionsSnapshot = await getDocs(transactionsQuery);

  for (const txnDoc of transactionsSnapshot.docs) {
    await deleteDoc(doc(firestore, 'transactions', txnDoc.id));
  }

  console.log(`Deleted ${transactionsSnapshot.size} transactions`);

  // Step 5: Delete all funds (optional)
  const fundsQuery = query(
    collection(firestore, 'funds'),
    where('uid', '==', uid)
  );
  const fundsSnapshot = await getDocs(fundsQuery);

  for (const fundDoc of fundsSnapshot.docs) {
    await deleteDoc(doc(firestore, 'funds', fundDoc.id));
  }

  console.log(`Deleted ${fundsSnapshot.size} funds`);
  console.log(`Migration complete for user: ${uid}`);
}
```

---

## Migration Steps

### 1. Prepare Migration Function

Create `easy-csp-cloud/functions/src/migration/simpleMigration.ts` with the script above.

### 2. Test with Emulator

```bash
# Start Firebase emulator
cd easy-csp-cloud
npm run serve

# In another terminal, trigger migration
# (via HTTP callable function or admin script)
```

**Test checklist:**
- [ ] Nested accounts copied to `financialAccounts/` collection
- [ ] All accounts have correct fields (uid, accountId, accountName, etc.)
- [ ] `accounts[]` array removed from `financialInstitutions` documents
- [ ] Transactions deleted (if desired)
- [ ] Funds deleted (if desired)
- [ ] No errors in logs

### 3. Deploy Migration Function

```bash
cd easy-csp-cloud
firebase deploy --only functions:simpleMigration
```

### 4. Execute Migration

**Option A: HTTP Callable (recommended for test data)**
```typescript
// From frontend or admin script
const simpleMigration = httpsCallable(functions, 'simpleMigration');
await simpleMigration({ uid: 'user-id-here' });
```

**Option B: Run for all users**
```typescript
// Admin script
const users = await admin.auth().listUsers();
for (const user of users.users) {
  await simpleMigration(user.uid);
}
```

### 5. Verify Migration

**Check Firestore console:**
- [ ] `financialAccounts/` collection exists with documents
- [ ] Each account has all required fields
- [ ] `financialInstitutions` documents no longer have `accounts[]` array
- [ ] `transactions/` collection is empty (or deleted)
- [ ] `funds/` collection is empty (or deleted)

### 6. Deploy Updated Code

```bash
# Deploy updated Cloud Functions (Plaid sync, etc.)
cd easy-csp-cloud
firebase deploy --only functions

# Deploy updated frontend
cd ../easy-csp
npm run build
npm run deploy  # or gh-pages deploy
```

---

## What Happens After Migration

### Users Need To:

1. **Re-sync Plaid accounts** to get fresh transactions
   - Existing Plaid connections still work
   - Just trigger a sync to populate new transactions

2. **Recreate funds** (if they had any)
   - Old funds are deleted
   - Users can create new funds and link to accounts

### What Works Immediately:

- View all accounts on Net Worth page
- See current balances (preserved from migration)
- Create manual accounts
- Link/unlink accounts to funds
- Plaid sync creates new transactions with correct references

---

## Rollback Plan

If something goes wrong:

### Option 1: Restore from Backup
```bash
# Restore Firestore from backup
gcloud firestore import gs://your-backup-bucket/backup-folder
```

### Option 2: Manual Rollback
1. Copy accounts back into `financialInstitutions.accounts[]` arrays
2. Delete `financialAccounts/` collection
3. Restore old code

**Note:** Since we're deleting transactions/funds anyway, rollback is less critical. Worst case, re-run migration script.

---

## Pros and Cons

### Pros ✅
- **Super simple** - no complex reference updates
- **Fast execution** - minutes instead of hours
- **Low risk** - minimal data transformation
- **Easy to test** - straightforward logic
- **Easy to rollback** - just restore institutions with accounts arrays

### Cons ❌
- **Lose transaction history** - users need to re-sync
- **Lose fund data** - users need to recreate funds
- **Need to re-link** - if users had funds linked to accounts

### Trade-off Assessment

For test data, this is the **right approach**. For production with real user data, you'd want the full migration that preserves transactions and funds.

---

## Estimated Effort

| Task | Time |
|------|------|
| Write migration script | 4 hours |
| Test with emulator | 2 hours |
| Deploy and execute | 1 hour |
| Verify results | 1 hour |
| **Total** | **1 day** |

---

## Alternative: Even Simpler Approach

If you're okay with **completely starting fresh**:

1. **Delete all Firestore data** (via console or script)
2. **Deploy new code** (uses `financialAccounts/` collection)
3. **Users re-link Plaid accounts** from scratch

This takes **30 minutes** but requires users to reconnect everything.

---

## Recommendation

Use the migration script above. It's simple, preserves Plaid connections, and only takes a day to implement and test. Users just need to re-sync to get fresh transactions.
