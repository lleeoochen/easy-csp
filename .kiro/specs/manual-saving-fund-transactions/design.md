# Design Document: Manual Saving Fund Transactions

## Overview

This feature extends the Easy CSP app's saving fund functionality to support manual saving funds that are not tied to Plaid-connected financial accounts. The design enables users to create manual saving funds, add/edit/delete manual transactions, and track progress toward savings goals without requiring bank account integration.

The implementation follows the existing architecture patterns in the codebase:
- React Query for data fetching and mutations
- Direct Firestore SDK access from the frontend
- Service layer pattern for Firestore operations
- Reuse of existing UI components (TransactionEditDialog, SavingTargetSelector)
- Firestore transactions for atomic balance updates

Key design decisions:
1. **Fund Type Detection**: A saving fund is "manual" when `accountId` is `undefined`, and "account-based" when `accountId` is defined
2. **Balance Tracking**: Manual funds store balance in a `currentBalance` field, updated transactionally on transaction create/edit/delete
3. **Transaction Source**: Manual transactions have `null` or `undefined` `institutionId` and `accountId`
4. **Component Reuse**: Extend existing TransactionEditDialog to support manual transaction creation/editing
5. **Atomic Updates**: Use Firestore transactions to ensure balance consistency

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐        ┌──────────────────┐          │
│  │ TransactionsPage │        │  SavingFundsPage │          │
│  │                  │        │                  │          │
│  │ - Add Txn Button │        │ - Fund Rows      │          │
│  │ - Txn List       │        │ - Add Txn Button │          │
│  └────────┬─────────┘        │ - Set Balance Btn│          │
│           │                  └────────┬─────────┘          │
│           │                           │                     │
│           └───────────┬───────────────┘                     │
│                       │               │                     │
│              ┌────────▼────────┐     │                     │
│              │ TransactionEdit │     │                     │
│              │     Dialog      │     │                     │
│              │                 │     │                     │
│              │ - Create/Edit   │     │                     │
│              │ - Delete        │     │                     │
│              │ - Validation    │     │                     │
│              └────────┬────────┘     │                     │
│                       │              │                     │
│              ┌────────▼──────────────▼──┐                  │
│              │   SetBalanceDialog       │                  │
│              │                          │                  │
│              │ - Input new balance      │                  │
│              │ - Validation             │                  │
│              └────────┬─────────────────┘                  │
│                       │                                     │
│         ┌─────────────┴─────────────┐                      │
│         │                           │                      │
│    ┌────▼────────┐         ┌────────▼────────┐            │
│    │useTransactions│       │useFunds │            │
│    │  (React Query)│       │  (React Query)  │            │
│    └────┬────────┘         └────────┬────────┘            │
│         │                           │                      │
│    ┌────▼────────────┐     ┌────────▼────────────┐        │
│    │ TransactionsService│   │SavingTargetsService│        │
│    │                    │   │                    │        │
│    │ - createTransaction│   │ - listSavingTargets│        │
│    │ - updateTransaction│   │ - addSavingTarget  │        │
│    │ - deleteTransaction│   │ - setFundBalance   │        │
│    └────┬───────────────┘   └────────┬───────────┘        │
│         │                            │                     │
└─────────┼────────────────────────────┼─────────────────────┘
          │                            │
          │    ┌───────────────────────▼──────┐
          │    │                               │
          └────►      Firestore Database       │
               │                               │
               │  Collections:                 │
               │  - transactions               │
               │  - savingTargets              │
               │  - financialInstitutions      │
               └───────────────────────────────┘
