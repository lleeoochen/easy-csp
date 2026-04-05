# Requirements Document

## Introduction

This feature extends the Easy CSP app's saving fund functionality to support manual saving funds that are not tied to Plaid-connected financial accounts. Users can create manual saving funds, add manual transactions to these funds, and track progress toward their savings goals without requiring bank account integration. This addresses use cases where users want to track cash savings, non-connected accounts, or other manual savings methods.

## Glossary

- **Manual_Saving_Fund**: A saving target that is not associated with a Plaid-connected financial account (identified by null/undefined accountId)
- **Account_Based_Saving_Fund**: A saving target that is associated with a Plaid-connected financial account (existing functionality)
- **Manual_Transaction**: A user-created transaction entry that is not synced from Plaid
- **Plaid_Transaction**: A transaction automatically synced from a connected financial institution via Plaid
- **Saving_Fund_UI**: The user interface component displaying saving fund rows with progress and actions
- **Transaction_Dialog**: A modal dialog for creating or editing transaction details
- **Transaction_Page**: The page displaying all transactions with filtering and management capabilities
- **Firestore**: The Firebase database storing all application data
- **SavingTarget_Document**: The Firestore document representing a saving fund
- **Transaction_Document**: The Firestore document representing a transaction
- **currentBalance**: A field on SavingTarget_Document that stores the current balance for Manual_Saving_Fund entries (updated transactionally)

## Requirements

### Requirement 1: Create Manual Saving Fund

**User Story:** As a user, I want to create a saving fund without selecting a financial account, so that I can track savings that are not connected to Plaid.

#### Acceptance Criteria

1. WHEN a user creates a saving fund without selecting an account, THE Saving_Fund_UI SHALL create a Manual_Saving_Fund with null or undefined accountId
2. THE Firestore SHALL store Manual_Saving_Fund documents with optional financialInstitutionId and accountId fields (null or undefined for manual funds)
3. THE Firestore SHALL initialize the currentBalance field to 0 for new Manual_Saving_Fund documents
4. THE Saving_Fund_UI SHALL display Manual_Saving_Fund entries with a visual indicator distinguishing them from Account_Based_Saving_Fund entries
5. THE Saving_Fund_UI SHALL determine fund type by checking if accountId is null or undefined (manual) versus defined (account-based)

### Requirement 2: Add Manual Transaction from Saving Fund Row

**User Story:** As a user, I want to add a transaction directly from a saving fund row, so that I can quickly record deposits or withdrawals for that fund.

#### Acceptance Criteria

1. THE Saving_Fund_UI SHALL display an "Add Transaction" button on each Manual_Saving_Fund row
2. WHEN a user clicks the "Add Transaction" button, THE Saving_Fund_UI SHALL open the Transaction_Dialog pre-populated with the fund's savingTargetId
3. THE Transaction_Dialog SHALL accept user input for transaction name, amount, date, and category
4. WHEN a user saves the transaction, THE Firestore SHALL create a new Transaction_Document with the specified savingTargetId and null institutionId and accountId
5. IF the associated saving fund has no accountId (is manual), THEN WHEN a Manual_Transaction is created, THE Firestore SHALL transactionally update the associated Manual_Saving_Fund currentBalance by adding the transaction amount

### Requirement 3: Add Manual Transaction from Transaction Page

**User Story:** As a user, I want to manually add a transaction from the transaction page, so that I can record transactions that are not automatically synced.

#### Acceptance Criteria

1. THE Transaction_Page SHALL display an "Add Transaction" button
2. WHEN a user clicks the "Add Transaction" button, THE Transaction_Page SHALL open the Transaction_Dialog without pre-populated fields
3. THE Transaction_Dialog SHALL allow the user to optionally select a saving fund from all available funds (both manual and account-based)
4. WHEN a user saves the transaction without selecting a fund, THE Firestore SHALL create a Transaction_Document with null savingTargetId
5. THE Transaction_Page SHALL display Manual_Transaction entries alongside Plaid_Transaction entries with a visual indicator

### Requirement 4: Edit Manual Transaction

**User Story:** As a user, I want to edit manual transactions, so that I can correct mistakes or update transaction details.

#### Acceptance Criteria

1. WHEN a user clicks on a Manual_Transaction, THE Transaction_Page SHALL open the Transaction_Dialog with editable fields
2. THE Transaction_Dialog SHALL allow modification of name, amount, date, category, and savingTargetId for Manual_Transaction entries
3. WHEN a user saves changes to a Manual_Transaction, THE Firestore SHALL update the Transaction_Document with the new values
4. IF the savingTargetId is changed AND the old or new saving fund has no accountId (is manual), THEN THE Firestore SHALL transactionally update currentBalance for the manual fund(s) (subtract old amount from old manual fund, add new amount to new manual fund)
5. IF only the amount is changed AND the saving fund has no accountId (is manual), THEN THE Firestore SHALL transactionally update the associated Manual_Saving_Fund currentBalance by the difference (new amount minus old amount)

