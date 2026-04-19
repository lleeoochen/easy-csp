# Implementation Plan: Fund Account Allocation

## Overview

This implementation plan breaks down the Fund Account Allocation feature into discrete coding tasks. The feature enables users to designate asset accounts as "fund accounts" and allocate transactions to these funds for envelope budgeting and goal-based savings tracking.

The implementation follows this sequence:
1. Extend shared types for data model changes
2. Update backend services and Cloud Functions for Plaid sync integration
3. Implement frontend services for fund management
4. Build UI components for account settings and transaction tagging
5. Create fund account view page
6. Wire everything together and validate end-to-end flows

## Tasks

- [x] 1. Extend shared types for fund account allocation
  - Add `isFundAccount` field to `FinancialAccount` interface
  - Add `allocatedFundId` field to `Transaction` interface
  - Add `assignFund` field to `RuleAction` interface
  - Export updated types through index.ts
  - Run `npm run install:special` in both easy-csp and easy-csp-cloud/functions
  - _Requirements: 1.1, 2.1, 5.1_

- [ ] 2. Implement backend fund allocation logic
  - [x] 2.1 Extend RulesService to handle assignFund action
    - Add `validateFundAccount` private method to check if account exists and has `isFundAccount === true`
    - Add `applyFundAssignment` private method to set `allocatedFundId` on transactions
    - Update `applyRuleActions` method to process `assignFund` action
    - Add logging for fund assignment actions
    - Handle validation failures gracefully (log warning, skip assignment, continue processing)
    - _Requirements: 5.2, 5.3, 9.4_

  - [x] 2.2 Update FinancialInstitutionActivity for Plaid sync integration
    - Modify `syncTransactions` to apply fund assignment rules before saving transactions
    - Ensure fund allocations are set on imported transactions when rules match
    - Add logging for fund assignments during Plaid sync
    - _Requirements: 5.5, 9.1, 9.2, 9.3_

  - [x] 2.3 Set default isFundAccount values for new accounts
    - Update account creation logic to set `isFundAccount: true` for savings and investment accounts
    - Update account creation logic to set `isFundAccount: false` for checking, other, credit, and loan accounts
    - Apply defaults during both manual account creation and Plaid import
    - _Requirements: 1.5, 1.6, 1.7_

- [x]* 3. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement frontend fund account services
  - [x] 4.1 Extend AccountService with fund account methods
    - Implement `updateFundAccountStatus` to toggle `isFundAccount` field with validation
    - Implement `getFundAccounts` to query accounts where `isFundAccount === true`
    - Implement `validateFundAccountEligibility` to check if account type is asset
    - Implement `handleCSPCategoryLinking` to auto-enable fund status for Savings/Investment categories
    - Add Firestore query for fund accounts with proper indexing
    - _Requirements: 1.2, 1.3, 1.4, 11.1, 11.2, 11.3, 11.4, 11.5, 11.7_

  - [x] 4.2 Extend TransactionsService with fund allocation methods
    - Implement `updateTransactionFundAllocation` to set/clear `allocatedFundId` with validation
    - Implement `getTransactionsByFund` to query transactions by `allocatedFundId`
    - Implement `calculateFundAllocationTotal` to sum transaction amounts for a fund
    - Add Firestore queries with proper ordering and filtering
    - _Requirements: 2.2, 4.1, 4.2, 4.3_

  - [x] 4.3 Extend RulesService with fund assignment validation
    - Implement `validateFundAssignmentRule` to check fund account validity when creating/editing rules
    - Update `applyRulesToTransaction` to handle `assignFund` action in frontend rule application
    - Ensure fund assignment rules work during UI transaction categorization
    - _Requirements: 5.3, 5.4_

- [x] 5. Create React Query hooks for fund operations
  - Create `useFundAccounts` hook to fetch all fund accounts
  - Create `useUpdateFundStatus` mutation hook for toggling fund account status
  - Create `useFundTransactions` hook to fetch transactions allocated to a fund
  - Create `useUpdateFundAllocation` mutation hook for setting/clearing transaction allocations
  - Create `useFundAllocationTotal` hook to calculate total allocated amount
  - _Requirements: 2.2, 4.1, 4.2_

- [x] 6. Build account settings UI for fund account toggle
  - [x] 6.1 Update AccountSettingsCard component
    - Add toggle switch for `isFundAccount` status
    - Show toggle only for asset accounts (checking, savings, investment, other)
    - Display explanatory text based on account type
    - Add validation to prevent enabling fund status on liability accounts
    - Show warning dialog when disabling fund status with allocated transactions
    - Display count of affected transactions in warning dialog
    - _Requirements: 1.2, 1.3, 1.4, 7.1, 7.2, 7.3, 7.4, 8.4_

  - [x] 6.2 Create FundAccountWarningDialog component
    - Display warning message with transaction count
    - Show "Disable Anyway" and "Cancel" buttons
    - Query transaction count using `allocatedFundId` filter
    - Handle user confirmation to proceed with disabling
    - _Requirements: 8.4, 8.5_

