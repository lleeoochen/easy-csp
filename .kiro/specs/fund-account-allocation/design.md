# Design Document: Fund Account Allocation

## Overview

The Fund Account Allocation feature extends Easy CSP's transaction management system to support envelope budgeting and goal-based savings. Users can designate specific asset accounts as "fund accounts" and allocate transactions to these funds, enabling tracking of how money is distributed across different purposes (emergency fund, vacation fund, car repair fund, etc.) without creating separate physical bank accounts.

This design integrates with the existing rules engine, Plaid sync infrastructure, and transaction tagging UI to provide seamless fund allocation capabilities across both manual and automated workflows.

### Key Design Principles

1. **Non-invasive balance tracking**: Fund allocations are metadata only - they do not affect actual account balances
2. **Rules-first automation**: Leverage the existing rules engine for automatic fund assignment during both UI tagging and Plaid sync
3. **Asset-only restriction**: Only asset accounts (checking, savings, investment, other) can be fund accounts - liability accounts (credit, loan) are excluded
4. **Flexible allocation**: Transactions can belong to one account but be allocated to a different fund account
5. **Backward compatibility**: All changes are additive - existing functionality remains unchanged

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  Account Settings UI  │  Transaction Tagging UI  │  Fund View   │
│  - Toggle fund status │  - Fund dropdown         │  - Allocated │
│  - Validation msgs    │  - Current allocation    │    txns list │
│                       │  - Clear allocation      │  - Total amt │
└───────────────┬───────────────────┬───────────────────┬─────────┘
                │                   │                   │
                ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Firestore (Data Layer)                        │
├─────────────────────────────────────────────────────────────────┤
│  FinancialAccount Collection    │    Transaction Collection     │
│  - id (doc ID)                  │    - id (doc ID)              │
│  - isFundAccount: boolean       │    - allocatedFundId?: string │
│  - accountType                  │    - accountId                │
│  - ...existing fields           │    - ...existing fields       │
└───────────────┬─────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend (Cloud Functions)                      │
├─────────────────────────────────────────────────────────────────┤
│  Plaid Sync Activity            │    Rules Service              │
│  - Import transactions          │    - Evaluate criteria        │
│  - Apply rules (incl. funds)    │    - Apply actions            │
│  - Validate fund references     │    - assignFund action        │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Manual Transaction Tagging
```
User selects fund → Frontend validates fund exists → Update transaction.allocatedFundId → Firestore
```

#### Automated Rule-Based Allocation (UI)
```
User tags transaction → Frontend applies rules → Rule matches with assignFund → Set allocatedFundId → Firestore
```

#### Automated Rule-Based Allocation (Plaid Sync)
```
Plaid imports transaction → Backend applies rules → Rule matches with assignFund → Set allocatedFundId → Save to Firestore
```

#### Automatic Fund Enablement via CSP Category Linking
```
User links account to CSP savings/investment category → Frontend validates account is asset type → Set isFundAccount = true → Update Firestore
```

## Components and Interfaces

### Data Model Changes

#### FinancialAccount Interface Extension

```typescript
export interface FinancialAccount {
  // ... existing fields ...

  /**
   * Designates whether this account can be used for transaction allocation
   * Only asset accounts (checking, savings, investment, other) can be fund accounts
   * Liability accounts (credit, loan) cannot be fund accounts
   *
   * Default values on creation/import:
   * - savings: true
   * - investment: true
   * - checking, other, credit, loan: false
   */
  isFundAccount: boolean;
}
```

#### Transaction Interface Extension

```typescript
export interface Transaction {
  // ... existing fields ...

  /**
   * Optional reference to a fund account for allocation tracking
   * References FinancialAccount.id (Firestore document ID)
   *
   * Validation rules:
   * - Referenced account must exist
   * - Referenced account must have isFundAccount === true
   * - Can be different from transaction.accountId (cross-account allocation)
   * - Does not affect account balances
   */
  allocatedFundId?: string;
}
```

#### RuleAction Interface Extension

