# Requirements Document

## Introduction

The Fund Account Allocation feature enables users to designate specific asset accounts as "fund accounts" and allocate transactions to these funds for budgeting and tracking purposes. This feature supports envelope budgeting and goal-based savings by allowing users to track how money is allocated across different purposes (e.g., emergency fund, vacation fund, car repair fund) without creating separate physical accounts.

## Glossary

- **Fund_Account**: An asset account (checking, savings, investment, or other) that has been designated for tracking allocated transactions
- **Transaction_Allocation**: The association between a transaction and a fund account for tracking purposes
- **Asset_Account**: An account with type checking, savings, investment, or other (positive balance accounts)
- **Liability_Account**: An account with type credit or loan (debt accounts)
- **Rule_Engine**: The system that automatically applies transformations to transactions based on matching criteria
- **Travel_Mode**: A feature that allows tagging transactions with travel-related metadata
- **Plaid_Sync**: The backend process that imports transactions from linked financial institutions

## Requirements

### Requirement 1: Fund Account Designation

**User Story:** As a user, I want to mark specific asset accounts as fund accounts, so that I can track transaction allocations for budgeting purposes.

#### Acceptance Criteria

1. THE FinancialAccount_Interface SHALL include an `isFundAccount` boolean field
2. WHEN an account has type checking, savings, investment, or other, THE Account_Settings_UI SHALL display a toggle to enable or disable fund account status
3. WHEN an account has type credit or loan, THE Account_Settings_UI SHALL NOT display the fund account toggle
4. WHEN a user attempts to enable fund account status on a liability account, THE System SHALL prevent the operation and display an error message
5. WHEN a new savings account is created or imported, THE System SHALL set `isFundAccount` to true by default
6. WHEN a new investment account is created or imported, THE System SHALL set `isFundAccount` to true by default
7. WHEN a new checking, other, credit, or loan account is created or imported, THE System SHALL set `isFundAccount` to false by default

### Requirement 2: Transaction Allocation

**User Story:** As a user, I want to allocate transactions to fund accounts, so that I can track how money is being used across different savings goals.

#### Acceptance Criteria

1. THE Transaction_Interface SHALL include an optional `allocatedFundId` field that references a FinancialAccount.id
2. WHEN `allocatedFundId` is set, THE System SHALL validate that the referenced account exists and has `isFundAccount` set to true
3. WHEN a transaction is allocated to a fund, THE Account_Balance SHALL remain unchanged (no automatic calculations)
4. WHEN a user views a transaction, THE Transaction_UI SHALL display the allocated fund name if `allocatedFundId` is set
5. THE System SHALL allow a transaction to have an `accountId` (the account it belongs to) and a different `allocatedFundId` (the fund it is allocated to)

### Requirement 3: Transaction Tagging Interface

**User Story:** As a user, I want to select a fund account when tagging transactions, so that I can allocate transactions to specific funds.

#### Acceptance Criteria

1. WHEN a user opens the transaction tagging interface, THE System SHALL display a dropdown of all fund accounts (accounts where `isFundAccount` is true)
2. WHEN a user selects a fund from the dropdown, THE System SHALL set the transaction's `allocatedFundId` to the selected fund's account ID
3. WHEN a user clears the fund selection, THE System SHALL set the transaction's `allocatedFundId` to null or undefined
4. THE Transaction_Tagging_UI SHALL display the currently allocated fund if one is set
5. WHEN no fund accounts exist, THE Transaction_Tagging_UI SHALL display a message indicating that fund accounts must be created first

### Requirement 4: Fund Account View

**User Story:** As a user, I want to view all transactions allocated to a specific fund, so that I can track spending and savings for that fund.

#### Acceptance Criteria

1. WHEN a user navigates to a fund account view, THE System SHALL display all transactions where `allocatedFundId` matches the fund's account ID
2. THE Fund_Account_View SHALL display the total amount of allocated transactions
3. THE Fund_Account_View SHALL display transactions in chronological order with most recent first
4. WHEN a fund account has no allocated transactions, THE Fund_Account_View SHALL display a message indicating no transactions are allocated
5. THE Fund_Account_View SHALL allow users to remove allocations by clearing the `allocatedFundId` field

### Requirement 5: Rules Engine Integration

**User Story:** As a user, I want rules to automatically assign transactions to fund accounts, so that I don't have to manually allocate every transaction.

#### Acceptance Criteria

1. THE RuleAction_Interface SHALL include an optional `assignFund` field that references a FinancialAccount.id
2. WHEN a rule with `assignFund` action matches a transaction, THE Rule_Engine SHALL set the transaction's `allocatedFundId` to the specified fund account ID
3. WHEN a rule is created or edited with `assignFund` action, THE System SHALL validate that the referenced account has `isFundAccount` set to true
4. THE Rule_Engine SHALL apply fund assignment rules during UI transaction categorization
5. THE Rule_Engine SHALL apply fund assignment rules during Plaid_Sync transaction import
6. WHEN multiple rules match a transaction and specify different fund assignments, THE System SHALL apply the fund assignment from the last matching rule

