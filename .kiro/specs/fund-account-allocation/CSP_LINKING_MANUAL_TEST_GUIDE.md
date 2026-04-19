# CSP Category Linking Manual Test Guide

This guide provides step-by-step instructions for manually testing the CSP category linking auto-enablement feature.

## Prerequisites

- Easy CSP app running locally
- At least one asset account (checking, savings, investment, or other)
- At least one liability account (credit or loan) for negative testing
- Access to the Conscious Spending Plan page

## Test Scenarios

### Test 1: Link Asset Account to Savings Category - Auto-Enable Fund Status

**Objective**: Verify that linking an asset account to a Savings category automatically enables fund status.

**Steps**:
1. Navigate to the Conscious Spending Plan page
2. Locate the "Savings" bucket card
3. Click the "Link Savings Account" button
4. Select an asset account (checking, savings, investment, or other) from the dropdown
5. Click "Link Account"

**Expected Results**:
- Success toast appears: "Account linked to Savings and enabled as fund account"
- The account is added to the Savings bucket in the CSP
- Navigate to Net Worth page → Account Settings for that account
- The "Fund Account" toggle should be ON
- The account should now appear in fund allocation dropdowns

---

### Test 2: Link Asset Account to Investment Category - Auto-Enable Fund Status

**Objective**: Verify that linking an asset account to an Investment category automatically enables fund status.

**Steps**:
1. Navigate to the Conscious Spending Plan page
2. Locate the "Investment" bucket card
3. Click the "Link Investment Account" button
4. Select an asset account from the dropdown
5. Click "Link Account"

**Expected Results**:
- Success toast appears: "Account linked to Investment and enabled as fund account"
- The account is added to the Investment bucket in the CSP
- The "Fund Account" toggle should be ON in Account Settings
- The account should appear in fund allocation dropdowns

---

### Test 3: Link Already-Enabled Fund Account - No Duplicate Enablement

**Objective**: Verify that linking an account that is already a fund account works without error.

**Steps**:
1. First, manually enable fund status on an asset account via Account Settings
2. Navigate to the Conscious Spending Plan page
3. Click "Link Savings Account" or "Link Investment Account"
4. Select the already-enabled fund account
5. Click "Link Account"

**Expected Results**:
- Success toast appears: "Account linked to Savings" (or Investment)
- No error occurs
- The account remains a fund account
- No duplicate fund status changes

---

### Test 4: Attempt to Link Liability Account to Savings - Validation Error

**Objective**: Verify that liability accounts cannot be linked to Savings categories.

**Steps**:
1. Navigate to the Conscious Spending Plan page
2. Locate the "Savings" bucket card
3. Click the "Link Savings Account" button
4. Select a credit card or loan account from the dropdown
5. Click "Link Account"

**Expected Results**:
- Error toast appears: "Only asset accounts can be linked to savings/investment categories"
- The account is NOT added to the Savings bucket
- The account's fund status remains unchanged (should be false)
- The dialog remains open or closes without making changes

---

### Test 5: Attempt to Link Liability Account to Investment - Validation Error

**Objective**: Verify that liability accounts cannot be linked to Investment categories.

**Steps**:
1. Navigate to the Conscious Spending Plan page
2. Locate the "Investment" bucket card
3. Click the "Link Investment Account" button
4. Select a credit card or loan account from the dropdown
5. Click "Link Account"

**Expected Results**:
- Error toast appears: "Only asset accounts can be linked to savings/investment categories"
- The account is NOT added to the Investment bucket
- The account's fund status remains unchanged
- The linking operation is prevented

---

### Test 6: Link Account to Other Buckets - No Auto-Enable

**Objective**: Verify that linking accounts to non-Savings/Investment buckets does NOT auto-enable fund status.

**Note**: This test requires adding account linking functionality to other buckets (Income, FixedCost, GuildFreeSpending, Ignored). If not implemented, this test can be skipped.

**Steps**:
1. Navigate to the Conscious Spending Plan page
2. Attempt to link an account to Income, FixedCost, GuildFreeSpending, or Ignored bucket
3. Complete the linking process

**Expected Results**:
- The account is linked to the bucket successfully
- The account's fund status remains UNCHANGED
- If the account was not a fund account before, it should still not be a fund account
- No automatic fund enablement occurs

---

### Test 7: Unlink Account from CSP Category - Fund Status Preserved

**Objective**: Verify that unlinking an account from a CSP category does NOT disable fund status.

**Steps**:
1. First, link an asset account to Savings or Investment (which auto-enables fund status)
2. Verify the account is now a fund account
3. Navigate to the CSP page
4. Remove/unlink the account from the Savings or Investment bucket
   (This may require using the action menu on the budget row)
5. Check the account's fund status in Account Settings

**Expected Results**:
- The account is removed from the CSP bucket
- The account's fund status remains ENABLED
- The account still appears in fund allocation dropdowns
- Manual disabling is required if the user wants to turn off fund status

---

## Automated Test Coverage

The following automated tests are included in `accountService.cspLinking.test.ts`:

### Savings Bucket Tests
- ✅ Auto-enable fund status when linking asset account to Savings
- ✅ Return success without changes when account is already a fund account
- ✅ Throw error when linking liability account to Savings

### Investment Bucket Tests
- ✅ Auto-enable fund status when linking asset account to Investment
- ✅ Throw error when linking loan account to Investment

### Other Buckets Tests
- ✅ No auto-enable for Income bucket
- ✅ No auto-enable for FixedCost bucket
- ✅ No auto-enable for GuildFreeSpending bucket
- ✅ No auto-enable for Ignored bucket

### Edge Cases Tests
- ✅ Throw error when account does not exist
- ✅ Throw error when account belongs to different user
- ✅ Handle all asset account types (checking, savings, investment, other)

## Running Automated Tests

```bash
# Run all tests
npm test

# Run only CSP linking tests
npm test -- accountService.cspLinking

# Run tests with coverage
npm run test:coverage
```

## Test Data Setup

### Required Test Accounts

Create the following test accounts for comprehensive testing:

1. **Asset Accounts** (for positive tests):
   - Checking account (e.g., "Chase Checking")
   - Savings account (e.g., "Emergency Fund")
   - Investment account (e.g., "Vanguard 401k")
   - Other account (e.g., "Cash")

2. **Liability Accounts** (for negative tests):
   - Credit card (e.g., "Visa Credit Card")
   - Loan account (e.g., "Student Loan")

## Troubleshooting

### Issue: Toast messages not appearing
- Check browser console for errors
- Verify react-hot-toast is properly configured
- Check that Toaster component is rendered in the app

### Issue: Fund status not updating
- Check browser console for Firestore errors
- Verify user has proper permissions
- Check that accountService.handleCSPCategoryLinking is being called

### Issue: Validation not working
- Verify AccountType enum values match the account's accountType field
- Check that the validation logic in LinkAccountDialog is correct
- Ensure the account data is loaded before validation

## Success Criteria

All tests pass when:
- ✅ Asset accounts linked to Savings/Investment auto-enable fund status
- ✅ Liability accounts cannot be linked to Savings/Investment
- ✅ Already-enabled fund accounts can be linked without error
- ✅ Other buckets do not trigger auto-enablement
- ✅ Unlinking preserves fund status
- ✅ All automated tests pass
- ✅ No console errors during testing
- ✅ User receives appropriate feedback messages