```typescript
export interface RuleAction {
  changeCategory?: string;
  toggleHidden?: boolean;
  autoSplit?: {
    splitCount: number;
    frequency: SplitFrequency;
  };

  /**
   * Automatically assign transactions to a fund account
   * References FinancialAccount.id (Firestore document ID)
   *
   * Validation rules:
   * - Referenced account must exist
   * - Referenced account must have isFundAccount === true
   * - Applied during both UI tagging and Plaid sync
   * - Last matching rule wins if multiple rules specify assignFund
   */
  assignFund?: string;
}
```

### Service Layer Architecture

#### Frontend Services

##### AccountService Extensions

```typescript
/**
 * Updates the fund account status for an account
 * Validates that only asset accounts can be fund accounts
 */
async updateFundAccountStatus(
  accountId: string,
  isFundAccount: boolean
): Promise<{ success: boolean; message?: string }>

/**
 * Gets all fund accounts for the current user
 * Returns accounts where isFundAccount === true
 */
async getFundAccounts(): Promise<FinancialAccount[]>

/**
 * Validates if an account can be a fund account
 * Returns true only for asset account types
 */
validateFundAccountEligibility(accountType: AccountType): boolean

/**
 * Automatically enables fund account status when linking to CSP savings/investment categories
 * Called by CSP settings UI when user links an account to a category
 *
 * @param accountId - The account being linked to a CSP category
 * @param cspBucket - The CSP bucket the category belongs to
 * @returns Promise with success status and optional message
 *
 * Behavior:
 * - If cspBucket is Savings or Investment, sets isFundAccount = true
 * - Validates account is an asset type before enabling
 * - No-op if account is already a fund account
 * - No-op if cspBucket is not Savings or Investment
 */
async handleCSPCategoryLinking(
  accountId: string,
  cspBucket: CSPBucket
): Promise<{ success: boolean; message?: string }>
```

##### TransactionsService Extensions

```typescript
/**
 * Updates the fund allocation for a transaction
 * Validates that the fund account exists and is a valid fund
 */
async updateTransactionFundAllocation(
  transactionId: string,
  allocatedFundId: string | null
): Promise<{ success: boolean; message?: string }>

/**
 * Gets all transactions allocated to a specific fund
 * Filters by allocatedFundId and orders by datetime desc
 */
async getTransactionsByFund(
  fundAccountId: string,
  options?: { startDate?: number; endDate?: number }
): Promise<Transaction[]>

/**
 * Calculates the total amount of transactions allocated to a fund
 */
async calculateFundAllocationTotal(
  fundAccountId: string,
  options?: { startDate?: number; endDate?: number }
): Promise<number>
```

##### RulesService Extensions

```typescript
/**
 * Validates that a fund assignment rule references a valid fund account
 * Called when creating or updating rules with assignFund action
 */
async validateFundAssignmentRule(
  fundAccountId: string
): Promise<{ valid: boolean; message?: string }>

/**
 * Applies rules to a transaction (including fund assignment)
 * Returns the modified transaction with all rule actions applied
 */
applyRulesToTransaction(
  transaction: Transaction,
  rules: RuleTransformation[]
): Transaction
```

#### Backend Services

##### RulesService Extensions (Cloud Functions)

```typescript
/**
 * Applies fund assignment action to a transaction
 * Validates fund account exists and is a valid fund
 * Logs warnings if validation fails but continues processing
 */
private static applyFundAssignment(
  transaction: Transaction,
  fundAccountId: string,
  uid: string
): Promise<Transaction>

/**
 * Validates that a fund account exists and has isFundAccount === true
 * Used during rule application in Plaid sync
 */
private static async validateFundAccount(
  fundAccountId: string,
  uid: string
): Promise<boolean>

/**
 * Extended applyRuleActions to handle assignFund action
 * Processes all rule actions including fund assignment
 */
public static async applyRuleActions(
  transaction: Transaction,
  action: RuleAction,
  uid: string
): Promise<Transaction>
```

##### FinancialInstitutionActivity Extensions

```typescript
/**
 * Extended syncTransactions to apply fund assignment rules
 * Processes transactions through RulesService before saving
 * Logs fund assignment actions for debugging
 */
async syncTransactions(
  institutionId: string,
  uid: string
): Promise<SyncResult>
```

