# Migration Summary: Simplified Architecture

## What Changed

### Removed
- **Fund Collection**: Entire collection removed from Firestore
- **Fund Interface**: Removed from shared types
- **Fund Service**: No longer needed
- **Fund Hooks**: All fund-related React Query hooks removed
- **Fund Linkage UI**: Modals and components for linking accounts to funds
- **Bidirectional Linkage**: Complex account ↔ fund relationship

### Added
- **Account.targetAmount**: Optional field for goal tracking directly on accounts
- **Progress Calculation**: UI calculates (balance / targetAmount) * 100 for progress bars

### Updated
- **Transaction Interface**: Removed `fundId` field
- **CSP Savings/Investments**: Now reference `accountId` instead of `fundId`
- **Account Card UI**: Shows target amount and progress instead of fund linkage
- **Migration Logic**: Simplified - no need to convert manual funds to accounts

## Benefits

1. **Simpler Data Model**: One less entity to manage
2. **Clearer Ownership**: Account is the single source of truth
3. **Easier Migration**: Fewer steps, less complexity
4. **Better UX**: Goal tracking directly on accounts is more intuitive
5. **Less Code**: Removed ~500+ lines of fund-related code
6. **Faster Development**: 1-2 weeks saved by removing fund complexity

## Migration Steps (Simplified)

### Before
1. Migrate nested accounts to top-level
2. Update transaction references
3. Update fund references
4. Convert manual funds to manual accounts
5. Link accounts to funds
6. Remove accounts array from institutions

### After
1. Migrate nested accounts to top-level
2. Update transaction references
3. Update CSP savings/investments to reference accounts
4. Remove Fund collection
5. Remove accounts array from institutions

**Result**: 2 fewer major migration steps

## Code Removal Checklist

### Shared Types (`easy-csp-shared-types`)
- [ ] Remove `Fund` interface
- [ ] Remove `FundType` enum
- [ ] Remove `FUNDS_COLLECTION` constant
- [ ] Update exports in index.ts

### Backend (`easy-csp-cloud/functions`)
- [ ] Remove any Fund-related Cloud Functions
- [ ] Update CSP functions to use accountId

### Frontend (`easy-csp`)
- [ ] Remove `src/services/fundService.ts`
- [ ] Remove fund-related hooks from `src/hooks/api/`
- [ ] Remove fund management pages/components
- [ ] Remove fund linkage modals
- [ ] Update CSP pages to use accounts

### Firestore
- [ ] Remove funds collection security rules
- [ ] Remove fund-related indexes
- [ ] Delete Fund documents after migration

## Testing Focus

Since we're removing a major feature, focus testing on:

1. **CSP Functionality**: Ensure savings/investments still work with accounts
2. **Target Amount**: Validate goal tracking works correctly
3. **Migration**: Verify no data loss when removing funds
4. **UI**: Confirm all fund-related UI is removed
5. **References**: Ensure no orphaned fund references remain

## Rollback Plan

If issues arise:
1. Keep Fund collection documents until migration is fully validated
2. Maintain CSP → Fund references temporarily during transition
3. Can restore fund linkage if needed (though not recommended)
4. Monitor for any broken references to funds

## Timeline Impact

**Original Estimate**: 5-6 weeks
**New Estimate**: 4-5 weeks
**Time Saved**: 1-2 weeks

Savings come from:
- No fund service implementation
- No fund UI components
- Simpler migration logic
- Fewer tests to write
- Less documentation needed
