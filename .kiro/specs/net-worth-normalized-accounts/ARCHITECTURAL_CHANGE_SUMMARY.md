# Architectural Change Summary: Remove Fund Concept

## Overview

This document summarizes the architectural change to remove the Fund concept and add `targetAmount` directly to the Account interface.

## Key Changes

### Before (Current Design)
- Accounts can be linked to Funds via `linkedFundId`
- Funds have `targetAmount` for goal tracking
- CSP savings/investments reference `fundId`
- Bidirectional linkage: `account.linkedFundId` ↔ `fund.accountId`
- Separate Fund collection in Firestore

### After (New Design)
- Accounts have optional `targetAmount` field for goal tracking
- No Fund collection needed
- CSP savings/investments reference `accountId` directly
- Simpler data model with Account as the primary entity

## Impact Areas

### 1. Account Interface
**Add:**
- `targetAmount?: number` - Optional goal amount for savings/investment tracking

**Remove:**
- `linkedFundId?: string` - No longer needed

### 2. Transaction Interface
**Remove:**
- `fundId?: string` - Transactions no longer link to funds

### 3. Fund Collection
**Action:** Remove entirely from the system
- No Fund interface needed
- No Fund service needed
- No Fund hooks needed
- No Fund Firestore collection

### 4. CSP Savings/Investments
**Update:**
- Change from referencing `fundId` to referencing `accountId`
- Direct association with accounts instead of funds

### 5. Migration Strategy
**Simplify:**
- No need to migrate manual funds to accounts
- No need to update fund references
- Just remove Fund collection after updating CSP references

### 6. UI Components
**Remove:**
- Fund linkage modals
- Fund management UI
- Fund-related actions on account cards

**Update:**
- Add target amount field to account creation/edit forms
- Show progress toward target on account cards (if targetAmount is set)

## Benefits

1. **Simpler Architecture**: One less entity to manage
2. **Clearer Data Model**: Account is the single source of truth
3. **Easier Migration**: Fewer steps, less complexity
4. **Better UX**: Goal tracking directly on accounts is more intuitive
5. **Reduced Code**: Less service code, fewer hooks, simpler UI

## Migration Steps (Simplified)

1. Update Account interface to add `targetAmount`
2. Update CSP savings/investments to reference `accountId` instead of `fundId`
3. Remove Fund collection
4. Update UI to show target amount on accounts
5. Remove all Fund-related code

## Files to Update

### Shared Types
- `firestore.types.ts` - Update Account interface, remove Fund interface

### Backend
- Remove Fund-related Cloud Functions (if any)
- Update CSP-related functions to use accountId

### Frontend
- `accountService.ts` - Add targetAmount support
- Remove `fundService.ts`
- Remove fund-related hooks
- Update account UI components
- Remove fund management pages/modals

### Documentation
- `design.md` - Remove Fund sections, update Account sections
- `requirements.md` - Remove Fund requirements
- `tasks.md` - Remove Fund tasks, update Account tasks
