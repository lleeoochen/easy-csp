# Saving Targets → Funds Refactoring Plan

## Overview

Refactor "Saving Targets" to "Funds" to support both saving funds and investment funds. Both types will behave identically but aggregate separately in the CSP view.

---

## 1. Shared Types (`easy-csp-shared-types`)

### File: `src/firestore.types.ts`

#### Model: `SavingTarget` → `Fund`

```typescript
// BEFORE
export interface SavingTarget {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  // ... other fields
}

// AFTER
export interface Fund {
  id: string;
  userId: string;
  name: string;
  type: 'saving' | 'investment';  // NEW FIELD
  targetAmount: number;
  currentAmount: number;
  // ... other fields
}
```

#### Model: `Transaction`

```typescript
// BEFORE
savingTargetId?: string;

// AFTER
fundId?: string;
```

#### Model: `RuleAction`

```typescript
// BEFORE
assignSavingTargetId?: string;

// AFTER
assignFundId?: string;
```

#### Model: `CSPCategoryBudget`

```typescript
// BEFORE
isTrackingFund?: boolean;

// AFTER
isTrackingFund?: boolean;
```

### After Changes
- Run `npm run build` in `easy-csp-shared-types`
- Run `npm run install:special` in both `easy-csp` and `easy-csp-cloud/functions`

---

## 2. Backend (`easy-csp-cloud/functions`)

### Firestore Collection Name
- Collection: `savingTargets` → `funds`

### Security Rules (`firestore.rules`)
- Update all references from `savingTargets` to `funds`

### Cloud Functions (if any)
- Update any function names or references
- Update Firestore queries to use `funds` collection

---

## 3. Frontend (`easy-csp`)

### 3.1 File Renames

| Old Path | New Path |
|----------|----------|
| `src/services/savingTargetsService.ts` | `src/services/fundsService.ts` |
| `src/hooks/api/useFunds.ts` | `src/hooks/api/useFunds.ts` |
| `src/pages/savingTargets/SavingTargetsPage.tsx` | `src/pages/funds/FundsPage.tsx` |
| `src/pages/savingTargets/SavingTargetDialog.tsx` | `src/pages/funds/FundDialog.tsx` |
| `src/components/common/SavingTargetSelector.tsx` | `src/components/common/FundSelector.tsx` |
| `src/components/common/SavingTargetFilter.tsx` | `src/components/common/FundFilter.tsx` |

### 3.2 Service Layer (`src/services/fundsService.ts`)

**Function Renames:**
- `getSavingTargets()` → `getFunds()`
- `getSavingTarget()` → `getFund()`
- `createSavingTarget()` → `createFund()`
- `updateSavingTarget()` → `updateFund()`
- `deleteSavingTarget()` → `deleteFund()`
- `getSavingTargetTransactions()` → `getFundTransactions()`

**Collection Reference:**
```typescript
// BEFORE
const savingTargetsRef = collection(db, 'savingTargets');

// AFTER
const fundsRef = collection(db, 'funds');
```

### 3.3 Hooks (`src/hooks/api/useFunds.ts`)

**Hook Renames:**
- `useFunds()` → `useFunds()`
- `useSavingTarget()` → `useFund()`
- `useCreateSavingTarget()` → `useCreateFund()`
- `useUpdateSavingTarget()` → `useUpdateFund()`
- `useDeleteSavingTarget()` → `useDeleteFund()`

**Query Keys:**
```typescript
// BEFORE
['savingTargets', userId]
['savingTarget', id]

// AFTER
['funds', userId]
['fund', id]
```

### 3.4 Transactions Service (`src/services/transactionsService.ts`)

**Field Updates:**
```typescript
// Update all references
savingTargetId → fundId
```

**Filter Functions:**
- Update any filtering logic that references `savingTargetId`

### 3.5 Rules Service (`src/services/rulesService.ts`)

**Field Updates:**
```typescript
// In RuleAction
assignSavingTargetId → assignFundId
```

### 3.6 Components

