# Plaid Test Transaction Data Format

## Overview

This document provides the correct format for testing Plaid transactions using the `testImportPlaidTransaction` Cloud Function.

---

## Basic Format

```javascript
{
  transaction: {
    // Required fields
    transaction_id: string,
    account_id: string,
    name: string,
    amount: number,
    date: string, // YYYY-MM-DD format

    // Optional but recommended
    pending: boolean,
    pending_transaction_id: string | null,
    personal_finance_category: {
      primary: string,
      detailed: string,
      confidence_level: "HIGH" | "MEDIUM" | "LOW"
    }
  },
  institutionId: string
}
```

---

## Example 1: Pending Transaction

```javascript
{
  transaction: {
    transaction_id: "pending_coffee_123",
    account_id: "KqGJbvo1g1hwdzg5kaRRfRoEAb5pJ8fRvMq3B",
    name: "Starbucks",
    amount: 5.50,
    date: "2026-04-21",
    pending: true,
    personal_finance_category: {
      primary: "FOOD_AND_DRINK",
      detailed: "FOOD_AND_DRINK_COFFEE",
      confidence_level: "HIGH"
    }
  },
  institutionId: "P39JKvl8G8fQAaW5EoxxfzDzVE7MwwCw8Mqro"
}
```

---

## Example 2: Posted Transaction (Converted from Pending)

```javascript
{
  transaction: {
    transaction_id: "posted_coffee_456",  // Different ID
    account_id: "KqGJbvo1g1hwdzg5kaRRfRoEAb5pJ8fRvMq3B",  // Same account
    name: "Starbucks",
    amount: 5.50,
    date: "2026-04-21",
    pending: false,
    pending_transaction_id: "pending_coffee_123",  // Links to the pending transaction
    personal_finance_category: {
      primary: "FOOD_AND_DRINK",
      detailed: "FOOD_AND_DRINK_COFFEE",
      confidence_level: "HIGH"
    }
  },
  institutionId: "P39JKvl8G8fQAaW5EoxxfzDzVE7MwwCw8Mqro"
}
```

When you import the posted transaction with `pending_transaction_id`, the system will:
1. Import the new posted transaction
2. Automatically delete the old pending transaction
3. Log: `Pending→Posted conversion detected: pending_coffee_123 → posted_coffee_456`

---

## Example 3: Regular Transaction (No Pending)

```javascript
{
  transaction: {
    transaction_id: "regular_grocery_789",
    account_id: "KqGJbvo1g1hwdzg5kaRRfRoEAb5pJ8fRvMq3B",
    name: "Whole Foods",
    amount: 87.32,
    date: "2026-04-20",
    pending: false,
    personal_finance_category: {
      primary: "FOOD_AND_DRINK",
      detailed: "FOOD_AND_DRINK_GROCERIES",
      confidence_level: "HIGH"
    }
  },
  institutionId: "P39JKvl8G8fQAaW5EoxxfzDzVE7MwwCw8Mqro"
}
```

---

## Common Plaid Categories

### Food & Drink
```javascript
{
  primary: "FOOD_AND_DRINK",
  detailed: "FOOD_AND_DRINK_COFFEE",
  confidence_level: "HIGH"
}
```

### Rent & Utilities
```javascript
{
  primary: "RENT_AND_UTILITIES",
  detailed: "RENT_AND_UTILITIES_SEWAGE_AND_WASTE_MANAGEMENT",
  confidence_level: "HIGH"
}
```

### Transportation
```javascript
{
  primary: "TRANSPORTATION",
  detailed: "TRANSPORTATION_GAS",
  confidence_level: "HIGH"
}
```

### Shopping
```javascript
{
  primary: "GENERAL_MERCHANDISE",
  detailed: "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES",
  confidence_level: "MEDIUM"
}
```

---

## Testing Workflow

### Step 1: Get Your Account ID and Institution ID

Query Firestore to find your actual IDs:
- Account ID: Check the `financialAccounts` collection
- Institution ID: Check the `financialInstitutions` collection

### Step 2: Import Pending Transaction

```javascript
const functions = getFunctions();
const testImport = httpsCallable(functions, 'testImportPlaidTransaction');

const pendingResult = await testImport({
  transaction: {
    transaction_id: "pending_test_" + Date.now(),
    account_id: "YOUR_ACCOUNT_ID",
    name: "Test Merchant",
    amount: 25.00,
    date: new Date().toISOString().split('T')[0],
    pending: true
  },
  institutionId: "YOUR_INSTITUTION_ID"
});

console.log("Pending transaction ID:", pendingResult.data.transactionIds[0]);
```

### Step 3: Import Posted Version

```javascript
const postedResult = await testImport({
  transaction: {
    transaction_id: "posted_test_" + Date.now(),
    account_id: "YOUR_ACCOUNT_ID",
    name: "Test Merchant",
    amount: 25.00,
    date: new Date().toISOString().split('T')[0],
    pending: false,
    pending_transaction_id: pendingResult.data.transactionIds[0]  // Link to pending
  },
  institutionId: "YOUR_INSTITUTION_ID"
});
```

### Step 4: Verify Results

1. Check the transactions page - you should see only ONE transaction (the posted one)
2. The posted transaction should NOT have a "Pending" badge
3. Check Cloud Functions logs for: `Pending→Posted conversion detected`
4. The old pending transaction should be deleted from Firestore

---

## Expected Behavior

### Pending Transaction Display
- Transaction name appears in grey
- "Pending" badge shows next to the name
- Amount appears in grey

### Posted Transaction Display
- Transaction name appears in normal color
- No "Pending" badge
- Amount appears in normal color (green for income, black for expenses)

### Duplicate Prevention
- When posted transaction arrives with `pending_transaction_id`
- Old pending transaction is automatically deleted
- Only the posted transaction remains in Firestore
- No duplicates appear in the UI

---

## Troubleshooting

### Error: "Account not found"
- Make sure you're using the correct `account_id` from your Firestore `financialAccounts` collection
- The account must belong to the specified `institutionId`

### Error: "Institution not found"
- Verify the `institutionId` exists in your `financialInstitutions` collection
- Make sure you're authenticated as the user who owns the institution

### Pending transaction not showing as pending
- Verify `pending: true` is set in the transaction object
- Check that shared types are updated (`npm run install:special`)
- Refresh the transactions page

### Posted transaction not removing pending
- Verify `pending_transaction_id` matches the pending transaction's ID exactly
- Check Cloud Functions logs for the conversion detection message
- Make sure both transactions have the same `account_id` and `institutionId`