```

### Data Flow

#### Creating a Manual Transaction

1. User clicks "Add Transaction" button (from TransactionsPage or SavingFundsPage)
2. TransactionEditDialog opens with empty or pre-populated fields
3. User enters transaction details (name, amount, date, category, optional fund)
4. User clicks "Save"
5. TransactionEditDialog validates input
6. Service layer creates transaction document in Firestore
7. If transaction has savingTargetId AND fund is manual (no accountId):
   - Firestore transaction atomically updates fund's currentBalance
8. React Query invalidates cache and refetches data
9. UI updates to show new transaction

#### Editing a Manual Transaction

1. User clicks on a manual transaction
2. TransactionEditDialog opens with editable fields
3. User modifies fields (amount, date, category, fund)
4. User clicks "Save"
5. Service layer updates transaction document
6. If savingTargetId changed or amount changed AND fund is manual:
   - Firestore transaction atomically updates affected fund(s) currentBalance
7. React Query updates cache
8. UI reflects changes

#### Deleting a Manual Transaction

1. User clicks "Delete" in TransactionEditDialog
2. Confirmation prompt appears
3. User confirms deletion
4. Service layer deletes transaction document
5. If transaction had savingTargetId AND fund is manual:
   - Firestore transaction atomically updates fund's currentBalance (subtract amount)
6. React Query invalidates cache
7. UI removes transaction from list

#### Setting Manual Fund Balance Directly

1. User clicks "Set Balance" button on a manual fund row (only visible for manual funds)
2. SetBalanceDialog opens showing current balance as reference
3. User enters new balance value (can be positive, negative, or zero)
4. User clicks "Save"
5. SetBalanceDialog validates input:
   - Must be a valid number (not NaN, not empty)
   - Can be any numeric value including negative
6. useSetFundBalance mutation calls SavingTargetsService.setFundBalance()
7. Service layer validates:
   - User is authenticated
   - Fund exists and belongs to user
   - Fund is manual (accountId is undefined)
8. Service layer updates fund's currentBalance field directly using updateDoc
9. React Query invalidates savingTargets cache and refetches data
10. UI updates to show new balance
11. Existing transactions remain unchanged (no transaction documents modified)
12. Future transaction operations add/subtract from the new balance value

**Key Difference from Transaction-Based Updates:**
- Direct balance set uses simple `updateDoc` (single document update)
- Transaction-based updates use Firestore `runTransaction` (atomic multi-document update)
- Direct balance set does not create, modify, or delete any transaction documents
- This allows users to initialize or adjust fund balance without creating historical transactions

## Components and Interfaces

### Frontend Components

#### TransactionEditDialog (Extended)

**Purpose**: Modal dialog for creating and editing transactions (both manual and Plaid)

**Props**:
```typescript
interface TransactionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;  // null for create mode
  prefilledSavingTargetId?: string; // Pre-populate fund when opened from fund row
}
```

**New Behavior**:
- Detect if transaction is manual by checking `institutionId === null/undefined`
- Enable/disable fields based on transaction source (manual vs Plaid)
- Show "Delete" button only for manual transactions
- Display transaction source indicator (manual vs institution name)
- Validate required fields for manual transactions
- Support creation mode when `transaction === null`

**Fields**:
- Name (editable for manual, read-only for Plaid)
- Amount (editable for manual, read-only for Plaid)
- Date (editable for manual, read-only for Plaid)
- Category (editable for both)
- Saving Fund (editable for both, optional)
- Nickname (editable for both, optional)

#### SavingFundRow (Extended)

**Purpose**: Display individual saving fund with progress and actions

**New Features**:
- Add "Add Transaction" button for manual funds
- Add "Set Balance" button for manual funds only (not shown for account-based funds)
- "Add Transaction" button opens TransactionEditDialog with pre-populated savingTargetId
- "Set Balance" button opens SetBalanceDialog for direct balance adjustment
- Visual indicator to distinguish manual vs account-based funds (e.g., icon or badge)

**Conditional Rendering**:
- "Set Balance" button: `if (isManualFund(savingTarget))` → show button
- "Add Transaction" button: shown for manual funds (optional for account-based funds)
- Button visibility logic uses `accountId === undefined` to detect manual funds

#### SetBalanceDialog (New)

**Purpose**: Modal dialog for directly setting a manual fund's balance

**Props**:
```typescript
interface SetBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  savingTarget: UI_SavingTargetAndBalance;  // The manual fund to update
}
```

**Behavior**:
- Display current balance as reference
- Accept any numeric input (positive, negative, or zero)
- Validate that input is a valid number
- On save, call service layer to update `currentBalance` field
- Show success/error feedback
- Close dialog on successful save

**Fields**:
- Current Balance (read-only, for reference)
- New Balance (numeric input, required)

**Validation**:
- Must be a valid number (not NaN, not empty, not Infinity)
- Can be positive, negative, or zero
- Display error message if validation fails
- Disable save button until valid input provided

**User Experience**:
- Clear labeling: "Current Balance: $X.XX" (read-only)
- Input label: "New Balance" with currency formatting
- Success feedback: Toast notification "Balance updated successfully"
- Error feedback: Toast notification with specific error message
- Dialog closes automatically on successful save

#### TransactionsPage (Extended)

**Purpose**: Display and manage all transactions

**New Feature**:
- Add "Add Transaction" button at page level
- Visual indicator on manual transaction rows
- Manual transactions appear alongside Plaid transactions

### Service Layer

#### TransactionsService (Extended)

**New Methods**:

```typescript
class TransactionsService {
  /**
   * Creates a new manual transaction
   * If savingTargetId is provided and fund is manual, atomically updates currentBalance
   */
  public static async createTransaction(
    transaction: Omit<Transaction, 'id' | 'uid'>
  ): Promise<{ success: boolean; transaction?: Transaction & { id: string }; message?: string }>;

  /**
   * Deletes a manual transaction
   * If transaction has savingTargetId and fund is manual, atomically updates currentBalance
   */
  public static async deleteTransaction(
    transactionId: string
  ): Promise<{ success: boolean; message?: string }>;