### Frontend Components

#### AccountSettingsCard Component

**Location**: `src/components/accounts/AccountSettingsCard.tsx`

**Props**:
```typescript
interface AccountSettingsCardProps {
  account: FinancialAccount;
  onUpdate: (updates: Partial<FinancialAccount>) => Promise<void>;
}
```

**Features**:
- Toggle switch for `isFundAccount` status
- Conditional rendering based on `accountType`
- Explanatory text for asset vs liability accounts
- Warning dialog when disabling fund status with allocated transactions
- Real-time validation feedback

#### FundAccountDropdown Component

**Location**: `src/components/transactions/FundAccountDropdown.tsx`

**Props**:
```typescript
interface FundAccountDropdownProps {
  currentFundId?: string;
  onFundChange: (fundId: string | null) => void;
  disabled?: boolean;
}
```

**Features**:
- Dropdown populated with all fund accounts
- Display current allocation if set
- Clear button to remove allocation
- Empty state message when no fund accounts exist
- Integration with transaction tagging modal

#### FundAccountView Component

**Location**: `src/pages/FundAccountView.tsx`

**Features**:
- List of all transactions allocated to the fund
- Total allocation amount display
- Date range filtering
- Transaction detail cards with remove allocation action
- Empty state when no transactions allocated
- Link to account settings to manage fund status

### CSP Settings Integration

#### Budget/CSP Settings Component Extensions

**Location**: `src/pages/budget/BudgetSettings.tsx` (or equivalent CSP settings page)

**Integration Point**: Account linking to CSP categories

**Behavior**:
When a user links an account to a CSP category that belongs to the Savings or Investment bucket:

1. **Validation Phase**:
   - Verify account exists and belongs to user
   - Verify account is an asset type (checking, savings, investment, other)
   - If account is a liability type, prevent linking and show error message

2. **Linking Phase**:
   - Save the account-to-category link in the CSP budget document
   - Call `accountService.handleCSPCategoryLinking(accountId, cspBucket)`

3. **Fund Enablement Phase**:
   - If `cspBucket === CSPBucket.Savings || cspBucket === CSPBucket.Investment`
   - Automatically set `account.isFundAccount = true`
   - Update Firestore with the new fund status

4. **User Feedback**:
   - Show success message: "Account linked to [category name] and enabled as fund account"
   - If account was already a fund account: "Account linked to [category name]"
   - If linking failed: Show specific error message

**Implementation Notes**:
- This logic lives in the frontend service layer (accountService.ts)
- No backend changes required - Firestore security rules already allow account updates
- The CSP settings UI should not expose this as a separate toggle - it happens automatically
- Users can still manually disable fund status later via Account Settings if desired

**Example User Flow**:
```
1. User opens Budget/CSP Settings
2. User selects "Emergency Fund" category (in Savings bucket)
3. User clicks "Link Account" and selects "Chase Checking"
4. System validates Chase Checking is an asset account ✓
5. System saves the link: Emergency Fund → Chase Checking
6. System automatically sets Chase Checking.isFundAccount = true
7. User sees: "Account linked to Emergency Fund and enabled as fund account"
8. Chase Checking now appears in fund allocation dropdowns
```

### API/Function Signatures

#### Firestore Queries

```typescript
// Get all fund accounts for a user
const fundAccountsQuery = query(
  collection(firestore, ACCOUNTS_COLLECTION),
  where("uid", "==", uid),
  where("isFundAccount", "==", true)
);

// Get transactions allocated to a specific fund
const fundTransactionsQuery = query(
  collection(firestore, TRANSACTIONS_COLLECTION),
  where("uid", "==", uid),
  where("allocatedFundId", "==", fundAccountId),
  orderBy("datetime", "desc")
);

// Count transactions allocated to a fund (for warning dialog)
const allocationCountQuery = query(
  collection(firestore, TRANSACTIONS_COLLECTION),
  where("uid", "==", uid),
  where("allocatedFundId", "==", fundAccountId)
);
```

#### Cloud Function Interfaces