#### `src/pages/funds/FundsPage.tsx`
- Rename component: `SavingTargetsPage` → `FundsPage`
- Update page title: "Saving Targets" → "Funds"
- Add filter/tabs for fund type: "All" | "Savings" | "Investments"
- Update all variable names: `savingTarget` → `fund`
- Update all hook calls to use new hook names

#### `src/pages/funds/FundDialog.tsx`
- Rename component: `SavingTargetDialog` → `FundDialog`
- Add fund type selector (radio buttons or dropdown)
- Update form field names
- Update dialog title: "Add/Edit Saving Target" → "Add/Edit Fund"

#### `src/components/common/FundSelector.tsx`
- Rename component: `SavingTargetSelector` → `FundSelector`
- Add optional `type` prop to filter by fund type
- Update prop names: `savingTargetId` → `fundId`
- Update labels

#### `src/components/common/FundFilter.tsx`
- Rename component: `SavingTargetFilter` → `FundFilter`
- Update filter logic
- Update prop names

#### `src/pages/transactions/TransactionEditDialog.tsx`
- Update field name: `savingTargetId` → `fundId`
- Update component usage: `<SavingTargetSelector>` → `<FundSelector>`
- Update labels: "Saving Target" → "Fund"

#### `src/pages/transactions/TransactionsPage.tsx`
- Update filter references
- Update column headers if applicable
- Update component usage: `<SavingTargetFilter>` → `<FundFilter>`

#### `src/pages/rules/RuleEditDialog.tsx`
- Update field name: `assignSavingTargetId` → `assignFundId`
- Update component usage: `<SavingTargetSelector>` → `<FundSelector>`
- Update labels in rule action section

### 3.7 CSP Page (`src/pages/consciousSpendingPlan/`)

#### `CSPBucketCardList.tsx`
- Add new bucket for "Investments" alongside "Savings"
- Filter funds by type when aggregating
- Pass `type='saving'` to savings bucket
- Pass `type='investment'` to investments bucket

#### `CSPBucketCard.tsx`
- Update prop to accept fund type
- Update aggregation logic to filter by fund type
- Duplicate savings bucket logic for investments bucket
- Update field name: `isTrackingFund` → `isTrackingFund`

#### `CSPBudgetRow.tsx`
- Update field name: `isTrackingFund` → `isTrackingFund`
- Update any labels or tooltips

### 3.8 Routing (`src/App.tsx` or router config)

```typescript
// BEFORE
<Route path="/saving-targets" element={<SavingTargetsPage />} />

// AFTER
<Route path="/funds" element={<FundsPage />} />
```

### 3.9 Navigation Menu

Update navigation links:
- Label: "Savings" → "Funds"
- Path: `/saving-targets` → `/funds`

### 3.10 Redux (if applicable)

If there's a Redux slice for saving targets:
- Rename slice: `savingTargets` → `funds`
- Update all action names
- Update state shape
- Update selectors

---

## 4. Type Definitions

### Throughout Codebase

**Variable/Parameter Names:**
```typescript
// BEFORE
savingTarget, savingTargets, savingTargetId

// AFTER
fund, funds, fundId
```

**Type Imports:**
```typescript
// BEFORE
import { SavingTarget } from 'easy-csp-shared-types';

// AFTER
import { Fund } from 'easy-csp-shared-types';
```

---

## 5. User-Facing Text Changes

| Old Text | New Text |
|----------|----------|
| "Saving Target" | "Fund" |
| "Saving Targets" | "Funds" |
| "Select Saving Target" | "Select Fund" |
| "Assign to Saving Target" | "Assign to Fund" |
| "Savings" (tab/page) | "Funds" |
| "Savings" (CSP bucket) | "Savings" (keep) |
| N/A | "Investments" (new CSP bucket) |

---

## 6. CSP Aggregation Logic

### New Behavior

**Savings Bucket:**
- Aggregate all funds where `type === 'saving'`
- Display total saved, total target, progress

**Investments Bucket (NEW):**
- Aggregate all funds where `type === 'investment'`
- Display total invested, total target, progress
- Same UI/behavior as savings bucket

