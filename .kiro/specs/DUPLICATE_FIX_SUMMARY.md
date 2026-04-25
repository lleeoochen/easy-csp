# Duplicate Transaction Fix Summary

## Problem
Plaid was returning the same transaction with different `transaction_id` values, causing duplicates in Firestore.

## Root Cause
When a pending transaction converts to posted, Plaid:
1. Removes the pending transaction (via `removed` array)
2. Adds a new posted transaction with a different `transaction_id`
3. Includes a `pending_transaction_id` field linking back to the original

## Solution

### 1. Handle pending_transaction_id
When processing transactions:
- Check if the transaction has a `pending_transaction_id`
- If yes, find the pending transaction (in db or the newly imported list) and delete the old pending transaction and create the new posted one
- This prevents duplicates when pending→posted conversion happens

### 2. Track plaidPending boolean status in transaction

## Code Changes

### File: `TransactionActivity.ts`
