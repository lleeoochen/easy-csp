# Implementation Plan: Manual Saving Fund Transactions

## Overview

This implementation plan breaks down the manual saving fund transactions feature into discrete coding tasks. The feature enables users to create manual saving funds (not tied to Plaid accounts), add/edit/delete manual transactions, and track progress toward savings goals. The implementation follows existing patterns: React Query for data fetching, service layer for Firestore operations, and component reuse where possible.

## Tasks

- [x] 1. Update shared types package for manual saving funds
  - Update `SavingTarget` interface in `easy-csp-shared-types/src/firestore.types.ts` to make `financialInstitutionId` and `accountId` optional, and add `currentBalance?: number` field
  - Add type guard helper functions: `isManualFund(fund: SavingTarget): boolean` and `isManualTransaction(transaction: Transaction): boolean`
  - Export new helpers from `easy-csp-shared-types/src/index.ts`
  - Rebuild shared types package and reinstall in both `easy-csp` and `easy-csp-cloud/functions` using `npm run install:special`
  - _Requirements: 1.2, 1.5, 10.2_

- [x] 2. Implement service layer for manual transaction operations
  - [x] 2.1 Create `createTransaction` method in TransactionsService
    - Implement method signature: `createTransaction(transaction: Omit<Transaction, 'id' | 'uid'>): Promise<{ success: boolean; transaction?: Transaction & { id: string }; message?: string }>`
    - Add user authentication check and set `uid` field
    - Create transaction document in Firestore
    - If `savingTargetId` is provided, check if fund is manual (read SavingTarget, check `accountId === undefined`)
    - If fund is manual, use Firestore `runTransaction` to atomically update fund's `currentBalance` by adding transaction amount
    - Return success result with created transaction
    - _Requirements: 2.4, 2.5, 10.3, 10.4_

  - [ ]* 2.2 Write property test for transaction creation balance update
    - **Property 2: Manual Transaction Creation Balance Update**
    - **Validates: Requirements 2.5**
    - Generate random manual fund and transaction amount using fast-check
    - Create manual fund, record initial balance, create transaction, verify balance increased by transaction amount
    - Run 100 iterations

  - [x] 2.3 Create `deleteTransaction` method in TransactionsService
    - Implement method signature: `deleteTransaction(transactionId: string): Promise<{ success: boolean; message?: string }>`
    - Add user authentication and authorization checks
    - Read transaction document to get `savingTargetId` and `amount`
    - If `savingTargetId` exists, check if fund is manual
    - If fund is manual, use Firestore `runTransaction` to atomically update fund's `currentBalance` by subtracting transaction amount
    - Delete transaction document
    - Return success result
    - _Requirements: 5.3, 5.4_

  - [ ]* 2.4 Write property test for transaction deletion balance update
    - **Property 7: Transaction Deletion Balance Update**
    - **Validates: Requirements 5.4**
    - Generate random manual transaction with fund
    - Create transaction, record balance, delete transaction, verify balance decreased by transaction amount
    - Run 100 iterations

  - [x] 2.5 Extend `updateTransaction` method to handle balance updates
    - Modify existing `updateTransaction` method in TransactionsService
    - Before update, read original transaction to get old `savingTargetId` and `amount`
    - After update, compare old and new values
    - If `savingTargetId` changed and either fund is manual: use Firestore transaction to update both fund balances (subtract from old, add to new)
    - If only `amount` changed and fund is manual: use Firestore transaction to update balance by difference (new amount - old amount)
    - _Requirements: 4.3, 4.4, 4.5_

  - [ ]* 2.6 Write property tests for transaction update balance scenarios
    - **Property 4: Fund Change Balance Update**
    - **Validates: Requirements 4.4**
    - **Property 5: Amount Change Balance Update**
    - **Validates: Requirements 4.5**
    - Generate random fund changes and amount changes
    - Verify balance updates for all scenarios: manual→manual, manual→account, account→manual
    - Run 100 iterations per property

- [x] 3. Extend SavingTargetsService for manual funds
  - [x] 3.1 Extend `addSavingTarget` method to support manual funds
    - Modify method signature to make `financialInstitutionId` and `accountId` optional
    - If `accountId` is undefined, initialize `currentBalance` to 0 in the document
    - Create SavingTarget document with optional fields
    - Return success result with created fund
    - _Requirements: 1.1, 1.3_

  - [x] 3.2 Extend `listSavingTargets` method to return currentBalance for manual funds
    - Modify existing method to check if fund is manual (`accountId === undefined`)
    - For manual funds, use `currentBalance` field as the `currentAmount` in UI_SavingTargetAndBalance
    - For account-based funds, continue using account balance from institution
    - Set `institutionName` and `accountName` to "Manual Entry" for manual funds
    - _Requirements: 7.2, 7.5_

  - [ ]* 3.3 Write property tests for manual fund operations
    - **Property 1: Fund Type Determination**
    - **Validates: Requirements 1.5**
    - **Property 9: Manual Fund Balance Source**
    - **Validates: Requirements 7.2**
    - Generate random funds with and without accountId
    - Verify fund type classification and balance source
    - Run 100 iterations per property