```typescript
// No new Cloud Functions needed - all logic integrated into existing functions

// Extended RulesService.processTransactionBatch
interface ProcessTransactionBatchResult {
  transactionsToInsert: Transaction[]; // Now includes allocatedFundId if rules matched
}

// Extended RulesService.applyRuleActions
async applyRuleActions(
  transaction: Transaction,
  action: RuleAction,
  uid: string // Added for fund validation
): Promise<Transaction>
```

## Data Models

### Firestore Schema Changes

#### financialAccounts Collection

```typescript
{
  id: "auto-generated-doc-id",
  uid: "user-123",
  accountId: "plaid-account-id-or-manual-id",
  accountName: "Chase Savings",
  nickname: "Emergency Fund",
  accountType: "savings",
  balance: 15000.00,
  isManual: false,
  institutionId: "item-xyz",
  institutionName: "Chase",
  lastSyncTimestamp: 1704067200000,
  targetAmount: 20000.00,
  isFundAccount: true  // NEW FIELD
}
```

#### transactions Collection

```typescript
{
  id: "auto-generated-doc-id",
  uid: "user-123",
  accountId: "account-doc-id-1",  // The account this transaction belongs to
  name: "Grocery Store",
  amount: -85.50,
  datetime: 1704067200000,
  plaidCategory: "Food and Drink",
  category: "groceries",
  hidden: false,
  splitParentId: undefined,
  nickname: "Weekly groceries",
  allocatedFundId: "account-doc-id-2"  // NEW FIELD - references a different fund account
}
```

#### rules Collection

```typescript
{
  uid: "user-123",
  transformations: [
    {
      name: "Allocate groceries to food fund",
      enabled: true,
      matchingCriteria: {
        category: {
          value: "groceries",
          condition: "exact"
        }
      },
      action: {
        assignFund: "account-doc-id-2"  // NEW FIELD in RuleAction
      }
    }
  ]
}
```

### Default Values

| Field | Account Type | Default Value | Rationale |
|-------|-------------|---------------|-----------|
| isFundAccount | savings | true | Savings accounts are commonly used for fund tracking |
| isFundAccount | investment | true | Investment accounts often represent specific goals |
| isFundAccount | checking | false | Checking accounts are typically transactional |
| isFundAccount | other | false | Other accounts need explicit opt-in |
| isFundAccount | credit | false | Liability accounts cannot be funds |
| isFundAccount | loan | false | Liability accounts cannot be funds |

### Automatic Fund Account Enablement Rules

Beyond the default values set during account creation/import, the system automatically enables fund account status in the following scenarios:

#### CSP Category Linking (Frontend)

**Trigger**: User links an account to CSP savings or investment category in the budget/CSP settings

**Behavior**:
- When an account is linked to a CSP category in the `CSPBucket.Savings` or `CSPBucket.Investment` bucket
- The system automatically sets `isFundAccount = true` for that account
- This occurs regardless of the account's type (checking, savings, investment, other)
- Only applies to asset accounts - liability accounts remain ineligible

**Implementation Location**: Frontend service layer (accountService.ts)

**Rationale**:
- Accounts linked to savings/investment categories represent specific financial goals
- Users expect these accounts to be available for transaction allocation
- Reduces manual configuration steps for common use cases
- Aligns with the mental model that savings/investment tracking = fund tracking

**Example Flow**:
```
User links "Chase Checking" to CSP category "Emergency Fund" (Savings bucket)
→ System validates account is asset type
→ System sets account.isFundAccount = true
→ Account now appears in fund allocation dropdowns
```

**Edge Cases**:
- If account is already a fund account, no change occurs
- If account is a liability type, linking is prevented at the CSP settings level
- If user later unlinks the account from CSP category, fund status remains enabled (manual disable required)
- If account is linked to a non-savings/investment category, fund status is not automatically enabled

### Validation Rules

#### Account-Level Validation

```typescript
// Can only enable fund status on asset accounts
function validateFundAccountToggle(account: FinancialAccount, newValue: boolean): boolean {
  if (newValue === true) {
    const assetTypes: AccountType[] = [
      AccountType.Checking,
      AccountType.Savings,
      AccountType.Investment,
      AccountType.Other
    ];
    return assetTypes.includes(account.accountType);
  }
  return true; // Can always disable
}
```

