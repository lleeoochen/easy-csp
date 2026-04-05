# Implementation Plan: CSP Category Management

## Overview

Implement custom category add/remove for CSP buckets, dynamic category map from the CSP document, and stale-category warnings in the rules UI. Changes span shared types, service layer, hooks, and UI components.

## Tasks

- [x] 1. Extend `CSPCategoryBudget` type and rebuild shared types
  - Add `name?: string` field to `CSPCategoryBudget` in `easy-csp-shared-types/src/firestore.types.ts`
  - Run `npm run build` in `easy-csp-shared-types`, then `npm run install:special` in both `easy-csp` and `easy-csp-cloud/functions`
  - _Requirements: 9.1, 9.2_

- [x] 2. Add `sentenceToCamelCase` utility and extend service layer
  - [x] 2.1 Add `sentenceToCamelCase` to `easy-csp/src/utils/stringUtils.ts`
    - Implement: trim → split on whitespace → lowercase first word, title-case rest → join
    - _Requirements: 1.1, 7.2_

  - [ ] 2.2 Write property test for `sentenceToCamelCase` (Property 10)
    - **Property 10: Trim invariant for `sentenceToCamelCase`**
    - Generate random strings with random leading/trailing whitespace; assert `sentenceToCamelCase(s) === sentenceToCamelCase(s.trim())`
    - **Validates: Requirements 7.2**

  - [x] 2.3 Extend `ConsciousSpendingPlanService.addCSPItem` to accept and persist `name?: string`
    - Add `name?: string` parameter to signature in `easy-csp/src/services/consciousSpendingPlanService.ts`
    - Spread `name` into the pushed item only when provided: `...(name ? { name } : {})`
    - _Requirements: 1.1, 9.3_

  - [x] 2.4 Extend `useAddCSPItem` mutation payload to include `name?: string`
    - Update the inline payload type in `easy-csp/src/hooks/api/useCSP.ts` and pass `name` through to the service call
    - _Requirements: 1.1_

- [x] 3. Checkpoint — ensure shared types build cleanly and service/hook types are consistent
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Rewrite `useCategoryMap` to read from the CSP document
  - [x] 4.1 Rewrite `useCategoryMap` in `easy-csp/src/hooks/useCategoryMap.ts`
    - Import `useCSP`; iterate all bucket arrays in the CSP document; resolve `item.name ?? camelCaseToSentence(item.category)` for each entry
    - Include saving target entries as before
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 3.1, 3.2_

  - [ ]* 4.2 Write property test for `useCategoryMap` key set (Property 7)
    - **Property 7: Category map keys equal the union of CSP categories and saving target IDs**
    - Generate random CSP documents and saving target lists; render hook; assert key set equals exact union
    - **Validates: Requirements 3.1, 8.1**

  - [ ]* 4.3 Write property test for name resolution order (Property 8)
    - **Property 8: Name resolution follows priority order**
    - Generate random `CSPCategoryBudget` entries with and without `name`; assert map value equals `entry.name` when present, else `camelCaseToSentence(entry.category)`
    - **Validates: Requirements 3.5, 7.1, 8.2**

  - [x] 4.4 Update `isSavingTargetCategory` in `easy-csp/src/hooks/useCategoryMap.ts`
    - Change implementation to accept the CSP document's category ID set and check membership there instead of against the static `CSPCategory` enum
    - _Requirements: 8.1_

- [x] 5. Add `name` fields to `defaultCSPData.ts`
  - Update every entry in `easy-csp-cloud/functions/src/utils/defaultCSPData.ts` to include a human-readable `name` field (e.g. `{ category: CSPCategory.RentMortgage, amount: 1500, name: 'Rent / Mortgage' }`)
  - _Requirements: 9.3_

