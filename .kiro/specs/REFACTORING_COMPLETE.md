# Saving Targets → Funds Refactoring - COMPLETED

## Summary

Successfully refactored "Saving Targets" to "Funds" to support both saving and investment fund types.

## Changes Completed

### 1. Shared Types (`easy-csp-shared-types`)

✅ **Updated Models:**
- `SavingTarget` → `Fund` with new `type: FundType` field
- `Transaction.savingTargetId` → `Transaction.fundId`
- `RuleAction.assignSavingTargetId` → `RuleAction.assignFundId`
- `CSPCategoryBudget.isTrackingFund` → `CSPCategoryBudget.isTrackingFund`

✅ **Updated Constants:**
- `SAVING_TARGETS_COLLECTION` → `FUNDS_COLLECTION` = 'funds'

✅ **New Types:**
- Added `FundType` enum with `Saving` and `Investment` values

✅ **Helper Functions:**
- Updated `isManualFund()` to accept `Fund` type
- Added `getAccountOptionValueForFund()` utility

### 2. Frontend Services

✅ **Created New Service:**
- `src/services/fundsService.ts` (replaces `savingTargetsService.ts`)
  - `addFund()` - supports fund type parameter
  - `updateFund()` - handles CSP bucket migration when type changes
  - `removeFund()` - cleans up based on fund type
  - `listFunds()` - returns all funds with balance info

✅ **Updated Services:**
- `src/services/transactionsService.ts`
  - All `savingTargetId` → `fundId`
  - All `SAVING_TARGETS_COLLECTION` → `FUNDS_COLLECTION`
  - Updated helper function names

✅ **Deleted Old Service:**
- Removed `src/services/savingTargetsService.ts`

### 3. Frontend Hooks

✅ **Created New Hook:**
- `src/hooks/api/useFunds.ts` (replaces `useFunds.ts`)
  - `useFunds()` - query all funds
  - `useAddFund()` - create fund with type
  - `useUpdateFund()` - update fund including type
  - `useDeleteFund()` - delete fund

✅ **Query Keys:**
- `['savingTargets']` → `['funds']`

✅ **Deleted Old Hook:**
- Removed `src/hooks/api/useFunds.ts`

### 4. Frontend Pages

✅ **Created New Pages:**
- `src/pages/funds/FundsPage.tsx` (replaces `SavingTargetsPage.tsx`)
- `src/pages/funds/FundsContent.tsx` (replaces `SavingTargetsContent.tsx`)
  - Added filter tabs: All | Savings | Investments
  - Shows fund type badge on each fund card
- `src/pages/funds/FundDialog.tsx` (replaces `SavingTargetDialog.tsx`)
  - Added fund type selector (Saving/Investment)

✅ **Deleted Old Pages:**
- Removed `src/pages/savingTargets/` directory and all files

### 5. Frontend Components

✅ **Created New Components:**
- `src/components/common/FundSelector.tsx`
  - Optional `filterByType` prop to filter by fund type
- `src/components/common/FundFilter.tsx`
  - Optional `filterByType` prop to filter by fund type

✅ **Deleted Old Components:**
- Removed `src/components/common/SavingTargetSelector.tsx`
- Removed `src/components/common/SavingTargetFilter.tsx`

### 6. Updated Components

✅ **TransactionEditDialog:**
- Updated to use `FundSelector` instead of `SavingTargetSelector`
- Changed `prefilledSavingTargetId` → `prefilledFundId`
- All internal references updated to `fundId`

### 7. Routing

✅ **Updated Routes:**
- `/savingTargets` → `/funds`
- Navigation label: "Savings" → "Funds"
- Updated `src/App.tsx` imports and route definitions

### 8. Types

✅ **Updated UI Types:**
- `UI_SavingTargetAndBalance` → `UI_FundAndBalance`
- Updated `ListTransactionsRequest.savingTargetId` → `fundId`

✅ **Updated Utils:**
- Added `getAccountOptionValueForFund()` in `accountUtils.ts`
- Kept `getAccountOptionValueForSavingTarget()` as deprecated wrapper

### 9. Backend

✅ **Firestore Rules:**
- Updated collection name: `savingTargets` → `funds`
- Updated field name in transaction rules: `savingTargetId` → `fundId`

## New Features

### Fund Type Support
- Funds now have a `type` field: `'saving'` or `'investment'`
- UI displays fund type badge on each fund card
- Filter tabs allow viewing all funds, only savings, or only investments

### CSP Integration
- Saving funds aggregate under "Savings" bucket
- Investment funds aggregate under "Investments" bucket (ready for implementation)
- Fund type changes automatically move CSP budget items between buckets

## Next Steps

### Required Before Use:
1. **Rebuild shared types:**
   ```bash
   cd easy-csp-shared-types
   npm run build
   ```

2. **Reinstall in both packages:**
   ```bash
   cd easy-csp
   npm run install:special

   cd easy-csp-cloud/functions
   npm run install:special
   ```

3. **Data Migration (Manual):**
   - Rename Firestore collection: `savingTargets` → `funds`
   - Add `type: 'saving'` to all existing fund documents
   - Update all transaction documents: `savingTargetId` → `fundId`
   - Update all rule documents: `assignSavingTargetId` → `assignFundId`
   - Update all CSP budget documents: `isTrackingFund` → `isTrackingFund`

### CSP Page Updates (TODO):
- Update `CSPBucketCardList.tsx` to add Investment bucket
- Update aggregation logic to filter funds by type
- Ensure both Savings and Investments buckets display correctly

## Files Changed

### Shared Types
- `src/firestore.types.ts` - Updated models and constants

### Frontend - New Files
- `src/services/fundsService.ts`
- `src/hooks/api/useFunds.ts`
- `src/pages/funds/FundsPage.tsx`
- `src/pages/funds/FundsContent.tsx`
- `src/pages/funds/FundDialog.tsx`
- `src/components/common/FundSelector.tsx`
- `src/components/common/FundFilter.tsx`

### Frontend - Updated Files
- `src/App.tsx` - Updated routes and imports
- `src/services/transactionsService.ts` - Updated field names
- `src/pages/transactions/TransactionEditDialog.tsx` - Updated to use FundSelector
- `src/types/uiTypes.ts` - Updated type definitions
- `src/types/firestoreTypes.ts` - Updated request types
- `src/utils/accountUtils.ts` - Added new utility function

### Frontend - Deleted Files
- `src/services/savingTargetsService.ts`
- `src/hooks/api/useFunds.ts`
- `src/pages/savingTargets/` (entire directory)
- `src/components/common/SavingTargetSelector.tsx`
- `src/components/common/SavingTargetFilter.tsx`

### Backend
- `firestore.rules` - Updated collection and field names

## Testing Checklist

- [ ] Create new saving fund
- [ ] Create new investment fund
- [ ] Edit fund (both types)
- [ ] Change fund type (saving ↔ investment)
- [ ] Delete fund (both types)
- [ ] Assign transaction to fund
- [ ] Filter transactions by fund
- [ ] Create rule that assigns to fund
- [ ] View funds page with filter tabs
- [ ] Manual fund transaction creation
- [ ] Fund selector in transaction dialog
- [ ] Navigation to /funds route works

## Notes

- No backwards compatibility - breaking changes are acceptable per requirements
- All existing "saving targets" will need `type: 'saving'` added during migration
- Investment funds are fully supported but CSP aggregation needs final implementation
- Fund type can be changed after creation, automatically moving CSP budget items
