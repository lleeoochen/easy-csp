# Implementation Plan: Transaction Splitting

## Overview

This implementation plan breaks down the transaction splitting feature into discrete coding tasks. The feature allows users to split a single transaction into multiple independent transactions with configurable frequency (weekly, monthly, yearly) and repetition count. Implementation follows this order: shared types → backend Cloud Function → frontend UI components → Firestore configuration.

## Tasks

- [x] 1. Update shared types package with split transaction types
  - [x] 1.1 Add SplitFrequency enum and split field to Transaction interface
    - Add `SplitFrequency` enum with values: weekly, monthly, yearly
    - Add split field to Transaction interface: `splitParentId` (optional string)
    - Update RuleAction interface to include `autoSplit` field with splitCount and frequency
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.2_

  - [x] 1.2 Rebuild and reinstall shared types package
    - Run `npm run build` in easy-csp-shared-types
    - Run `npm run install:special` in easy-csp and easy-csp-cloud/functions
    - _Requirements: N/A (infrastructure)_

- [x] 2. Implement backend split transaction Cloud Function
  - [x] 2.1 Create splitTransaction Cloud Function with request validation
    - Create new Cloud Function in `easy-csp-cloud/functions/src/activities/TransactionActivity.ts`
    - Implement request validation for splitCount (2-12), frequency, and startDate
    - Validate user owns the transaction and transaction is not already split (splitParentId === null)
    - _Requirements: 1.4, 9.1, 9.2, 9.3, 12.1, 14.1, 14.2, 14.3, 14.4_

  - [x] 2.2 Implement amount distribution algorithm
    - Create `distributeAmount()` function that divides amount evenly
    - Handle remainders by adding to first split
    - Ensure all amounts rounded to 2 decimal places
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 2.3 Write property test for amount distribution
    - **Property 1: Split Amount Conservation**
    - **Validates: Requirements 2.3, 2.4**

  - [x] 2.4 Implement date calculation algorithm
    - Create `calculateNextDate()` function supporting weekly, monthly, yearly frequencies
    - Use date-fns library for date manipulation
    - Handle edge cases (month boundaries, leap years)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 2.5 Write property test for date calculations
    - **Property 3: Split Date Monotonicity**
    - **Property 4: Split Date Frequency Correctness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.5_

  - [x] 2.6 Implement split transaction creation with Firestore batch writes
    - Update parent transaction with splitParentId set to its own ID (self-reference) and updated amount
    - Create child split transactions with splitParentId set to parent's ID
    - Use Firestore batch writes for atomicity
    - Apply user rules to each split transaction before persisting
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 10.1, 10.2, 10.3, 10.4, 11.1, 11.2, 11.3, 11.4_

  - [ ]* 2.7 Write property tests for split metadata
    - **Property 2: Split Parent Reference Completeness**
    - **Property 5: Split Parent Reference Integrity**
    - **Property 6: Split Parent Self-Reference**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 13.1, 13.2, 13.4**

  - [x] 2.8 Implement error handling and rate limiting
    - Add try-catch blocks with descriptive error messages
    - Implement rate limiting (10 splits per minute per user)
    - Handle Firestore write failures with proper rollback
    - _Requirements: 9.4, 9.5, 12.5_

- [x] 3. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Update backend Plaid transaction handler for split recalculation
  - [x] 4.1 Modify transaction update handler to recalculate split amounts
    - When a parent transaction (splitParentId === transaction.id) amount changes from Plaid sync, recalculate split amounts
    - Query all transactions with splitParentId matching the parent's ID to get all splits
    - Update ONLY the amount field on all splits (parent + children), preserve all other fields
    - Maintain amount conservation property
    - _Requirements: 2.3, 13.1_

  - [ ]* 4.2 Write integration test for split amount recalculation
    - Test parent amount update triggers child recalculation
    - Verify amount conservation after recalculation
    - Verify all other fields (category, savingTargetId, hidden) remain unchanged
    - _Requirements: 2.3_

- [x] 5. Implement frontend React Query hooks for split operations
  - [x] 5.1 Create useSplitTransaction mutation hook
    - Create hook in `easy-csp/src/hooks/useSplitTransaction.ts`
    - Call splitTransaction Cloud Function
    - Handle success/error states with toast notifications
    - Invalidate transaction queries on success
    - _Requirements: 1.4, 1.5, 9.5_

  - [x] 5.2 Create useSplitTransactions query hook
    - Create hook to query split transactions by parent ID (where splitParentId === parentId)
    - Order results by datetime ascending
    - Use React Query caching
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 6. Implement TransactionSplitDialog component
  - [x] 6.1 Create TransactionSplitDialog UI component
    - Create component in `easy-csp/src/pages/transactions/TransactionSplitDialog.tsx`
    - Add form fields for split count (2-12), frequency selector, start date picker
    - Implement client-side validation
    - Display split preview with calculated amounts and dates
    - _Requirements: 1.2, 1.3, 9.1_

  - [x] 6.2 Wire TransactionSplitDialog to useSplitTransaction hook
    - Call useSplitTransaction mutation on form submit
    - Display loading state during split creation
    - Show success message and close dialog on success
    - Display error messages on failure
    - _Requirements: 1.4, 1.5, 9.5_