  /**
   * Updates a transaction (extended to handle balance updates)
   * If savingTargetId or amount changed and fund is manual, atomically updates currentBalance
   */
  public static async updateTransaction(
    transactionId: string,
    updates: Partial<Transaction>
  ): Promise<void>; // Signature already exists, will extend implementation
}
```

**Implementation Details**:
- Use Firestore `runTransaction` for atomic balance updates
- Check if fund is manual by reading SavingTarget document and checking `accountId === undefined`
- Calculate balance delta based on operation (create: +amount, delete: -amount, update: difference)
- Handle edge cases: fund doesn't exist, fund changed from manual to account-based, etc.

#### SavingTargetsService (Extended)

**Modified Methods**:

```typescript
class SavingTargetsService {
  /**
   * Creates a new saving target (extended to support manual funds)
   * If accountId is undefined, initializes currentBalance to 0
   */
  public static async addSavingTarget(
    name: string,
    targetAmount: number,
    financialInstitutionId?: string,  // Optional for manual funds
    accountId?: string                // Optional for manual funds
  ): Promise<{ success: boolean; savingTarget?: SavingTarget & { id: string }; message?: string }>;

  /**
   * Lists all saving targets (extended to return currentBalance for manual funds)
   * For manual funds, returns currentBalance field
   * For account-based funds, returns account balance from institution
   */
  public static async listSavingTargets(): Promise<{
    success: boolean;
    savingTargets?: UI_SavingTargetAndBalance[];
    message?: string
  }>; // Signature already exists, will extend implementation

  /**
   * Sets the balance of a manual fund directly (new method)
   * Only works for manual funds (accountId is undefined)
   * Updates currentBalance field to the specified value
   */
  public static async setFundBalance(
    savingTargetId: string,
    newBalance: number
  ): Promise<{ success: boolean; message?: string }>;
}
```

**Implementation Details for setFundBalance**:
- Verify the fund exists and belongs to the authenticated user
- Verify the fund is manual (accountId is undefined)
- Update the `currentBalance` field to the exact value provided
- Return error if fund is account-based or doesn't exist
- **No Firestore transaction needed** (single document update, no balance calculation)
- Use `updateDoc` with `prepareFirestoreData` to handle the update
- This is simpler than transaction-based balance updates because:
  - Only one document is modified (the fund document)
  - No transaction documents are created, modified, or deleted
  - No atomic multi-document coordination required
  - Direct field replacement, not delta calculation

**Example Implementation**:
```typescript
public static async setFundBalance(
  savingTargetId: string,
  newBalance: number
): Promise<{ success: boolean; message?: string }> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    return { success: false, message: 'User not authenticated' };
  }

  const fundRef = doc(firestore, SAVING_TARGETS_COLLECTION, savingTargetId);
  const fundSnap = await getDoc(fundRef);

  if (!fundSnap.exists()) {
    return { success: false, message: 'Saving fund not found' };
  }

  const fundData = fundSnap.data() as SavingTarget;

  if (fundData.uid !== user.uid) {
    return { success: false, message: 'Unauthorized access to saving fund' };
  }

  if (fundData.accountId !== undefined) {
    return { success: false, message: 'Cannot set balance for account-based funds' };
  }

  await updateDoc(fundRef, prepareFirestoreData({ currentBalance: newBalance }));

  return { success: true };
}
```

### React Query Hooks

#### useTransactions (Extended)

**New Mutations**:

```typescript
export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transaction: Omit<Transaction, 'id' | 'uid'>) =>
      TransactionsService.createTransaction(transaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['savingTargets'] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transactionId: string) =>
      TransactionsService.deleteTransaction(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['savingTargets'] });
    },
  });
};
```

#### useFunds (Extended)

**Modified Mutations**:

```typescript
export const useAddSavingTarget = () => {
  const queryClient = useQueryClient();
  const { data: institutions = [] } = useFinancialInstitutions();

  return useMutation({
    mutationFn: async ({
      name,
      targetAmount,
      selectedAccount
    }: {
      name: string;
      targetAmount: number;
      selectedAccount?: string  // Optional for manual funds
    }) => {
      // If selectedAccount is undefined, create manual fund
      if (!selectedAccount) {
        const result = await SavingTargetsService.addSavingTarget(
          name,
          targetAmount
        );
        if (!result.success) throw new Error(result.message ?? 'Failed to add saving target');
        return {
          ...result.savingTarget!,
          institutionName: 'Manual Entry',
          accountName: 'Manual Entry',
          currentAmount: 0,
        };
      }

      // Otherwise, create account-based fund (existing logic)
      const { institutionId, accountId } = parseAccountOptionValue(selectedAccount);
      // ... existing implementation
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SAVING_TARGETS_QUERY_KEY }),
  });
};