- [x] 6. Build `AddCategoryRow` component
  - [x] 6.1 Create `easy-csp/src/pages/consciousSpendingPlan/AddCategoryRow.tsx`
    - Props: `{ bucket: CSPBucket }`
    - Render a text input and an "Add" button
    - On submit: trim input, reject empty/whitespace-only with inline error (Requirement 7.1), derive camelCase ID via `sentenceToCamelCase`, check for duplicate ID in current CSP query cache (Requirement 1.2 / 7.3), call `useAddCSPItem` with `{ bucket, category: derivedId, amount: 0, name: trimmedInput }`
    - Clear input on success; show mutation error inline on failure
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 7.1, 7.2, 7.3_

  - [ ]* 6.2 Write property test for whitespace rejection (Property 9)
    - **Property 9: Whitespace-only names are rejected**
    - Generate random whitespace-only strings; render `AddCategoryRow`; submit; assert no mutation fired and error message visible
    - **Validates: Requirements 7.1**

  - [ ]* 6.3 Write property test for add round-trip (Property 1)
    - **Property 1: Add entry round-trip**
    - Generate random valid sentence strings and random non-savings buckets; call `addCSPItem` with derived ID and trimmed name; assert stored entry has matching `category` and `name`
    - **Validates: Requirements 1.1, 9.3**

  - [ ]* 6.4 Write property test for duplicate ID rejection (Property 2)
    - **Property 2: Duplicate ID rejection**
    - Generate random CSP state with at least one entry; attempt to add with same derived ID; assert `success: false` and bucket unchanged
    - **Validates: Requirements 1.2, 7.3**

  - [ ]* 6.5 Write property test for savings bucket protection (Property 5)
    - **Property 5: Savings bucket is protected from add**
    - Generate random category names and amounts; call `addCSPItem` with `CSPBucket.Savings`; assert rejection and unchanged bucket
    - **Validates: Requirements 1.5**

- [x] 7. Integrate `AddCategoryRow` into `CSPBucketCard`
  - In `easy-csp/src/pages/consciousSpendingPlan/CSPBucketCard.tsx`, render `<AddCategoryRow bucket={cspBucket} />` at the bottom of `CardContent` when `cspBucket !== CSPBucket.Savings`
  - _Requirements: 1.5, 1.6_

- [x] 8. Add "Remove Category" action to `CSPBudgetActionMenu`
  - [x] 8.1 Add delete action to `easy-csp/src/pages/consciousSpendingPlan/CSPBudgetActionMenu.tsx`
    - Add a "Remove Category" `DropdownMenuItem` that is hidden when `budget.isTrackingFund === true`
    - On click: show a confirmation dialog; on confirm call `useDeleteCSPItem({ bucket, category: budget.category })`
    - Show inline/toast error on mutation failure
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 8.2 Write property test for saving-target delete protection (Property 6)
    - **Property 6: Saving-target-backed categories cannot be deleted via CSP**
    - Generate random `CSPCategoryBudget` entries with `isTrackingFund: true`; render menu; assert delete item is absent
    - **Validates: Requirements 2.5**

  - [ ]* 8.3 Write property test for write failure on delete (Property 4)
    - **Property 4: Write failure on delete leaves CSP unchanged**
    - Mock `updateDoc` to throw; call `deleteCSPItem`; assert `success: false` and Firestore state unchanged
    - **Validates: Requirements 2.3**

  - [ ]* 8.4 Write property test for write failure on add (Property 3)
    - **Property 3: Write failure on add leaves CSP unchanged**
    - Mock `updateDoc` to throw; call `addCSPItem`; assert `success: false` and Firestore state unchanged
    - **Validates: Requirements 1.4**

- [x] 9. Add stale category warning to `RulesList`
  - [x] 9.1 Update `easy-csp/src/pages/rules/RulesList.tsx`
    - Call `useCategoryMap()` inside the component
    - For each rule with a `changeCategory` action, compute `hasStaleCategory = categoryMap[rule.action.changeCategory] === undefined`
    - When `hasStaleCategory` is true, render an `AlertTriangle` icon (from `lucide-react`) next to the rule name with a label "Category no longer exists in your CSP"
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 9.2 Write property test for stale category warning (Property 11)
    - **Property 11: Stale category warning appears iff category is absent from map**
    - Generate random rules with `changeCategory` values both present and absent in a generated category map; render `RulesList`; assert warning visible iff category absent
    - **Validates: Requirements 6.1, 6.3**

- [x] 10. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Task 1 (shared types rebuild) must complete before any task that imports the updated `CSPCategoryBudget` type
- Property tests use **fast-check** with Vitest; minimum 100 iterations per property
- Tag each property test: `// Feature: csp-category-management, Property N: <property text>`