### Implementation

```typescript
// In CSP aggregation service/hook
const savingFunds = funds.filter(f => f.type === 'saving');
const investmentFunds = funds.filter(f => f.type === 'investment');

const savingsBucket = aggregateFunds(savingFunds);
const investmentsBucket = aggregateFunds(investmentFunds);
```

---

## 7. Migration Notes

### Data Migration (Manual)

Since we're not worrying about backwards compatibility:

1. **Firestore Collection:**
   - Manually rename `savingTargets` collection to `funds` in Firebase Console
   - OR create new `funds` collection and migrate data with a script
   - Add `type: 'saving'` to all existing documents

2. **Transaction Documents:**
   - Update all transactions: `savingTargetId` → `fundId`
   - Can be done with a Firestore batch update script

3. **Rule Documents:**
   - Update all rules: `assignSavingTargetId` → `assignFundId`

4. **CSP Budget Documents:**
   - Update all budgets: `isTrackingFund` → `isTrackingFund`

---

## 8. Testing Checklist

- [ ] Create new saving fund
- [ ] Create new investment fund
- [ ] Edit fund (both types)
- [ ] Delete fund (both types)
- [ ] Assign transaction to fund
- [ ] Filter transactions by fund
- [ ] Create rule that assigns to fund
- [ ] View CSP page - savings bucket shows only saving funds
- [ ] View CSP page - investments bucket shows only investment funds
- [ ] Both buckets aggregate correctly
- [ ] Fund selector works in transaction dialog
- [ ] Fund selector works in rule dialog
- [ ] Fund filter works on transactions page
- [ ] Navigation to /funds works
- [ ] All labels updated correctly

---

## 9. Implementation Order

1. **Shared Types** - Update models, rebuild, reinstall
2. **Backend** - Update Firestore rules, collection references
3. **Services** - Rename service files and functions
4. **Hooks** - Rename hook files and exports
5. **Components** - Rename component files
6. **Component Internals** - Update all references inside components
7. **Routing** - Update route paths
8. **Navigation** - Update menu items
9. **CSP Logic** - Add investment bucket, update aggregation
10. **Testing** - Verify all functionality

---

## 10. Files to Update (Complete List)

### Shared Types
- `src/firestore.types.ts`
- `src/index.ts` (exports)

### Services
- `src/services/savingTargetsService.ts` → `fundsService.ts`
- `src/services/transactionsService.ts`
- `src/services/rulesService.ts`
- `src/services/cspService.ts` (if exists)

### Hooks
- `src/hooks/api/useFunds.ts` → `useFunds.ts`
- `src/hooks/api/useTransactions.ts`
- `src/hooks/api/useRules.ts`

### Pages
- `src/pages/savingTargets/SavingTargetsPage.tsx` → `funds/FundsPage.tsx`
- `src/pages/savingTargets/SavingTargetDialog.tsx` → `funds/FundDialog.tsx`
- `src/pages/transactions/TransactionsPage.tsx`
- `src/pages/transactions/TransactionEditDialog.tsx`
- `src/pages/rules/RuleEditDialog.tsx`
- `src/pages/consciousSpendingPlan/CSPBucketCardList.tsx`
- `src/pages/consciousSpendingPlan/CSPBucketCard.tsx`
- `src/pages/consciousSpendingPlan/CSPBudgetRow.tsx`

### Components
- `src/components/common/SavingTargetSelector.tsx` → `FundSelector.tsx`
- `src/components/common/SavingTargetFilter.tsx` → `FundFilter.tsx`

### Routing & Navigation
- `src/App.tsx` (or wherever routes are defined)
- Navigation menu component

### Redux (if applicable)
- Any saving targets slice files

### Backend
- `easy-csp-cloud/firestore.rules`
- Any Cloud Functions referencing saving targets

---

## Notes

- No backwards compatibility needed - breaking changes are acceptable
- All existing "saving targets" will become "saving funds" (type: 'saving')
- Investment funds are a new feature with identical behavior
- CSP page will have two separate buckets for savings vs investments