export const useSetFundBalance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ savingTargetId, newBalance }: { savingTargetId: string; newBalance: number }) =>
      SavingTargetsService.setFundBalance(savingTargetId, newBalance),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVING_TARGETS_QUERY_KEY });
    },
  });
};
```

## Data Models

### Updated SavingTarget Type

```typescript
export interface SavingTarget {
  name: string;                             // Saving target name
  uid: string;                              // User ID who owns this saving target
  targetAmount: number;                     // Target amount to save
  financialInstitutionId?: string;          // Optional: Financial institution ID (undefined for manual funds)
  accountId?: string;                       // Optional: Account ID (undefined for manual funds)
  currentBalance?: number;                  // Optional: For manual funds, tracks balance (updated transactionally)
}
```

**Key Changes**:
- `financialInstitutionId` and `accountId` are now optional
- New `currentBalance` field for manual funds
- Fund type determined by presence/absence of `accountId`

**Type Guards**:

```typescript
// Helper function to determine if a fund is manual
export const isManualFund = (fund: SavingTarget): boolean => {
  return fund.accountId === undefined;
};

// Helper function to determine if a transaction is manual
export const isManualTransaction = (transaction: Transaction): boolean => {
  return transaction.institutionId === undefined || transaction.institutionId === null;
};
```

### Transaction Type (No Changes Required)

The existing `Transaction` interface already supports manual transactions:

```typescript
export interface Transaction {
  id: string;
  uid: string;
  institutionId: string;      // Will be null/undefined for manual transactions
  accountId: string;          // Will be null/undefined for manual transactions
  name: string;
  amount: number;
  datetime: number;
  plaidCategory: string;
  category: string;
  hidden: boolean;
  savingTargetId?: string;
  splitParentId?: string;
  nickname?: string;
}
```

**Manual Transaction Characteristics**:
- `institutionId`: `null` or `undefined`
- `accountId`: `null` or `undefined`
- `plaidCategory`: Empty string or "Manual"
- All other fields function identically to Plaid transactions

### UI Types

```typescript
// Extended UI type for saving targets with balance information
export interface UI_SavingTargetAndBalance extends SavingTarget {
  id: string;
  currentAmount: number;        // Balance from account OR currentBalance field
  institutionName: string;      // Institution name OR "Manual Entry"
  accountName: string;          // Account name OR "Manual Entry"
}
```

## Firestore Transaction Patterns

### Atomic Balance Update Pattern

When creating, updating, or deleting a manual transaction that affects a manual fund's balance:

```typescript
import { runTransaction, doc, getDoc } from 'firebase/firestore';

