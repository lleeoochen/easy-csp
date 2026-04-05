# Design Document: CSP Category Management

## Overview

This feature adds the ability for users to add and remove custom categories from their Conscious Spending Plan (CSP) buckets, and ensures all category displays throughout the app derive their data dynamically from the user's CSP document rather than the static `CSPCategory` enum.

The changes are localized to four areas:
1. **Shared types** — add `name?: string` to `CSPCategoryBudget`
2. **Service layer** — extend `addCSPItem` to accept and persist `name`
3. **Hook layer** — rewrite `useCategoryMap` to read from the CSP document
4. **UI layer** — add an inline "Add Category" row to each eligible bucket card, and a delete action to existing rows

No Firestore migration is required. Existing documents without a `name` field fall back to `camelCaseToSentence(category)`.

---

## Architecture

The feature follows the existing React Query + Firestore service pattern already established in the codebase.

```
┌─────────────────────────────────────────────────────────┐
│  UI Layer                                               │
│  CSPBucketCard  ──►  AddCategoryRow (new)               │
│  CSPBudgetActionMenu  ──►  Delete action (new)          │
└────────────────────────┬────────────────────────────────┘
                         │ useAddCSPItem / useDeleteCSPItem
┌────────────────────────▼────────────────────────────────┐
│  React Query Hooks (useCSP.ts)                          │
│  useAddCSPItem  /  useDeleteCSPItem  (already exist)    │
│  — extended to pass `name` field                        │
└────────────────────────┬────────────────────────────────┘
                         │ ConsciousSpendingPlanService
┌────────────────────────▼────────────────────────────────┐
│  Service Layer (consciousSpendingPlanService.ts)        │
│  addCSPItem(bucket, category, amount, isST?, name?)     │
└────────────────────────┬────────────────────────────────┘
                         │ Firestore SDK
┌────────────────────────▼────────────────────────────────┐
│  Firestore: consciousSpendingPlans/{uid}                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  useCategoryMap (rewritten)                             │
│  reads CSP document + saving targets                    │
│  resolves: item.name ?? camelCaseToSentence(item.cat)   │
└─────────────────────────────────────────────────────────┘
```

---

## Components and Interfaces

### 1. `AddCategoryRow` (new component)

Location: `easy-csp/src/pages/consciousSpendingPlan/AddCategoryRow.tsx`

An inline input row rendered at the bottom of each eligible `CSPBucketCard`. It is not shown for the `savings` bucket.

**Props:**
```ts
interface AddCategoryRowProps {
  bucket: CSPBucket;
}
```

**Behavior:**
- Renders a text input and a confirm button (e.g. `+` or `Add`)
- On submit: trims input, derives camelCase ID via `sentenceToCamelCase`, calls `useAddCSPItem`
- Validates: rejects empty/whitespace-only input; rejects duplicate IDs within the bucket (checked client-side against the current CSP query data before firing the mutation)
- Displays inline error messages for validation failures and mutation errors
- On success: clears the input field; the new row appears immediately via React Query cache update

**camelCase derivation utility** (new, in `stringUtils.ts`):
```ts
// "My Custom Category" → "myCustomCategory"
export const sentenceToCamelCase = (s: string): string => {
  return s
    .trim()
    .split(/\s+/)
    .map((word, i) => i === 0
      ? word.toLowerCase()
      : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('');
};
```

### 2. `CSPBucketCard` (modified)

Location: `easy-csp/src/pages/consciousSpendingPlan/CSPBucketCard.tsx`

Add `<AddCategoryRow bucket={cspBucket} />` at the bottom of `CardContent`, conditionally rendered when `cspBucket !== CSPBucket.Savings`.

### 3. `CSPBudgetActionMenu` (modified)

Location: `easy-csp/src/pages/consciousSpendingPlan/CSPBudgetActionMenu.tsx`

Add a "Remove Category" `DropdownMenuItem` that:
- Is hidden for saving-target-backed categories (`budget.isTrackingFund === true`)
- Opens a confirmation dialog before calling `useDeleteCSPItem`

### 4. `useCategoryMap` (rewritten)

Location: `easy-csp/src/hooks/useCategoryMap.ts`

Replace the `Object.values(CSPCategory)` iteration with an iteration over all entries in the CSP document:

```ts
export const useCategoryMap = (): Record<string, string> => {
  const { data: csp } = useCSP();
  const { data: savingTargets = [] } = useFunds();

  return useMemo(() => {
    const map: Record<string, string> = {};

    if (csp) {
      for (const items of Object.values(csp)) {
        for (const item of items as CSPCategoryBudget[]) {
          map[item.category] = item.name ?? camelCaseToSentence(item.category);
        }
      }
    }

    for (const target of savingTargets) {
      map[target.id] = target.name;
    }

    return map;
  }, [csp, savingTargets]);
};
```