- [x] 4. Create React Query hooks for manual transactions
  - [x] 4.1 Implement `useCreateTransaction` hook
    - Create hook in `src/hooks/api/useTransactions.ts`
    - Use `useMutation` with `TransactionsService.createTransaction` as mutation function
    - On success, invalidate both `['transactions']` and `['savingTargets']` query keys
    - Return mutation object with loading, error, and success states
    - _Requirements: 2.4, 3.4_

  - [x] 4.2 Implement `useDeleteTransaction` hook
    - Create hook in `src/hooks/api/useTransactions.ts`
    - Use `useMutation` with `TransactionsService.deleteTransaction` as mutation function
    - On success, invalidate both `['transactions']` and `['savingTargets']` query keys
    - Return mutation object
    - _Requirements: 5.3_

  - [x] 4.3 Extend `useAddSavingTarget` hook to support manual funds
    - Modify existing hook in `src/hooks/api/useFunds.ts`
    - Make `selectedAccount` parameter optional
    - If `selectedAccount` is undefined, call `addSavingTarget` without institution/account IDs
    - Return UI_SavingTargetAndBalance with "Manual Entry" for institution and account names
    - _Requirements: 1.1_

- [x] 5. Extend TransactionEditDialog for manual transaction support
  - [x] 5.1 Add create mode support to TransactionEditDialog
    - Modify component to accept `transaction: Transaction | null` (null for create mode)
    - Add `prefilledSavingTargetId?: string` prop for pre-populating fund selection
    - When `transaction === null`, render empty form fields
    - When `prefilledSavingTargetId` is provided, pre-select that fund in the dropdown
    - Add form state management for all editable fields
    - _Requirements: 2.2, 2.3_

  - [x] 5.2 Implement manual vs Plaid transaction detection and field control
    - Add helper to detect manual transaction: check `institutionId === null || institutionId === undefined`
    - For manual transactions: enable editing of name, amount, date, category, savingTargetId, nickname
    - For Plaid transactions: disable editing of name, amount, date; enable category, savingTargetId, nickname
    - Display transaction source indicator (show institution name for Plaid, "Manual Entry" for manual)
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 5.3 Add delete functionality for manual transactions
    - Show "Delete" button only when transaction is manual (not Plaid)
    - On delete click, show confirmation dialog
    - On confirmation, call `useDeleteTransaction` mutation
    - Close dialog on successful deletion
    - _Requirements: 5.1, 5.2_

  - [x] 5.4 Implement validation for manual transaction fields
    - Validate transaction name is non-empty and not just whitespace
    - Validate amount is non-zero (allow both positive and negative)
    - Validate date is valid (not NaN, within reasonable bounds)
    - Display error messages for validation failures
    - Disable save button when validation fails
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 5.5 Wire up save action for create and edit modes
    - In create mode, call `useCreateTransaction` mutation with form data
    - In edit mode, call existing `useUpdateTransaction` mutation
    - Set `institutionId` and `accountId` to null for manual transactions
    - Set `plaidCategory` to empty string or "Manual" for manual transactions
    - Close dialog on successful save
    - _Requirements: 2.4, 4.3_

  - [ ]* 5.6 Write component tests for TransactionEditDialog
    - Test create mode renders with empty fields
    - Test edit mode renders with populated fields
    - Test manual transaction enables all fields
    - Test Plaid transaction disables name/amount/date fields
    - Test delete button only shows for manual transactions
    - Test validation prevents saving invalid data

- [x] 6. Add "Add Transaction" button to TransactionsPage
  - [x] 6.1 Add button to page header
    - Add "Add Transaction" button in TransactionsPage header
    - Use existing button component styling
    - On click, open TransactionEditDialog with `transaction={null}` (create mode)
    - _Requirements: 3.1, 3.2_

  - [x] 6.2 Add visual indicators for manual transactions
    - Add icon or badge to manual transaction rows in the transaction list
    - Use `isManualTransaction` helper to detect manual transactions
    - Display "Manual Entry" as institution name for manual transactions
    - _Requirements: 3.5, 6.1, 7.4_

- [x] 7. Add "Add Transaction" button to manual fund rows
  - [x] 7.1 Extend SavingFundRow component with "Add Transaction" button
    - Add button to each manual fund row (check `isManualFund(fund)`)
    - On click, open TransactionEditDialog with `transaction={null}` and `prefilledSavingTargetId={fund.id}`
    - _Requirements: 2.1, 2.2_

  - [x] 7.2 Add visual indicator for manual funds
    - Add icon or badge to distinguish manual funds from account-based funds
    - Display "Manual Entry" as institution/account name for manual funds
    - _Requirements: 1.4_

