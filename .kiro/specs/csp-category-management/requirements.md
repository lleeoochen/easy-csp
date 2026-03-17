# Requirements Document

## Introduction

This feature allows users to manage the categories in their Conscious Spending Plan (CSP). Users can add new custom categories to any CSP bucket (except `savings`) and remove existing ones. Category names are entered as free-form text and auto-converted to a camelCase ID; the human-readable name is stored separately on the `CSPCategoryBudget` entry. All category dropdowns and displays throughout the app (transactions, rules, etc.) will derive their options dynamically from the categories present in the user's CSP document and the user's saving targets — replacing the previous reliance on the static `CSPCategory` enum defaults.

## Glossary

- **CSP**: Conscious Spending Plan — a per-user budget document stored in Firestore under `consciousSpendingPlans/{uid}`.
- **CSP_Manager**: The frontend UI responsible for displaying and managing the CSP.
- **Category**: A camelCase string identifier for a spending/income line item within a CSP bucket (e.g., `rentMortgage`, `myCustomCategory`).
- **Category_Name**: The human-readable label for a category. For user-created categories, stored in the `name` field of `CSPCategoryBudget`. For legacy entries without a `name` field, derived by applying `camelCaseToSentence` to the `category` ID.
- **CSP_Bucket**: One of the top-level groupings in the CSP: `income`, `fixedCost`, `savings`, `investment`, `guildFreeSpending`, `ignored`.
- **Saving_Target**: A user-defined savings goal stored in Firestore under `savingTargets/{id}`, whose document ID is used as a category in the `savings` bucket.
- **Category_Source**: The combined set of categories available for selection — union of all categories present in the user's CSP document and all saving target IDs.
- **Category_Dropdown**: Any UI control in the app that lets the user assign or filter by a category (e.g., transaction edit, rule editor).
- **ConsciousSpendingPlanService**: The frontend service class that performs Firestore CRUD on the CSP document.
- **Add_Category_Row**: The inline input row displayed at the bottom of each CSP bucket card that allows the user to type a new category name and add it to that bucket.


## Requirements

### Requirement 1: Add a Custom Category to a CSP Bucket

**User Story:** As a user, I want to add a new category to a CSP bucket, so that I can track spending or income items that aren't covered by the default categories.

#### Acceptance Criteria

1. WHEN the user submits a valid new category name via the Add_Category_Row, THE CSP_Manager SHALL derive a camelCase `category` ID from the name (e.g., "My Custom Category" → `myCustomCategory`) and add a new `CSPCategoryBudget` entry with `amount: 0` and the original name stored in the `name` field to the specified bucket in the user's CSP document.
2. WHEN a category with the same derived camelCase ID already exists in the specified bucket, THE CSP_Manager SHALL reject the addition and display an error message to the user.
3. WHEN the addition succeeds, THE CSP_Manager SHALL reflect the new category in the CSP bucket view without requiring a full page reload.
4. IF the Firestore write fails, THEN THE CSP_Manager SHALL display an error message and leave the existing CSP data unchanged.
5. THE CSP_Manager SHALL allow adding categories to any bucket except `savings` (saving targets manage that bucket exclusively).
6. THE Add_Category_Row SHALL be displayed at the bottom of each eligible bucket card (all buckets except `savings`).

### Requirement 2: Remove a Category from a CSP Bucket

**User Story:** As a user, I want to remove a category from my CSP, so that I can keep my spending plan clean and relevant.

#### Acceptance Criteria

1. WHEN the user confirms removal of a category, THE CSP_Manager SHALL delete the corresponding `CSPCategoryBudget` entry from the bucket in the user's CSP document.
2. WHEN the removal succeeds, THE CSP_Manager SHALL remove the category row from the bucket view without requiring a full page reload.
3. IF the Firestore write fails, THEN THE CSP_Manager SHALL display an error message and leave the existing CSP data unchanged.
4. THE CSP_Manager SHALL require explicit user confirmation before removing a category (e.g., a confirmation dialog or destructive action prompt).
5. THE CSP_Manager SHALL prevent removal of saving-target-backed categories from the CSP directly — those are managed through the Saving Targets feature.


### Requirement 3: Dynamic Category Source

**User Story:** As a user, I want all category dropdowns and displays in the app to reflect my actual CSP categories, so that I only see options that are relevant to my plan.

#### Acceptance Criteria

1. THE Category_Dropdown SHALL derive its options from the union of all category IDs present in the user's CSP document and all saving target IDs belonging to the user.
2. THE Category_Dropdown SHALL NOT include categories from the static `CSPCategory` enum that are not present in the user's CSP.
3. WHEN a category is added to or removed from the CSP, THE Category_Dropdown SHALL reflect the updated options on the next render without requiring a page reload.
4. WHEN a saving target is added or removed, THE Category_Dropdown SHALL reflect the updated options on the next render without requiring a page reload.
5. THE Category_Dropdown SHALL display a human-readable label for each option using the resolution order defined in Requirement 7.