### Requirement 5: Delete Manual Transaction

**User Story:** As a user, I want to delete manual transactions, so that I can remove incorrect or duplicate entries.

#### Acceptance Criteria

1. THE Transaction_Dialog SHALL display a "Delete" button for Manual_Transaction entries
2. WHEN a user clicks the "Delete" button, THE Transaction_Dialog SHALL prompt for confirmation
3. WHEN a user confirms deletion, THE Firestore SHALL remove the Transaction_Document
4. IF the deleted transaction had a savingTargetId AND the saving fund has no accountId (is manual), THEN THE Firestore SHALL transactionally update the Manual_Saving_Fund currentBalance by subtracting the transaction amount

### Requirement 6: Distinguish Manual from Plaid Transactions

**User Story:** As a user, I want to easily identify which transactions are manual and which are synced from my bank, so that I understand the source of each transaction.

#### Acceptance Criteria

1. THE Transaction_Page SHALL display a visual indicator (icon or badge) on Manual_Transaction entries
2. THE Transaction_Dialog SHALL display the transaction source (manual or institution name) in a read-only field
3. WHEN a Plaid_Transaction is displayed, THE Transaction_Dialog SHALL disable editing of amount, date, and name fields
4. WHEN a Manual_Transaction is displayed, THE Transaction_Dialog SHALL enable editing of all fields

### Requirement 7: Handle Code Assumptions About Financial Accounts

**User Story:** As a developer, I want the codebase to gracefully handle saving funds without financial accounts, so that existing functionality continues to work correctly.

#### Acceptance Criteria

1. WHEN TransactionActivity processes transactions, THE TransactionActivity SHALL skip auto-assignment of savingTargetId for Manual_Saving_Fund entries
2. WHEN SavingTargetsService lists saving targets, THE SavingTargetsService SHALL return the currentBalance field value for Manual_Saving_Fund entries instead of reading account balance
3. WHEN transaction filtering logic checks savingTargetId, THE filtering logic SHALL treat Manual_Transaction and Plaid_Transaction identically
4. WHEN the UI displays account information, THE UI SHALL display "Manual Entry" or equivalent text for transactions with null institutionId
5. WHEN calculating fund progress, THE calculation logic SHALL use the currentBalance field for Manual_Saving_Fund entries instead of account balance
6. WHEN a transaction is associated with an Account_Based_Saving_Fund (accountId is defined), THE system SHALL NOT update the currentBalance field and SHALL read balance from the linked account instead

### Requirement 8: Validate Manual Transaction Input

**User Story:** As a user, I want the system to validate my manual transaction input, so that I don't create invalid or incomplete entries.

#### Acceptance Criteria

1. WHEN a user attempts to save a Manual_Transaction, THE Transaction_Dialog SHALL require a non-empty transaction name
2. WHEN a user attempts to save a Manual_Transaction, THE Transaction_Dialog SHALL require a non-zero amount
3. WHEN a user attempts to save a Manual_Transaction, THE Transaction_Dialog SHALL require a valid date
4. IF validation fails, THEN THE Transaction_Dialog SHALL display an error message and prevent saving
5. THE Transaction_Dialog SHALL allow negative amounts for withdrawals and positive amounts for deposits

### Requirement 9: Support Manual Transactions in Existing Features

**User Story:** As a user, I want manual transactions to work with existing features like categories and filters, so that I have a consistent experience.

#### Acceptance Criteria

1. THE Transaction_Page SHALL include Manual_Transaction entries in category filter results
2. THE Transaction_Page SHALL include Manual_Transaction entries in saving fund filter results
3. THE Transaction_Page SHALL include Manual_Transaction entries in date range filter results
4. THE Transaction_Page SHALL include Manual_Transaction entries in search results
5. WHEN calculating CSP bucket totals, THE calculation logic SHALL include Manual_Transaction amounts

### Requirement 10: Persist Manual Transaction Data

**User Story:** As a user, I want my manual transactions to be saved reliably, so that I don't lose my data.

#### Acceptance Criteria

1. THE Firestore SHALL store Manual_Transaction documents with the same schema as Plaid_Transaction documents
2. THE Manual_Transaction SHALL include a field indicating the transaction source (manual vs plaid)
3. WHEN a Manual_Transaction is created, THE Firestore SHALL assign a unique transaction ID
4. THE Firestore SHALL enforce user ownership by storing the uid field on all Manual_Transaction documents
5. THE Firestore SHALL support querying Manual_Transaction entries by uid, savingTargetId, category, and date range

---

## Shared Types Update Required

The `SavingTarget` interface in `easy-csp-shared-types/src/firestore.types.ts` must be updated to support manual saving funds:

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

Key changes:
- `financialInstitutionId` and `accountId` are now optional (undefined for manual funds)
- `currentBalance` field added for manual funds (stores the balance, updated transactionally on transaction create/edit/delete)
- Fund type is determined by checking if `accountId` is undefined (manual) or defined (account-based)