// Example: Creating a manual transaction
await runTransaction(firestore, async (transaction) => {
  // 1. Create the transaction document
  const transactionRef = doc(collection(firestore, TRANSACTIONS_COLLECTION));
  transaction.set(transactionRef, newTransactionData);

  // 2. If savingTargetId is provided, check if fund is manual
  if (newTransactionData.savingTargetId) {
    const fundRef = doc(firestore, SAVING_TARGETS_COLLECTION, newTransactionData.savingTargetId);
    const fundSnap = await transaction.get(fundRef);

    if (fundSnap.exists()) {
      const fundData = fundSnap.data() as SavingTarget;

      // 3. If fund is manual (no accountId), update currentBalance
      if (fundData.accountId === undefined) {
        const currentBalance = fundData.currentBalance ?? 0;
        const newBalance = currentBalance + newTransactionData.amount;
        transaction.update(fundRef, { currentBalance: newBalance });
      }
    }
  }
});
```

### Balance Update Scenarios

| Operation | Old Fund | New Fund | Balance Update Method | Notes |
|-----------|----------|----------|----------------|-------|
| Create | N/A | Manual | Firestore transaction: Add amount to new fund | Atomic with transaction creation |
| Create | N/A | Account-based | No update | Account balance from Plaid |
| Update (amount only) | Manual | Manual (same) | Firestore transaction: Add difference to fund | Atomic with transaction update |
| Update (fund changed) | Manual | Manual | Firestore transaction: Subtract from old, add to new | Atomic multi-document update |
| Update (fund changed) | Manual | Account-based | Firestore transaction: Subtract from old | Atomic with transaction update |
| Update (fund changed) | Account-based | Manual | Firestore transaction: Add to new | Atomic with transaction update |
| Update (fund changed) | Account-based | Account-based | No update | Both balances from Plaid |
| Delete | Manual | N/A | Firestore transaction: Subtract amount from fund | Atomic with transaction deletion |
| Delete | Account-based | N/A | No update | Account balance from Plaid |
| **Set Balance Directly** | **Manual** | **N/A** | **Simple updateDoc: Set currentBalance to exact value** | **No transaction needed, no transaction documents affected** |
| **Set Balance Directly** | **Account-based** | **N/A** | **Error: Not allowed** | **Account-based funds use Plaid balance** |


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:
- Properties 7.3 and 9.2 are identical (fund filter includes manual transactions)
- Properties about balance updates (2.5, 4.4, 4.5, 5.4) can be consolidated into comprehensive balance invariant properties
- Properties about filtering (7.3, 9.1, 9.3, 9.4) share the same underlying principle: manual transactions participate in all filters identically to Plaid transactions

The properties below represent the unique, non-redundant set of correctness guarantees.

### Property 1: Fund Type Determination

*For any* saving fund, if `accountId` is undefined, then the fund should be classified as manual; if `accountId` is defined, then the fund should be classified as account-based.

**Validates: Requirements 1.5**

### Property 2: Manual Transaction Creation Balance Update

*For any* manual saving fund and any transaction amount, when a transaction is created with that fund's ID, the fund's `currentBalance` should increase by exactly the transaction amount.

**Validates: Requirements 2.5**

### Property 3: Transaction Update Preserves Data

*For any* manual transaction and any valid field updates (name, amount, date, category, savingTargetId), after updating the transaction, reading it back should return the updated values.

**Validates: Requirements 4.3**

### Property 4: Fund Change Balance Update

*For any* transaction with a fund change where at least one fund (old or new) is manual, the balance updates should satisfy: old manual fund decreases by transaction amount, new manual fund increases by transaction amount, and account-based funds remain unchanged.

**Validates: Requirements 4.4**

### Property 5: Amount Change Balance Update

*For any* manual transaction with an amount change, the associated manual fund's `currentBalance` should change by exactly the difference (new amount minus old amount).

**Validates: Requirements 4.5**

### Property 6: Transaction Deletion Removes Document

*For any* transaction, after deleting it, querying for that transaction ID should return no results.

**Validates: Requirements 5.3**

### Property 7: Transaction Deletion Balance Update

*For any* manual transaction with a `savingTargetId`, when the transaction is deleted, the associated manual fund's `currentBalance` should decrease by exactly the transaction amount.

**Validates: Requirements 5.4**

### Property 8: Manual Transactions Excluded from Auto-Assignment

*For any* manual transaction (institutionId is null/undefined), auto-assignment logic should not modify its `savingTargetId` field.

**Validates: Requirements 7.1**

### Property 9: Manual Fund Balance Source

*For any* manual saving fund, when listing saving targets, the returned `currentAmount` should equal the fund's `currentBalance` field value.

**Validates: Requirements 7.2**

### Property 10: Filter Parity for Manual Transactions

*For any* filter criteria (category, savingTargetId, date range, search text), the filter results should include manual transactions that match the criteria identically to how Plaid transactions are included.

**Validates: Requirements 7.3, 9.1, 9.2, 9.3, 9.4**

### Property 11: Manual Fund Progress Calculation

*For any* manual saving fund, the progress calculation should use the `currentBalance` field divided by `targetAmount`, not the account balance.

**Validates: Requirements 7.5**

### Property 12: Account-Based Fund Balance Immutability

*For any* account-based saving fund (accountId is defined), transaction operations (create, update, delete) should never modify the fund's `currentBalance` field.

**Validates: Requirements 7.6**

### Property 13: Non-Empty Name Validation

*For any* string composed entirely of whitespace or empty string, attempting to create a manual transaction with that name should be rejected.

**Validates: Requirements 8.1**

### Property 14: Valid Date Validation

*For any* invalid date value (NaN, undefined, null, or date outside reasonable bounds), attempting to create a manual transaction with that date should be rejected.

**Validates: Requirements 8.3**

### Property 15: Amount Sign Acceptance

*For any* non-zero amount (positive or negative), the transaction creation should accept the value without modification.

**Validates: Requirements 8.5**

### Property 16: CSP Bucket Total Inclusion

*For any* CSP bucket, the calculated total should include the sum of all manual transaction amounts in that bucket's categories.

**Validates: Requirements 9.5**

### Property 17: Manual Transaction Source Indicator

*For any* manual transaction, the `institutionId` field should be null or undefined, serving as the source indicator.

**Validates: Requirements 10.2**

### Property 18: Transaction ID Uniqueness

*For any* two transactions created in the system, they should have different `id` values.

**Validates: Requirements 10.3**

### Property 19: User Ownership Enforcement

*For any* manual transaction created by a user, the transaction's `uid` field should equal the authenticated user's ID.

**Validates: Requirements 10.4**

### Property 20: Query Support for Manual Transactions

*For any* query by uid, savingTargetId, category, or date range, manual transactions matching the criteria should be returned in the results.

**Validates: Requirements 10.5**

### Property 21: Balance Invariant (Round-Trip)

*For any* manual saving fund, the sequence of operations: record initial balance → create transaction → delete same transaction → record final balance, should result in initial balance equaling final balance.

**Validates: Requirements 2.5, 5.4** (Combined round-trip property)

### Property 22: Direct Balance Set Updates Field

*For any* manual saving fund and any numeric value, when the balance is set directly to that value, reading the fund's `currentBalance` field should return exactly that value.

**Validates: Requirements 11.4**

### Property 23: Balance Set Preserves Transactions

*For any* manual saving fund with existing transactions, setting the balance directly should not modify, delete, or create any transaction documents.

**Validates: Requirements 11.6**


## Error Handling

### Validation Errors

**Client-Side Validation** (TransactionEditDialog):
- Empty or whitespace-only transaction name → Display error: "Transaction name is required"
- Zero amount → Display error: "Amount must be non-zero"
- Invalid date → Display error: "Please enter a valid date"
- Missing required fields → Disable save button until fields are valid

**Client-Side Validation** (SetBalanceDialog):
- Non-numeric input → Display error: "Please enter a valid number"
- Empty input → Display error: "Balance is required"
- NaN or Infinity → Display error: "Please enter a valid number"

**Service Layer Validation** (TransactionsService):
- User not authenticated → Throw error: "User not authenticated"
- Invalid transaction ID → Return error: "Transaction not found"
- Unauthorized access (uid mismatch) → Return error: "Unauthorized access to transaction"

**Service Layer Validation** (SavingTargetsService.setFundBalance):
- User not authenticated → Return error: "User not authenticated"
- Fund not found → Return error: "Saving fund not found"
- Unauthorized access (uid mismatch) → Return error: "Unauthorized access to saving fund"
- Fund is account-based (has accountId) → Return error: "Cannot set balance for account-based funds"

### Firestore Transaction Errors

**Atomic Balance Update Failures**:
- Fund document not found during transaction → Rollback entire operation, return error: "Saving fund not found"
- Concurrent modification conflict → Retry transaction up to 3 times, then fail with error: "Failed to update balance due to concurrent modifications"
- Network timeout → Return error: "Network error, please try again"

**Error Recovery Strategy**:
1. All balance updates use Firestore transactions for atomicity
2. If transaction fails, no partial updates occur (all-or-nothing)
3. React Query automatically retries failed mutations (3 attempts with exponential backoff)
4. User sees error toast notification with actionable message
5. Cache invalidation ensures UI reflects actual database state

### Edge Cases

**Fund Deletion with Existing Transactions**:
- When a manual fund is deleted, all associated transactions have their `savingTargetId` set to null
- Balance updates are no longer needed since fund no longer exists
- Transactions remain in the system (not deleted)

**Fund Type Conversion** (Account-Based → Manual or vice versa):
- Not supported in current design
- If needed in future, would require migration of balance tracking approach
- Recommendation: Delete and recreate fund with new type

**Negative Balance**:
- Manual funds can have negative `currentBalance` (e.g., tracking debt or overdrafts)
- No validation prevents negative balances
- UI should display negative balances clearly (e.g., "-$50.00" in red)
- SetBalanceDialog accepts negative values explicitly

**Direct Balance Set After Transactions**:
- Setting balance directly does not modify or delete existing transactions
- Transactions continue to add/subtract from the manually-set balance
- Example: Fund has $100 balance from transactions → User sets balance to $500 → User adds $50 transaction → New balance is $550
- This allows users to "initialize" a fund balance without creating individual historical transactions

**Use Cases for Direct Balance Setting**:
1. **Initial Balance**: User wants to start tracking a fund that already has money in it (e.g., existing cash savings of $1,000)
2. **Reconciliation**: User discovers the balance is incorrect and wants to correct it to match reality
3. **Bulk Adjustment**: User has many small transactions they don't want to enter individually, so they set the net result
4. **Migration**: User is migrating from another system and wants to set the current balance without historical data
5. **Reset**: User wants to reset a fund to zero or another value without deleting transactions

**Why Not Just Create a Transaction?**:
- Creating a transaction implies a specific event occurred (deposit/withdrawal)
- Direct balance set is for adjustments, corrections, or initialization
- Transactions show up in transaction history; balance adjustments don't
- Semantically different: "I deposited $100" vs "The balance is $100"

**Large Transaction Volumes**:
- Firestore transactions have a limit of 500 document operations
- Current design updates 1-2 documents per transaction operation (transaction + fund)
- No risk of hitting limit with current design

**Concurrent Edits**:
- Firestore transactions handle concurrent modifications automatically
- Last write wins for transaction document fields
- Balance updates are atomic and consistent due to Firestore transaction usage

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Specific transaction creation scenarios (with/without fund, positive/negative amounts)
- Direct balance setting scenarios (positive, negative, zero)
- UI component rendering and interaction
- Service layer error handling
- Edge cases (zero balance, negative balance, missing fund)

**Property-Based Tests**: Verify universal properties across all inputs
- Balance update correctness across random transaction amounts
- Direct balance set correctness across random balance values
- Filter behavior across random transaction sets
- Validation logic across random invalid inputs
- Round-trip properties (create then delete preserves balance)
- Transaction preservation after balance set

Together, these approaches provide comprehensive coverage: unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across the input space.

### Property-Based Testing Configuration

**Library**: Use `fast-check` for TypeScript property-based testing

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `Feature: manual-saving-fund-transactions, Property {number}: {property_text}`

**Example Property Test Structure**:

```typescript
import fc from 'fast-check';