- [x] 7. Update TransactionRow component with split indicators
  - [x] 7.1 Add split badge to TransactionRow
    - Query all transactions with splitParentId matching the transaction's splitParentId to get split count and position
    - Display "Parent (X splits)" badge for parent transactions (splitParentId === transaction.id)
    - Display "Split X of Y" badge for child splits (determined by datetime ordering)
    - Apply visual styling to distinguish split transactions
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  <!-- - [ ] 7.2 Add navigation to view related splits
    - Add click handler to view all splits for a parent transaction
    - Filter transaction list by splitParentId when viewing splits
    - _Requirements: 8.3_ -->

- [x] 8. Update TransactionEditDialog component with split action
  - [x] 8.1 Add "Split Transaction" button to TransactionEditDialog
    - Add button to dialog actions
    - Disable button if transaction.splitParentId is non-null (already split)
    - Open TransactionSplitDialog when clicked
    - _Requirements: 1.1, 1.2, 1.6_

  - [x] 8.2 Ensure split transactions can be edited independently
    - Allow category, savingTargetId, and hidden field modifications
    - Prevent re-splitting of already-split transactions (splitParentId !== null)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 8.3 Write property test for split independence
    - **Property 7: Split Transaction Independence**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [x] 9. Checkpoint - Ensure frontend components render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement rule-based auto-splitting
  - [x] 10.1 Update RulesService to handle autoSplit action
    - Add logic to detect autoSplit action in rule transformations
    - Validate autoSplit configuration (splitCount, frequency)
    - Skip transactions that are already split
    - Trigger splitTransaction Cloud Function with rule parameters
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 10.2 Write property tests for auto-split rules
    - **Property 8: No Recursive Splits**
    - **Property 12: Auto-Split Rule Validation**
    - **Property 13: Auto-Split Triggering**
    - **Validates: Requirements 1.6, 7.1, 7.2, 7.3, 7.5, 9.3**

  - [x] 10.3 Update rule configuration UI to support autoSplit action
    - Add autoSplit configuration fields to rule creation/edit dialog
    - Add split count input (2-12) and frequency selector
    - Display autoSplit action in rule list
    - _Requirements: 7.1, 7.2_

- [ ] 11. Configure Firestore indexes for split queries
  - [x] 11.1 Add composite indexes to firestore.indexes.json
    - Add index on (uid, splitParentId, datetime) for split queries ordered by date
    - Add index on (uid, splitParentId) for filtering split transactions
    - _Requirements: 8.1, 15.1, 15.2, 15.3_

  - [ ] 11.2 Deploy Firestore indexes
    - Run `firebase deploy --only firestore:indexes`
    - Verify indexes are created in Firebase console
    - _Requirements: 15.3_

- [ ] 12. Update Firestore security rules for split transactions
  - [x] 12.1 Add security rules to prevent direct split creation
    - Prevent client-side creation of transactions with splitParentId !== null (must use Cloud Function)
    - Allow updates only to category, savingTargetId, and hidden fields on splits
    - Ensure users can only read/write their own transactions
    - _Requirements: 12.2, 12.3, 12.4_

  - [ ] 12.2 Deploy Firestore security rules
    - Run `firebase deploy --only firestore:rules`
    - Test rules with Firebase emulator
    - _Requirements: 12.2, 12.3, 12.4_

- [x] 13. Add transaction list filtering for split transactions
  - [x] 13.1 Add filter toggle to show/hide split transactions
    - Add UI toggle to TransactionsPage
    - Filter transactions where splitParentId !== null when toggle is off
    - Update query to include/exclude splits based on toggle state
    - _Requirements: 8.4_

- [x] 14. Final checkpoint - End-to-end testing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Shared types must be updated first and reinstalled before backend/frontend work
- Backend Cloud Function must be deployed before frontend can call it
- Firestore indexes should be deployed before heavy testing to ensure query performance
- Property tests validate universal correctness properties across random inputs
- Integration tests validate end-to-end workflows with real Firestore operations