#### Transaction-Level Validation

```typescript
// Validate fund allocation reference
async function validateFundAllocation(
  allocatedFundId: string,
  uid: string
): Promise<{ valid: boolean; message?: string }> {
  const account = await getAccount(allocatedFundId);

  if (!account) {
    return { valid: false, message: "Fund account not found" };
  }

  if (account.uid !== uid) {
    return { valid: false, message: "Fund account does not belong to user" };
  }

  if (!account.isFundAccount) {
    return { valid: false, message: "Referenced account is not a fund account" };
  }

  return { valid: true };
}
```

#### Rule-Level Validation

```typescript
// Validate assignFund action in rules
async function validateAssignFundRule(
  fundAccountId: string,
  uid: string
): Promise<{ valid: boolean; message?: string }> {
  // Same validation as transaction-level
  return validateFundAllocation(fundAccountId, uid);
}
```

#### CSP Category Linking Validation

```typescript
// Validate automatic fund enablement when linking to CSP category
async function validateCSPCategoryLinking(
  accountId: string,
  cspBucket: CSPBucket,
  uid: string
): Promise<{ valid: boolean; message?: string }> {
  // Only auto-enable for savings and investment buckets
  if (cspBucket !== CSPBucket.Savings && cspBucket !== CSPBucket.Investment) {
    return { valid: true }; // No action needed, but not an error
  }

  const account = await getAccount(accountId);

  if (!account) {
    return { valid: false, message: "Account not found" };
  }

  if (account.uid !== uid) {
    return { valid: false, message: "Account does not belong to user" };
  }

  // Validate account is an asset type
  const assetTypes: AccountType[] = [
    AccountType.Checking,
    AccountType.Savings,
    AccountType.Investment,
    AccountType.Other
  ];

  if (!assetTypes.includes(account.accountType)) {
    return {
      valid: false,
      message: "Only asset accounts can be linked to savings/investment categories"
    };
  }

  return { valid: true };
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Asset Account Fund Eligibility

*For any* account with type checking, savings, investment, or other, the system should allow enabling fund account status. *For any* account with type credit or loan, the system should reject attempts to enable fund account status.

**Validates: Requirements 1.2, 1.3, 1.4**

### Property 2: Fund Allocation Reference Validity

*For any* transaction with `allocatedFundId` set, the referenced account must exist, belong to the same user, and have `isFundAccount === true`.

**Validates: Requirements 2.2, 8.1, 8.2, 8.3**

### Property 3: Balance Independence

*For any* account, setting or clearing transaction allocations (`allocatedFundId`) should not modify the account's balance field.

**Validates: Requirements 2.3, 10.1, 10.2, 10.3**

### Property 4: Rule Fund Assignment

*For any* transaction matching a rule with `assignFund` action, the transaction's `allocatedFundId` should be set to the specified fund account ID if the fund account is valid.

**Validates: Requirements 5.2, 5.4, 5.5**

### Property 5: Last Rule Wins

*For any* transaction matching multiple rules with different `assignFund` actions, the `allocatedFundId` should be set to the fund specified by the last matching rule.

**Validates: Requirements 5.6**

### Property 6: Default Fund Status for Savings

*For any* newly created or imported savings account, the system should set `isFundAccount` to true by default.

**Validates: Requirements 1.5**

### Property 7: Default Fund Status for Investment

*For any* newly created or imported investment account, the system should set `isFundAccount` to true by default.

**Validates: Requirements 1.6**

### Property 8: Default Fund Status for Other Account Types

*For any* newly created or imported account with type checking, other, credit, or loan, the system should set `isFundAccount` to false by default.

**Validates: Requirements 1.7**

### Property 9: CSP Savings Category Auto-Enable

*For any* asset account linked to a CSP category in the Savings bucket, the system should automatically set `isFundAccount` to true.

**Validates: Requirements 11.1**

### Property 10: CSP Investment Category Auto-Enable

*For any* asset account linked to a CSP category in the Investment bucket, the system should automatically set `isFundAccount` to true.

**Validates: Requirements 11.2**

### Property 11: CSP Other Buckets No Auto-Enable

*For any* account linked to a CSP category in Income, FixedCost, GuildFreeSpending, or Ignored buckets, the system should not modify the `isFundAccount` status.

**Validates: Requirements 11.3**

### Property 12: CSP Linking Asset Type Validation

*For any* account being linked to a CSP category in Savings or Investment bucket, if the account is a liability type (credit or loan), the system should prevent the linking operation.

**Validates: Requirements 11.4, 11.5**

### Property 13: CSP Unlinking Preserves Fund Status

*For any* account unlinked from a CSP category, the system should not automatically disable the fund account status.

**Validates: Requirements 11.7**

## Error Handling

### Frontend Error Handling

#### Account Settings UI

**Scenario**: User attempts to enable fund status on liability account
- **Detection**: Frontend validation in `AccountService.validateFundAccountEligibility`
- **Response**: Display error toast: "Only asset accounts can be fund accounts. Credit and loan accounts are not eligible."
- **Recovery**: Keep toggle in disabled state, prevent API call

**Scenario**: User attempts to disable fund status with allocated transactions
- **Detection**: Query transaction count before disabling
- **Response**: Display warning dialog with transaction count
- **Recovery**: Allow user to proceed or cancel

#### Transaction Tagging UI

**Scenario**: User selects invalid fund account
- **Detection**: Frontend validation before saving transaction
- **Response**: Display error toast: "Selected fund account is no longer valid"
- **Recovery**: Clear fund selection, reload fund accounts list

**Scenario**: No fund accounts exist
- **Detection**: Empty result from `getFundAccounts` query
- **Response**: Display message: "No fund accounts available. Enable fund status on an account in Account Settings."
- **Recovery**: Disable fund dropdown, provide link to account settings

#### CSP Settings UI

**Scenario**: User attempts to link liability account to Savings/Investment category
- **Detection**: Frontend validation in `AccountService.handleCSPCategoryLinking`
- **Response**: Display error toast: "Only asset accounts can be linked to savings/investment categories"
- **Recovery**: Prevent linking, keep UI in previous state

**Scenario**: Account linking succeeds but fund enablement fails
- **Detection**: Catch error from `updateFundAccountStatus`
- **Response**: Display warning: "Account linked but fund status could not be enabled. Please enable manually in Account Settings."
- **Recovery**: Link is saved, user can manually enable fund status later

### Backend Error Handling

#### Plaid Sync

**Scenario**: Rule references non-existent fund account
- **Detection**: `validateFundAccount` returns false during rule application
- **Response**: Log warning with rule name and fund account ID
- **Recovery**: Skip fund assignment, continue processing transaction

**Scenario**: Rule references account that is not a fund
- **Detection**: `validateFundAccount` checks `isFundAccount === false`
- **Response**: Log warning with account details
- **Recovery**: Skip fund assignment, continue processing transaction

**Scenario**: Fund validation query fails
- **Detection**: Firestore query throws exception
- **Response**: Log error with stack trace
- **Recovery**: Skip fund assignment, continue processing transaction

#### Rules Service

**Scenario**: Multiple rules assign different funds
- **Detection**: Multiple `assignFund` actions in rule chain
- **Response**: Apply last matching rule (expected behavior)
- **Recovery**: No recovery needed, this is correct behavior

### Error Logging

All errors should be logged with:
- User ID (uid)
- Account ID (if applicable)
- Transaction ID (if applicable)
- Rule name (if applicable)
- Error message
- Timestamp

Frontend errors use `console.error` with structured data.
Backend errors use Cloud Functions logger with severity levels.

## Testing Strategy

### Unit Testing

#### Frontend Unit Tests

**AccountService Tests** (`accountService.test.ts`):
- Test `validateFundAccountEligibility` returns true for asset accounts
- Test `validateFundAccountEligibility` returns false for liability accounts
- Test `updateFundAccountStatus` validates account ownership
- Test `updateFundAccountStatus` validates account type when enabling
- Test `getFundAccounts` filters by `isFundAccount === true`
- Test `handleCSPCategoryLinking` enables fund for Savings bucket
- Test `handleCSPCategoryLinking` enables fund for Investment bucket
- Test `handleCSPCategoryLinking` does not enable fund for other buckets
- Test `handleCSPCategoryLinking` validates asset type
- Test `handleCSPCategoryLinking` handles already-enabled fund accounts

**TransactionsService Tests** (`transactionsService.test.ts`):
- Test `updateTransactionFundAllocation` validates fund account exists
- Test `updateTransactionFundAllocation` validates fund account has `isFundAccount === true`
- Test `updateTransactionFundAllocation` validates account ownership
- Test `getTransactionsByFund` filters by `allocatedFundId`
- Test `getTransactionsByFund` orders by datetime descending
- Test `calculateFundAllocationTotal` sums transaction amounts correctly

**RulesService Tests** (`rulesService.test.ts`):
- Test `validateFundAssignmentRule` checks fund account validity
- Test `applyRulesToTransaction` applies `assignFund` action
- Test `applyRulesToTransaction` handles multiple rules (last wins)

#### Backend Unit Tests

**RulesService Tests** (`rulesService.test.ts`):
- Test `validateFundAccount` returns true for valid fund accounts
- Test `validateFundAccount` returns false for non-existent accounts
- Test `validateFundAccount` returns false for accounts with `isFundAccount === false`
- Test `applyFundAssignment` sets `allocatedFundId` when valid
- Test `applyFundAssignment` logs warning and skips when invalid
- Test `applyRuleActions` processes `assignFund` action
- Test `applyRuleActions` handles missing `assignFund` gracefully

**FinancialInstitutionActivity Tests** (`financialInstitutionActivity.test.ts`):
- Test `syncTransactions` applies fund assignment rules
- Test `syncTransactions` logs fund assignments
- Test `syncTransactions` continues processing when fund validation fails

### Property-Based Testing

All property tests should run with minimum 100 iterations and be tagged with the property they validate.

**Tag Format**: `// Feature: fund-account-allocation, Property {number}: {property_text}`