### Requirement 4: Category Display in Transaction List

**User Story:** As a user, I want transaction rows to show the correct category name based on my current CSP and saving targets, so that category labels stay accurate after I modify my plan.

#### Acceptance Criteria

1. WHEN a transaction's `category` field matches a category ID in the user's CSP, THE Transaction_Row SHALL display the human-readable label resolved using the order defined in Requirement 7.
2. WHEN a transaction's `category` field matches a saving target ID, THE Transaction_Row SHALL display the saving target's `name` field as the label.
3. WHEN a transaction's `category` field does not match any known category or saving target, THE Transaction_Row SHALL display the raw `category` string as a fallback.

### Requirement 5: Category Display in CSP Bucket View

**User Story:** As a user, I want the CSP bucket view to show the correct display name for each category row, so that custom categories are readable.

#### Acceptance Criteria

1. WHEN a CSP bucket contains a category entry, THE CSP_Manager SHALL display the human-readable label for that category using the resolution order defined in Requirement 7.
2. WHEN a category entry is a saving-target-backed category, THE CSP_Manager SHALL display the saving target's `name` field as the label.
3. THE CSP_Manager SHALL NOT display the `ignored` bucket on the CSP page, even though users may add categories to it.


### Requirement 6: Stale Category Warning in Rules UI

**User Story:** As a user, I want to see a warning on any rule that references a category that no longer exists in my CSP, so that I know the rule may not behave as expected.

#### Acceptance Criteria

1. WHEN a rule has a `changeCategory` action whose value does not match any key in the current `useCategoryMap` result, THE Rules_UI SHALL display a visible warning indicator on that rule row.
2. THE warning SHALL be informational only — the rule remains active and is not automatically disabled or deleted.
3. WHEN the referenced category is later re-added to the CSP (or a saving target with that ID is created), THE warning SHALL disappear on the next render without requiring a page reload.


### Requirement 7: Category Name Validation

**User Story:** As a user, I want the app to validate category names before saving, so that I don't accidentally create duplicate or empty categories.

#### Acceptance Criteria

1. WHEN the user submits a new category name that is empty or contains only whitespace, THE CSP_Manager SHALL reject the input and display a validation error.
2. WHEN the user submits a new category name, THE CSP_Manager SHALL trim leading and trailing whitespace before deriving the camelCase ID and persisting.
3. WHEN the user submits a category name whose derived camelCase ID, after trimming, is identical (case-insensitive) to an existing category ID in the same bucket, THE CSP_Manager SHALL reject the input and display a duplicate error.


### Requirement 7: Category Name Resolution

**User Story:** As a user, I want the app to display a consistent, readable name for every category regardless of when it was created, so that my plan is always understandable.

#### Acceptance Criteria

1. WHEN resolving the display name for a category, THE CSP_Manager SHALL use the following priority order:
   a. If the `CSPCategoryBudget` entry has a non-empty `name` field, use that value.
   b. Otherwise, apply `camelCaseToSentence` to the `category` ID as a fallback.
2. THE CSP_Manager SHALL NOT require a Firestore migration — existing `CSPCategoryBudget` entries without a `name` field SHALL be handled by the fallback in criterion 1b.
3. WHEN a saving target category is resolved, THE CSP_Manager SHALL use the saving target's `name` field as the display label.


### Requirement 8: `useCategoryMap` Hook

**User Story:** As a developer, I want a single hook that provides a complete category ID → display name mapping, so that all parts of the UI resolve labels consistently.

#### Acceptance Criteria

1. THE `useCategoryMap` hook SHALL read category entries from the user's CSP document rather than from the static `CSPCategory` enum.
2. WHEN building the category map, THE `useCategoryMap` hook SHALL resolve each entry's display name using the priority order defined in Requirement 7 (`name ?? camelCaseToSentence(category)`).
3. THE `useCategoryMap` hook SHALL include saving target entries in the map, using each saving target's `name` field as the display value.
4. WHEN the user's CSP document or saving targets change, THE `useCategoryMap` hook SHALL return an updated map on the next render without requiring a page reload.


### Requirement 9: `CSPCategoryBudget` Type Extension

**User Story:** As a developer, I want the `CSPCategoryBudget` type to carry an optional human-readable name, so that user-created categories can store their label alongside their ID.

#### Acceptance Criteria

1. THE `CSPCategoryBudget` type in `easy-csp-shared-types` SHALL gain an optional `name?: string` field to store the human-readable label for a category.
2. THE `name` field SHALL be optional so that existing Firestore documents without it remain valid without any migration.
3. WHEN a new category is created by the user, THE CSP_Manager SHALL populate the `name` field with the original free-form text entered by the user (after trimming).