- [x] 7. Build transaction tagging UI for fund allocation
  - [x] 7.1 Create FundAccountDropdown component
    - Fetch and display all fund accounts in dropdown
    - Show currently allocated fund if set
    - Add "Clear allocation" button when fund is selected
    - Display empty state message when no fund accounts exist
    - Handle fund selection and clearing
    - Make dropdown responsive (mobile and desktop)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 7.2 Integrate FundAccountDropdown into transaction tagging modal
    - Add fund dropdown to existing transaction tagging UI
    - Position dropdown appropriately in the modal layout
    - Ensure fund allocation works alongside category selection
    - Apply fund assignment rules when transaction is tagged
    - Preserve fund allocation when other transaction fields are updated
    - _Requirements: 3.1, 3.2, 3.3, 5.4_

  - [x] 7.3 Support fund allocation in travel mode
    - Ensure fund dropdown appears in travel mode transaction tagging
    - Allow rules to assign funds to travel mode transactions
    - Preserve both travel mode tags and fund allocation independently
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 8. Create fund account view page
  - [x] 8.1 Create FundAccountView page component
    - Display list of all transactions allocated to the fund
    - Show total allocation amount at the top
    - Order transactions by datetime descending (most recent first)
    - Add date range filtering controls
    - Show empty state when no transactions are allocated
    - Add link to account settings to manage fund status
    - Make layout responsive for mobile and desktop
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 8.2 Create FundTransactionCard component
    - Display transaction details (name, amount, date, category)
    - Show "Remove allocation" button
    - Handle allocation removal with confirmation
    - Update total when allocation is removed
    - Use existing transaction card styling for consistency
    - _Requirements: 4.5_

  - [x] 8.3 Add navigation to fund account view
    - Add route for fund account view page
    - Add navigation link from account detail page
    - Add navigation link from account settings
    - Show fund indicator badge on accounts list for fund accounts
    - _Requirements: 4.1_

- [ ] 9. Implement data validation
  - [x] 9.1 Add transaction-level fund allocation validation
    - Validate that `allocatedFundId` references an existing account
    - Validate that referenced account has `isFundAccount === true`
    - Validate that referenced account belongs to the same user
    - Return clear error messages for validation failures
    - Implement validation in both frontend and backend
    - _Requirements: 2.2, 8.1, 8.2, 8.3_

  - [x] 9.2 Add rule-level fund assignment validation
    - Validate `assignFund` references a valid fund account when creating rules
    - Validate `assignFund` references a valid fund account when editing rules
    - Show validation errors in rules UI
    - Prevent saving invalid rules
    - _Requirements: 5.3, 8.1, 8.2_

- [x] 10. Ensure account balance independence
  - [x] 10.1 Verify balance calculations ignore fund allocations
    - Review existing balance calculation logic
    - Ensure `allocatedFundId` is not used in any balance calculations
    - Verify account detail view shows actual balance only
    - Verify fund account view shows allocation total separately from balance
    - Add comments in code to document this separation
    - _Requirements: 2.3, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 11. Implement CSP category linking integration
  - [x] 11.1 Integrate handleCSPCategoryLinking into CSP settings UI
    - Locate the CSP settings component where users link accounts to categories
    - Call `accountService.handleCSPCategoryLinking(accountId, cspBucket)` after successful category link
    - Display success message when fund status is auto-enabled: "Account linked to [category name] and enabled as fund account"
    - Display standard message when fund already enabled: "Account linked to [category name]"
    - Handle errors gracefully with fallback message
    - _Requirements: 11.1, 11.2, 11.8_

  - [x] 11.2 Add validation to prevent liability account linking to Savings/Investment
    - Add validation check before allowing account link to Savings/Investment categories
    - Display error message: "Only asset accounts can be linked to savings/investment categories"
    - Prevent the linking operation if validation fails
    - _Requirements: 11.4, 11.5_

  - [x] 11.3 Test CSP category linking auto-enablement
    - Test linking asset account to Savings category auto-enables fund status
    - Test linking asset account to Investment category auto-enables fund status
    - Test linking asset account to other buckets does not auto-enable fund status
    - Test linking liability account to Savings/Investment is prevented
    - Test unlinking account does not disable fund status
    - Test linking already-enabled fund account works without error
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [ ] 12. Final integration and testing
  - [ ] 12.1 Wire all components together
    - Verify fund account toggle works end-to-end
    - Verify transaction fund allocation works in tagging UI
    - Verify fund account view displays correct data
    - Verify rules automatically assign funds during UI tagging
    - Verify rules automatically assign funds during Plaid sync
    - Test cross-account allocation (transaction in one account, allocated to different fund)
    - Verify CSP category linking auto-enables fund status
    - _Requirements: All_

  - [ ] 12.2 Test edge cases and error handling
    - Test disabling fund status with allocated transactions
    - Test deleting a fund account with allocated transactions
    - Test invalid fund references in rules
    - Test fund allocation with split transactions
    - Test fund allocation with hidden transactions
    - Test multiple rules with different fund assignments (last rule wins)
    - Test CSP linking edge cases (already enabled, liability accounts, unlinking)
    - _Requirements: 5.6, 8.4, 8.5, 9.4, 11.1-11.7_

- [ ]* 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks reference specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Implementation follows the existing Easy CSP architecture patterns
- React Query is used for all new data fetching (per project guidelines)
- Tailwind CSS v4 is used for all styling with responsive utilities
- All Firestore writes use `prepareFirestoreData` or `withoutUndefinedValue` helpers
- Fund allocations are metadata only - they never affect account balances
- The feature is fully backward compatible - all changes are additive