describe('Feature: manual-saving-fund-transactions', () => {
  it('Property 2: Manual Transaction Creation Balance Update', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          fundName: fc.string({ minLength: 1 }),
          targetAmount: fc.float({ min: 1, max: 1000000 }),
          transactionAmount: fc.float({ min: -10000, max: 10000 }),
        }),
        async ({ fundName, targetAmount, transactionAmount }) => {
          // Create manual fund
          const fund = await createManualFund(fundName, targetAmount);
          const initialBalance = fund.currentBalance ?? 0;

          // Create transaction
          await createTransaction({
            name: 'Test Transaction',
            amount: transactionAmount,
            savingTargetId: fund.id,
          });

          // Verify balance updated correctly
          const updatedFund = await getFund(fund.id);
          expect(updatedFund.currentBalance).toBe(initialBalance + transactionAmount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 22: Direct Balance Set Updates Field', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          fundName: fc.string({ minLength: 1 }),
          targetAmount: fc.float({ min: 1, max: 1000000 }),
          newBalance: fc.float({ min: -100000, max: 100000 }),
        }),
        async ({ fundName, targetAmount, newBalance }) => {
          // Create manual fund
          const fund = await createManualFund(fundName, targetAmount);

          // Set balance directly
          await setFundBalance(fund.id, newBalance);

          // Verify balance is exactly the set value
          const updatedFund = await getFund(fund.id);
          expect(updatedFund.currentBalance).toBe(newBalance);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 23: Balance Set Preserves Transactions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          fundName: fc.string({ minLength: 1 }),
          targetAmount: fc.float({ min: 1, max: 1000000 }),
          transactionCount: fc.integer({ min: 1, max: 10 }),
          newBalance: fc.float({ min: -100000, max: 100000 }),
        }),
        async ({ fundName, targetAmount, transactionCount, newBalance }) => {
          // Create manual fund
          const fund = await createManualFund(fundName, targetAmount);

          // Create multiple transactions
          const transactionIds = [];
          for (let i = 0; i < transactionCount; i++) {
            const txn = await createTransaction({
              name: `Transaction ${i}`,
              amount: Math.random() * 100,
              savingTargetId: fund.id,
            });
            transactionIds.push(txn.id);
          }

          // Get transaction snapshots before balance set
          const transactionsBefore = await Promise.all(
            transactionIds.map(id => getTransaction(id))
          );

          // Set balance directly
          await setFundBalance(fund.id, newBalance);

          // Get transaction snapshots after balance set
          const transactionsAfter = await Promise.all(
            transactionIds.map(id => getTransaction(id))
          );

          // Verify all transactions are unchanged
          expect(transactionsAfter).toEqual(transactionsBefore);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Coverage

**Service Layer Tests** (`transactionsService.test.ts`):
- `createTransaction()` with manual fund updates balance
- `createTransaction()` with account-based fund does not update balance
- `createTransaction()` without fund succeeds
- `updateTransaction()` with amount change updates balance correctly
- `updateTransaction()` with fund change updates both fund balances
- `deleteTransaction()` updates balance correctly
- Error handling for missing fund, unauthorized access, network errors

**Service Layer Tests** (`savingTargetsService.test.ts`):
- `setFundBalance()` updates currentBalance field correctly
- `setFundBalance()` rejects account-based funds
- `setFundBalance()` accepts positive, negative, and zero values
- `setFundBalance()` validates fund ownership
- `setFundBalance()` handles missing fund error

**React Query Hook Tests** (`useTransactions.test.ts`):
- `useCreateTransaction` invalidates correct query keys
- `useDeleteTransaction` invalidates correct query keys
- `useUpdateTransaction` updates cache optimistically
- Error states propagate correctly to UI

**React Query Hook Tests** (`useFunds.test.ts`):
- `useSetFundBalance` invalidates saving targets query
- `useSetFundBalance` handles success and error states
- Error messages display correctly in UI

**Component Tests** (`TransactionEditDialog.test.tsx`):
- Renders in create mode with empty fields
- Renders in edit mode with populated fields
- Validates required fields before enabling save
- Shows delete button only for manual transactions
- Disables amount/date/name fields for Plaid transactions
- Enables all fields for manual transactions
- Pre-populates savingTargetId when provided

**Component Tests** (`SetBalanceDialog.test.tsx`):
- Renders with current balance displayed
- Accepts numeric input (positive, negative, zero)
- Validates non-numeric input
- Validates empty input
- Calls setFundBalance mutation on save
- Closes dialog on successful save
- Displays error message on failure

**Integration Tests**:
- End-to-end flow: Create manual fund → Add transaction → Verify balance
- End-to-end flow: Create transaction → Edit amount → Verify balance delta
- End-to-end flow: Create transaction → Delete → Verify balance restored
- End-to-end flow: Create manual fund → Set balance → Add transaction → Verify balance includes both
- End-to-end flow: Create manual fund with transactions → Set balance → Verify transactions unchanged
- Filter manual transactions by category, fund, date range
- Search manual transactions by name

### Test Data Generators

**For Property-Based Tests**:

```typescript
// Generate random manual fund
const manualFundArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  targetAmount: fc.float({ min: 1, max: 1000000, noNaN: true }),
  uid: fc.uuid(),
});

// Generate random manual transaction
const manualTransactionArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  amount: fc.float({ min: -100000, max: 100000, noNaN: true, noDefaultInfinity: true }),
  datetime: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.getTime()),
  category: fc.constantFrom(...Object.values(CSPCategory)),
  savingTargetId: fc.option(fc.uuid(), { nil: undefined }),
});

// Generate random transaction updates
const transactionUpdatesArbitrary = fc.record({
  name: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
  amount: fc.option(fc.float({ min: -100000, max: 100000, noNaN: true })),
  datetime: fc.option(fc.date().map(d => d.getTime())),
  category: fc.option(fc.constantFrom(...Object.values(CSPCategory))),
  savingTargetId: fc.option(fc.uuid()),
}, { requiredKeys: [] });
```

### Mocking Strategy

**Firestore Mocking**:
- Use `@firebase/rules-unit-testing` for Firestore emulator in tests
- Mock Firestore transactions for unit tests
- Use real Firestore emulator for integration tests

**React Query Mocking**:
- Use `@tanstack/react-query` testing utilities
- Mock query client for component tests
- Use real query client for integration tests

**Authentication Mocking**:
- Mock `getAuth()` to return test user ID
- Use consistent test user ID across all tests

## Implementation Notes

### Phase 1: Shared Types Update
1. Update `SavingTarget` interface in `easy-csp-shared-types`
2. Add type guard helper functions
3. Rebuild and reinstall shared types package

### Phase 2: Service Layer
1. Extend `TransactionsService` with `createTransaction()` and `deleteTransaction()`
2. Modify `TransactionsService.updateTransaction()` to handle balance updates
3. Extend `SavingTargetsService.addSavingTarget()` to support manual funds
4. Modify `SavingTargetsService.listSavingTargets()` to return `currentBalance` for manual funds

### Phase 3: React Query Hooks
1. Add `useCreateTransaction` hook
2. Add `useDeleteTransaction` hook
3. Modify `useAddSavingTarget` to support manual funds
4. Ensure proper cache invalidation

### Phase 4: UI Components
1. Extend `TransactionEditDialog` to support create mode
2. Add manual transaction detection and field enabling/disabling
3. Add delete button for manual transactions
4. Add validation for required fields
5. Add transaction source indicator
6. Create `SetBalanceDialog` component
7. Add balance input field with validation
8. Add current balance display for reference

### Phase 5: Page Integration
1. Add "Add Transaction" button to `TransactionsPage`
2. Add "Add Transaction" button to manual fund rows in `SavingFundsPage`
3. Add "Set Balance" button to manual fund rows in `SavingFundsPage`
4. Add visual indicators for manual transactions and funds
5. Wire up dialog opening with pre-populated fields
6. Ensure "Set Balance" button only appears for manual funds

### Phase 6: Testing
1. Write property-based tests for all 23 properties
2. Write unit tests for service layer (including setFundBalance)
3. Write component tests for UI (including SetBalanceDialog)
4. Write integration tests for end-to-end flows (including balance set flows)

### Migration Considerations

**Existing Data**:
- Existing saving funds have defined `accountId` (account-based)
- No migration needed for existing funds
- New manual funds will have `accountId: undefined`

**Backward Compatibility**:
- All existing code continues to work unchanged
- Type changes are additive (making fields optional)
- No breaking changes to existing functionality

**Firestore Indexes**:
- No new indexes required
- Existing indexes on `uid`, `category`, `savingTargetId`, `datetime` sufficient

### Performance Considerations

**Firestore Transaction Overhead**:
- Each manual transaction operation requires a Firestore transaction (2 reads + 2 writes)
- Acceptable overhead for user-initiated operations
- No batch operations needed (users create transactions one at a time)

**Query Performance**:
- Manual transactions use same indexes as Plaid transactions
- No performance degradation expected
- Filter and search performance identical

**Cache Strategy**:
- React Query caches transaction lists for 5 minutes
- Mutations invalidate affected queries
- Optimistic updates for better UX where possible

### Security Considerations

**Firestore Security Rules**:
- Existing rules enforce user ownership via `uid` field
- Manual transactions follow same security model as Plaid transactions
- No additional rules needed

**Input Sanitization**:
- Client-side validation prevents invalid data entry
- Service layer validates user authentication
- Firestore enforces schema via TypeScript types

**Authorization**:
- Users can only create/edit/delete their own transactions
- Users can only create/edit/delete their own saving funds
- Service layer checks `uid` on all operations