#### Property Test 1: Asset Account Fund Eligibility

```typescript
// Feature: fund-account-allocation, Property 1: Asset Account Fund Eligibility
test('asset accounts can be fund accounts, liability accounts cannot', () => {
  fc.assert(
    fc.property(
      fc.oneof(
        fc.constant(AccountType.Checking),
        fc.constant(AccountType.Savings),
        fc.constant(AccountType.Investment),
        fc.constant(AccountType.Other),
        fc.constant(AccountType.Credit),
        fc.constant(AccountType.Loan)
      ),
      (accountType) => {
        const isAsset = [
          AccountType.Checking,
          AccountType.Savings,
          AccountType.Investment,
          AccountType.Other
        ].includes(accountType);

        const canBeFund = AccountService.validateFundAccountEligibility(accountType);

        return canBeFund === isAsset;
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property Test 2: Balance Independence

```typescript
// Feature: fund-account-allocation, Property 3: Balance Independence
test('fund allocations do not affect account balance', async () => {
  fc.assert(
    fc.asyncProperty(
      fc.string(), // transaction ID
      fc.option(fc.string(), { nil: null }), // fund ID or null
      async (transactionId, fundId) => {
        const account = await createTestAccount();
        const initialBalance = account.balance;

        const transaction = await createTestTransaction(account.id);
        await TransactionsService.updateTransactionFundAllocation(
          transaction.id,
          fundId
        );

        const updatedAccount = await getAccount(account.id);

        return updatedAccount.balance === initialBalance;
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property Test 3: Last Rule Wins

```typescript
// Feature: fund-account-allocation, Property 5: Last Rule Wins
test('last matching rule wins for fund assignment', () => {
  fc.assert(
    fc.property(
      fc.array(fc.string(), { minLength: 2, maxLength: 5 }), // fund IDs
      (fundIds) => {
        const rules = fundIds.map(fundId => ({
          name: `Rule for ${fundId}`,
          enabled: true,
          matchingCriteria: { /* matches all */ },
          action: { assignFund: fundId }
        }));

        const transaction = createTestTransaction();
        const result = RulesService.applyRulesToTransaction(transaction, rules);

        return result.allocatedFundId === fundIds[fundIds.length - 1];
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property Test 4: CSP Savings/Investment Auto-Enable

```typescript
// Feature: fund-account-allocation, Property 9 & 10: CSP Auto-Enable
test('linking to savings/investment categories enables fund status', async () => {
  fc.assert(
    fc.asyncProperty(
      fc.oneof(
        fc.constant(CSPBucket.Savings),
        fc.constant(CSPBucket.Investment),
        fc.constant(CSPBucket.Income),
        fc.constant(CSPBucket.FixedCost),
        fc.constant(CSPBucket.GuildFreeSpending),
        fc.constant(CSPBucket.Ignored)
      ),
      fc.oneof(
        fc.constant(AccountType.Checking),
        fc.constant(AccountType.Savings),
        fc.constant(AccountType.Investment),
        fc.constant(AccountType.Other)
      ),
      async (cspBucket, accountType) => {
        const account = await createTestAccount({ accountType, isFundAccount: false });

        await AccountService.handleCSPCategoryLinking(account.id, cspBucket);

        const updatedAccount = await getAccount(account.id);

        const shouldEnable =
          cspBucket === CSPBucket.Savings || cspBucket === CSPBucket.Investment;

        return updatedAccount.isFundAccount === shouldEnable;
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

#### End-to-End Flows

**Test**: Complete fund account workflow
1. Create manual account
2. Enable fund account status
3. Create transaction
4. Allocate transaction to fund
5. View fund account page
6. Verify transaction appears
7. Remove allocation
8. Verify transaction removed from fund view

**Test**: Rule-based fund assignment (UI)
1. Create fund account
2. Create rule with `assignFund` action
3. Tag transaction matching rule criteria
4. Verify `allocatedFundId` is set automatically

**Test**: Rule-based fund assignment (Plaid sync)
1. Create fund account
2. Create rule with `assignFund` action
3. Trigger Plaid sync
4. Verify imported transactions have `allocatedFundId` set

**Test**: CSP category linking auto-enable
1. Create checking account (fund status disabled)
2. Link account to "Emergency Fund" category (Savings bucket)
3. Verify fund status is automatically enabled
4. Verify account appears in fund dropdowns

**Test**: Cross-account allocation
1. Create two accounts (A and B)
2. Enable fund status on account B
3. Create transaction in account A
4. Allocate transaction to fund B
5. Verify transaction appears in fund B view
6. Verify account A balance unchanged
7. Verify account B balance unchanged

### Manual Testing Checklist

- [ ] Toggle fund status on asset account (checking, savings, investment, other)
- [ ] Attempt to toggle fund status on liability account (credit, loan) - should fail
- [ ] Disable fund status with allocated transactions - warning dialog appears
- [ ] Allocate transaction to fund via dropdown
- [ ] Clear fund allocation via dropdown
- [ ] View fund account page with allocated transactions
- [ ] Remove allocation from fund account page
- [ ] Create rule with fund assignment
- [ ] Verify rule applies during transaction tagging
- [ ] Verify rule applies during Plaid sync
- [ ] Link account to Savings category - fund status auto-enabled
- [ ] Link account to Investment category - fund status auto-enabled
- [ ] Link account to Income category - fund status unchanged
- [ ] Attempt to link liability account to Savings category - should fail
- [ ] Unlink account from category - fund status remains enabled
- [ ] Test on mobile (responsive design)
- [ ] Test with no fund accounts (empty state messages)
- [ ] Test with invalid fund reference (error handling)

### Performance Testing

**Query Performance**:
- Test `getFundAccounts` with 50+ accounts
- Test `getTransactionsByFund` with 1000+ transactions
- Test fund allocation total calculation with large datasets

**Expected Performance**:
- Fund accounts query: < 500ms
- Fund transactions query: < 1s
- Allocation total calculation: < 1s

### Accessibility Testing

- [ ] Fund toggle switch is keyboard accessible
- [ ] Fund dropdown is keyboard accessible
- [ ] Screen reader announces fund status changes
- [ ] Screen reader announces fund allocation changes
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators are visible
- [ ] Error messages are announced by screen readers