### Requirement 6: Travel Mode Integration

**User Story:** As a user, I want travel mode transactions to support fund allocation, so that I can track travel expenses against a travel fund.

#### Acceptance Criteria

1. WHEN a user tags a transaction in travel mode, THE Transaction_Tagging_UI SHALL display the fund account dropdown
2. THE System SHALL allow rules to automatically assign fund allocations to travel mode transactions based on matching criteria
3. WHEN a transaction has both travel mode tags and fund allocation, THE System SHALL preserve both pieces of metadata independently

### Requirement 7: Account Settings UI

**User Story:** As a user, I want clear messaging about fund account restrictions, so that I understand which accounts can be fund accounts.

#### Acceptance Criteria

1. WHEN a user views account settings for an asset account, THE Account_Settings_UI SHALL display explanatory text: "Enable this account as a fund account to track transaction allocations for budgeting purposes"
2. WHEN a user views account settings for a liability account, THE Account_Settings_UI SHALL display explanatory text: "Only asset accounts (checking, savings, investment, other) can be fund accounts"
3. WHEN a user toggles fund account status, THE System SHALL update the `isFundAccount` field in Firestore
4. THE Account_Settings_UI SHALL display the current fund account status clearly (enabled/disabled)

### Requirement 8: Data Validation

**User Story:** As a developer, I want data validation for fund allocations, so that the system maintains data integrity.

#### Acceptance Criteria

1. WHEN a transaction is saved with `allocatedFundId` set, THE System SHALL verify the referenced account exists
2. WHEN a transaction is saved with `allocatedFundId` set, THE System SHALL verify the referenced account has `isFundAccount` set to true
3. IF a referenced fund account does not exist or is not a fund account, THEN THE System SHALL reject the transaction save operation and return a validation error
4. WHEN a user attempts to disable fund account status on an account that has allocated transactions, THE System SHALL display a warning message listing the number of affected transactions
5. THE System SHALL allow disabling fund account status even if transactions are allocated (allocations become invalid but are preserved for data recovery)

### Requirement 9: Backend Plaid Sync Integration

**User Story:** As a developer, I want Plaid sync to support fund allocation rules, so that imported transactions are automatically allocated to funds.

#### Acceptance Criteria

1. WHEN Plaid_Sync imports a new transaction, THE Rule_Engine SHALL evaluate all rules including fund assignment rules
2. WHEN a rule with `assignFund` action matches an imported transaction, THE System SHALL set the transaction's `allocatedFundId` before saving to Firestore
3. THE Plaid_Sync_Process SHALL log fund assignment actions for debugging purposes
4. IF a fund assignment rule references a non-existent or invalid fund account, THEN THE System SHALL log a warning and skip the fund assignment (but still import the transaction)

### Requirement 10: Account Balance Independence

**User Story:** As a user, I want account balances to remain independent of transaction allocations, so that my actual account balances are not affected by fund tracking.

#### Acceptance Criteria

1. WHEN a transaction is allocated to a fund, THE Account_Balance SHALL NOT be automatically adjusted
2. WHEN a transaction is removed from a fund allocation, THE Account_Balance SHALL NOT be automatically adjusted
3. THE System SHALL NOT perform any automatic balance calculations based on `allocatedFundId` values
4. THE Fund_Account_View SHALL display allocated transaction totals separately from the account balance
5. THE Account_Detail_View SHALL display the actual account balance without considering transaction allocations

### Requirement 11: CSP Category Linking Auto-Enablement

**User Story:** As a user, I want accounts linked to CSP savings/investment categories to automatically become fund accounts, so that I can immediately allocate transactions without additional configuration.

#### Acceptance Criteria

1. WHEN a user links an account to a CSP category in the Savings bucket, THE System SHALL automatically set `isFundAccount` to true for that account
2. WHEN a user links an account to a CSP category in the Investment bucket, THE System SHALL automatically set `isFundAccount` to true for that account
3. WHEN a user links an account to a CSP category in any other bucket (Income, FixedCost, GuildFreeSpending, Ignored), THE System SHALL NOT automatically modify the `isFundAccount` status
4. WHEN the system attempts to auto-enable fund status during CSP linking, THE System SHALL validate that the account is an asset type (checking, savings, investment, or other)
5. IF a user attempts to link a liability account (credit or loan) to a Savings or Investment category, THE System SHALL prevent the linking operation and display an error message
6. WHEN an account is already a fund account and is linked to a Savings or Investment category, THE System SHALL maintain the existing fund status without error
7. WHEN a user unlinks an account from a CSP category, THE System SHALL NOT automatically disable the fund account status
8. THE CSP_Settings_UI SHALL display a success message indicating both the category link and fund enablement when applicable