- [x] 8. Implement direct balance setting for manual funds
  - [x] 8.1 Add setFundBalance method to SavingTargetsService
    - Implement method signature: `setFundBalance(savingTargetId: string, newBalance: number): Promise<{ success: boolean; message?: string }>`
    - Add user authentication check
    - Read fund document and verify it exists and belongs to user
    - Verify fund is manual (accountId is undefined)
    - Return error if fund is account-based
    - Use `updateDoc` with `prepareFirestoreData` to set currentBalance field to exact value
    - Return success result
    - _Requirements: 11.4, 11.5_

  - [x] 8.2 Create useSetFundBalance React Query hook
    - Create hook in `src/hooks/api/useFunds.ts`
    - Use `useMutation` with `SavingTargetsService.setFundBalance` as mutation function
    - On success, invalidate `['savingTargets']` query key
    - Return mutation object with loading, error, and success states
    - _Requirements: 11.4_

  - [x] 8.3 Create SetBalanceDialog component
    - Create new component in `src/components/SetBalanceDialog.tsx`
    - Accept props: `open`, `onOpenChange`, `savingTarget`
    - Display current balance as read-only reference field
    - Add numeric input field for new balance (labeled "New Balance")
    - Validate input is a valid number (not NaN, not empty, not Infinity)
    - Allow positive, negative, and zero values
    - Display error message for invalid input
    - Disable save button when validation fails
    - On save, call `useSetFundBalance` mutation with savingTargetId and newBalance
    - Show success toast notification on successful save
    - Show error toast notification on failure
    - Close dialog automatically on successful save
    - _Requirements: 11.2, 11.3, 11.4_

  - [x] 8.4 Add "Set Balance" button to SavingFundRow
    - Add "Set Balance" button to each manual fund row
    - Only show button when `isManualFund(savingTarget)` returns true (accountId is undefined)
    - On click, open SetBalanceDialog with the fund's data
    - Button should be visually distinct from "Add Transaction" button
    - _Requirements: 11.1, 11.5_

  - [ ]* 8.5 Write property tests for direct balance setting
    - **Property 22: Direct Balance Set Updates Field**
    - **Validates: Requirements 11.4**
    - **Property 23: Balance Set Preserves Transactions**
    - **Validates: Requirements 11.6**
    - Generate random balance values (positive, negative, zero)
    - Create manual fund with transactions, set balance, verify transactions unchanged
    - Verify balance is set to exact value provided
    - Run 100 iterations per property

- [x] 9. Checkpoint - Ensure all tests pass and core functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement property-based tests for correctness properties
  - [ ]* 10.1 Write property test for account-based fund balance immutability
    - **Property 12: Account-Based Fund Balance Immutability**
    - **Validates: Requirements 7.6**
    - Create account-based fund, perform transaction operations, verify currentBalance field is never modified
    - Run 100 iterations

  - [ ]* 10.2 Write property test for validation rules
    - **Property 13: Non-Empty Name Validation**
    - **Validates: Requirements 8.1**
    - **Property 14: Valid Date Validation**
    - **Validates: Requirements 8.3**
    - **Property 15: Amount Sign Acceptance**
    - **Validates: Requirements 8.5**
    - Generate invalid inputs and verify rejection
    - Run 100 iterations per property

  - [ ]* 10.3 Write property test for filter parity
    - **Property 10: Filter Parity for Manual Transactions**
    - **Validates: Requirements 7.3, 9.1, 9.2, 9.3, 9.4**
    - Generate random transaction sets with manual and Plaid transactions
    - Apply filters (category, fund, date range, search) and verify manual transactions included correctly
    - Run 100 iterations

  - [ ]* 10.4 Write property test for CSP bucket totals
    - **Property 16: CSP Bucket Total Inclusion**
    - **Validates: Requirements 9.5**
    - Generate random manual transactions across categories
    - Calculate bucket totals and verify manual transaction amounts included
    - Run 100 iterations

  - [ ]* 10.5 Write property test for round-trip balance consistency
    - **Property 21: Balance Invariant (Round-Trip)**
    - **Validates: Requirements 2.5, 5.4**
    - Create manual fund, record balance, create transaction, delete same transaction, verify balance unchanged
    - Run 100 iterations

  - [ ]* 10.6 Write property tests for transaction operations
    - **Property 3: Transaction Update Preserves Data**
    - **Validates: Requirements 4.3**
    - **Property 6: Transaction Deletion Removes Document**
    - **Validates: Requirements 5.3**
    - **Property 8: Manual Transactions Excluded from Auto-Assignment**
    - **Validates: Requirements 7.1**
    - Generate random transaction updates and verify correctness
    - Run 100 iterations per property

  - [ ]* 10.7 Write property tests for data integrity
    - **Property 17: Manual Transaction Source Indicator**
    - **Validates: Requirements 10.2**
    - **Property 18: Transaction ID Uniqueness**
    - **Validates: Requirements 10.3**
    - **Property 19: User Ownership Enforcement**
    - **Validates: Requirements 10.4**
    - **Property 20: Query Support for Manual Transactions**
    - **Validates: Requirements 10.5**
    - Verify data integrity constraints across random inputs
    - Run 100 iterations per property

- [x] 11. Final checkpoint - Verify all functionality and tests
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The implementation follows existing patterns: React Query for data fetching, service layer for Firestore, component reuse
- Firestore transactions ensure atomic balance updates for data consistency
- Manual transactions integrate seamlessly with existing features (filters, categories, CSP buckets)
- Property tests use fast-check with 100 iterations each to verify correctness properties