`isSavingTargetCategory` is updated to check against the CSP document's category IDs rather than the static enum.

### 5. `ConsciousSpendingPlanService.addCSPItem` (modified)

Signature change:
```ts
public static async addCSPItem(
  bucket: CSPBucket,
  category: string,
  amount: number,
  isTrackingFund?: boolean,
  name?: string                      // ← new
): Promise<...>
```

The new item pushed to `bucketItems` includes `name` when provided:
```ts
bucketItems.push({ category, amount, isTrackingFund, ...(name ? { name } : {}) });
```

### 6. `useAddCSPItem` hook (modified)

Location: `easy-csp/src/hooks/api/useCSP.ts`

Extend the mutation payload type to include `name?: string` and pass it through to the service.

### 7. `CSPCategoryBudget` type (modified)

Location: `easy-csp-shared-types/src/firestore.types.ts`

```ts
export interface CSPCategoryBudget {
  category: string;
  amount: number;
  isTrackingFund?: boolean;
  name?: string;   // ← new: human-readable label for user-created categories
}
```

### 8. `RulesList` (modified)

Location: `easy-csp/src/pages/rules/RulesList.tsx`

For each rule that has a `changeCategory` action, cross-reference the value against `useCategoryMap`. If the category ID is not present in the map, render a warning indicator (e.g. a yellow `AlertTriangle` icon from `lucide-react`) next to the rule name with a tooltip or label: "Category no longer exists in your CSP".

The check is purely presentational — no mutation is fired, the rule stays enabled.

```ts
// Inside RulesList, per rule:
const categoryMap = useCategoryMap();
const hasStaleCategory = rule.action.changeCategory !== undefined
  && categoryMap[rule.action.changeCategory] === undefined;
```

### 9. `defaultCSPData.ts` (modified)

Location: `easy-csp-cloud/functions/src/utils/defaultCSPData.ts`

Add `name` fields to each entry so new users get readable labels from day one. Example:
```ts
{ category: CSPCategory.RentMortgage, amount: 1500, name: 'Rent / Mortgage' }
```

---

## Data Models

### `CSPCategoryBudget` (updated)

| Field | Type | Required | Description |
|---|---|---|---|
| `category` | `string` | yes | camelCase identifier (e.g. `rentMortgage`, `myCustomCategory`) |
| `amount` | `number` | yes | Budget target amount |
| `isTrackingFund` | `boolean` | no | True when this entry mirrors a saving target |
| `name` | `string` | no | Human-readable label. Falls back to `camelCaseToSentence(category)` when absent |

### Category name resolution order

```
1. item.name  (if present and non-empty)
2. camelCaseToSentence(item.category)  (fallback for legacy entries)
```

For saving-target-backed entries, the saving target's `name` field is always used (via `useCategoryMap`).

### Category ID derivation (user input → Firestore key)

```
"My Custom Category"
  → trim → "My Custom Category"
  → sentenceToCamelCase → "myCustomCategory"
```

Duplicate check: case-insensitive comparison of the derived ID against existing `category` values in the same bucket.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Add entry round-trip

*For any* valid (non-empty, non-duplicate) category name string and any non-savings CSP bucket, calling `addCSPItem` with the derived camelCase ID and the trimmed original name should result in the CSP document containing an entry whose `category` equals the derived ID and whose `name` equals the trimmed input.

**Validates: Requirements 1.1, 9.3**

### Property 2: Duplicate ID rejection

*For any* CSP bucket and any category name whose derived camelCase ID (after trimming) already exists in that bucket, the add operation should return `success: false` and the bucket's entry list should remain unchanged.

**Validates: Requirements 1.2, 6.3**

### Property 3: Write failure on add leaves CSP unchanged

*For any* CSP state, if the Firestore `updateDoc` call throws during `addCSPItem`, the service should return `success: false` and the CSP document in Firestore should remain identical to its state before the call.

**Validates: Requirements 1.4**

### Property 4: Write failure on delete leaves CSP unchanged

*For any* CSP state, if the Firestore `updateDoc` call throws during `deleteCSPItem`, the service should return `success: false` and the CSP document in Firestore should remain identical to its state before the call.

**Validates: Requirements 2.3**

### Property 5: Savings bucket is protected from add

*For any* category name and amount, calling `addCSPItem` with `bucket = CSPBucket.Savings` should be rejected — the savings bucket entry list should remain unchanged.

**Validates: Requirements 1.5**

### Property 6: Saving-target-backed categories cannot be deleted via CSP

*For any* `CSPCategoryBudget` entry where `isTrackingFund === true`, the delete action should not be available in the UI (the menu item is absent), and any direct call to `deleteCSPItem` for such a category should be rejected.

**Validates: Requirements 2.5**

### Property 7: Category map keys equal the union of CSP categories and saving target IDs

*For any* CSP document and saving target list, the set of keys returned by `useCategoryMap` should equal exactly the union of all `category` values across all CSP bucket entries and all saving target IDs — no more, no less.

**Validates: Requirements 3.1, 8.1**

### Property 8: Name resolution follows priority order

*For any* `CSPCategoryBudget` entry, the value stored in the category map for that entry's `category` key should equal `entry.name` when `entry.name` is a non-empty string, and `camelCaseToSentence(entry.category)` otherwise.

**Validates: Requirements 3.5, 7.1, 8.2**

### Property 9: Whitespace-only names are rejected

*For any* string composed entirely of whitespace characters (including the empty string), the `AddCategoryRow` submission should be rejected with a validation error and no mutation should be fired.

**Validates: Requirements 6.1**

### Property 10: Trim invariant for `sentenceToCamelCase`

*For any* string `s`, `sentenceToCamelCase(s)` should equal `sentenceToCamelCase(s.trim())` — leading and trailing whitespace must not affect the derived camelCase ID.

**Validates: Requirements 6.2**

### Property 11: Stale category warning appears iff category is absent from map

*For any* rule with a `changeCategory` action, the warning indicator should be visible if and only if the `changeCategory` value is not a key in the current `useCategoryMap` result.

**Validates: Requirement 6.1, 6.3**

---

## Error Handling

| Scenario | Handling |
|---|---|
| Empty / whitespace-only category name | Client-side validation in `AddCategoryRow`; inline error message; no mutation fired |
| Duplicate category ID in same bucket | Client-side check against React Query cache before mutation; inline error message |
| Firestore write failure (add) | `useAddCSPItem` mutation `onError` callback; toast or inline error; cache not updated |
| Firestore write failure (delete) | `useDeleteCSPItem` mutation `onError` callback; toast or inline error; cache not updated |
| CSP document not found | Existing service handling (`success: false, message: "..."`); surfaced via React Query error state |
| User not authenticated | Existing `getAuthenticatedUserId()` throws; caught by service; surfaced via React Query error state |

---

## Testing Strategy

### Unit tests

Focus on specific examples, edge cases, and pure functions:

- `sentenceToCamelCase` — empty string, single word, multi-word, leading/trailing whitespace, mixed case
- `camelCaseToSentence` — existing utility, no changes needed
- Name resolution logic — entry with `name`, entry without `name`, saving target override
- `AddCategoryRow` — renders for non-savings buckets, does not render for savings bucket, shows validation error on empty submit, shows duplicate error
- `CSPBudgetActionMenu` — delete option absent for saving-target-backed categories, confirmation dialog appears before mutation
- `CSPBucketCardList` — ignored bucket card is not rendered

### Property-based tests

Use **fast-check** (already compatible with Vitest, the project's test runner).

Each property test runs a minimum of **100 iterations**.

Tag format: `// Feature: csp-category-management, Property N: <property text>`

| Property | Test description |
|---|---|
| P1 | Generate random sentence strings + random non-savings buckets; add item; verify stored ID and name |
| P2 | Generate random CSP state with at least one entry; attempt to add with same derived ID; verify rejection and unchanged state |
| P3 | Generate random CSP state; mock `updateDoc` to throw; call `addCSPItem`; verify `success: false` and unchanged Firestore state |
| P4 | Same as P3 but for `deleteCSPItem` |
| P5 | Generate random category names; call `addCSPItem` with `CSPBucket.Savings`; verify rejection |
| P6 | Generate random CSP entries with `isTrackingFund: true`; verify delete action is absent in rendered menu |
| P7 | Generate random CSP documents and saving target lists; call `useCategoryMap`; verify key set equals union |
| P8 | Generate random `CSPCategoryBudget` entries with and without `name`; verify map value follows resolution order |
| P9 | Generate random whitespace-only strings; submit to `AddCategoryRow`; verify no mutation and error shown |
| P10 | Generate random strings with random leading/trailing whitespace; verify `sentenceToCamelCase(s) === sentenceToCamelCase(s.trim())` |
