# Requirements Document: Transaction Splitting

## Introduction

The transaction splitting feature enables users to divide a single transaction into multiple independent transactions with configurable frequency (weekly, monthly, yearly) and repetition count. This feature supports both manual splitting through the UI and automatic rule-based splitting for matching transactions. Split transactions maintain independence while preserving their relationship to the original transaction through metadata fields.

## Glossary

- **Transaction**: A financial transaction record synced from Plaid or manually created, containing amount, date, category, and other metadata
- **Split_Transaction**: A transaction created by dividing an original transaction, marked with split metadata fields
- **Parent_Transaction**: The original transaction that was split, serving as the reference point for all splits
- **Split_Service**: Cloud Function responsible for creating and managing split transactions
- **Transaction_UI**: Frontend components for displaying and managing transactions
- **Split_Dialog**: UI component for configuring split parameters
- **Rule_Engine**: System that applies user-defined rules to transactions, including auto-split rules
- **Split_Configuration**: Parameters defining how a transaction should be split (count, frequency, start date)
- **Firestore**: Backend database storing all transaction data

## Requirements

### Requirement 1: Manual Transaction Splitting

**User Story:** As a user, I want to manually split a transaction into multiple transactions with configurable frequency, so that I can distribute a single expense across multiple time periods.

#### Acceptance Criteria

1. WHEN a user opens the transaction edit dialog for an unsplit transaction, THE Transaction_UI SHALL display a "Split Transaction" button
2. WHEN a user clicks the "Split Transaction" button, THE Transaction_UI SHALL open the Split_Dialog with configuration options
3. WHEN a user configures split parameters (count between 2-12, frequency, start date), THE Split_Dialog SHALL validate the configuration before submission
4. WHEN a user submits valid split configuration, THE Split_Dialog SHALL call the Split_Service Cloud Function with the transaction ID and configuration
5. WHEN the Split_Service successfully creates splits, THE Transaction_UI SHALL display a success message and refresh the transaction list
6. WHEN a user attempts to split an already-split transaction, THE Transaction_UI SHALL disable the split button and prevent the action

### Requirement 2: Split Amount Distribution

**User Story:** As a user, I want split transactions to have equal amounts with proper handling of remainders, so that the total of all splits equals the original transaction amount.

#### Acceptance Criteria

1. WHEN the Split_Service divides a transaction amount by split count, THE Split_Service SHALL calculate a base amount rounded to 2 decimal places
2. WHEN calculating split amounts, THE Split_Service SHALL assign any remainder from rounding to the first split transaction
3. WHEN all split transactions are created, THE Split_Service SHALL ensure the sum of split amounts equals the original transaction amount within 0.01 precision
4. THE Split_Service SHALL create exactly the number of split transactions specified in the configuration

### Requirement 3: Split Date Calculation

**User Story:** As a user, I want split transactions to have dates calculated based on the selected frequency, so that splits are distributed across the appropriate time periods.

#### Acceptance Criteria

1. WHEN frequency is set to weekly, THE Split_Service SHALL calculate each subsequent split date as 7 days after the previous date
2. WHEN frequency is set to monthly, THE Split_Service SHALL calculate each subsequent split date as 1 month after the previous date on the same day
3. WHEN frequency is set to yearly, THE Split_Service SHALL calculate each subsequent split date as 1 year after the previous date on the same month and day
4. WHEN calculating dates across month boundaries, THE Split_Service SHALL handle edge cases using the date library's default behavior
5. THE Split_Service SHALL ensure all calculated split dates are monotonically increasing

### Requirement 4: Split Metadata Management

**User Story:** As a developer, I want split transactions to maintain proper metadata fields, so that the system can track relationships between splits and their parent transaction.

#### Acceptance Criteria

1. WHEN a transaction is split, THE Split_Service SHALL set splitParentId to the transaction's own ID on the original transaction (self-reference indicates parent)
2. WHEN creating child split transactions, THE Split_Service SHALL set splitParentId to the original transaction's ID on each child split
3. WHEN a transaction has splitParentId === transaction.id, THE system SHALL recognize it as a parent transaction that has been split
4. WHEN a transaction has splitParentId !== null AND splitParentId !== transaction.id, THE system SHALL recognize it as a child split transaction
5. WHEN a transaction has splitParentId === null, THE system SHALL recognize it as an unsplit transaction
6. THE Split_Service SHALL derive split count, index, and position by querying all transactions with matching splitParentId

### Requirement 5: Split Transaction Independence

**User Story:** As a user, I want to modify split transactions independently, so that I can customize category, saving target, and other fields for each split without affecting others.

#### Acceptance Criteria

1. WHEN a user modifies a split transaction's category, THE Transaction_UI SHALL update only that split transaction
2. WHEN a user modifies a split transaction's saving target, THE Transaction_UI SHALL update only that split transaction
3. WHEN a user modifies a split transaction's hidden status, THE Transaction_UI SHALL update only that split transaction
4. WHEN a user modifies a split transaction, THE Transaction_UI SHALL not modify the parent transaction or sibling splits
5. THE Transaction_UI SHALL allow all standard transaction modifications on split transactions except re-splitting

### Requirement 6: Split Transaction Display

**User Story:** As a user, I want to see visual indicators for split transactions, so that I can easily identify which transactions are splits and their position in the split sequence.

#### Acceptance Criteria

1. WHEN displaying a parent transaction (splitParentId === transaction.id), THE Transaction_UI SHALL query all transactions with matching splitParentId to determine total split count and show a badge (e.g., "Parent (3 splits)")
2. WHEN displaying a child split transaction, THE Transaction_UI SHALL query all transactions with matching splitParentId, determine its position by datetime ordering, and show a badge (e.g., "Split 2 of 3")
3. WHEN displaying split transactions, THE Transaction_UI SHALL apply visual styling to distinguish them from regular transactions
4. THE Transaction_UI SHALL display split indicators in the transaction list view

### Requirement 7: Rule-Based Auto-Splitting

**User Story:** As a user, I want to create rules that automatically split matching transactions, so that recurring expenses are automatically distributed without manual intervention.

#### Acceptance Criteria

1. WHEN a user creates a rule with an autoSplit action, THE Rule_Engine SHALL validate that splitCount is between 2 and 12
2. WHEN a user creates a rule with an autoSplit action, THE Rule_Engine SHALL validate that frequency is a valid SplitFrequency value
3. WHEN a new transaction matches a rule with autoSplit action, THE Rule_Engine SHALL trigger the Split_Service with the configured parameters
4. WHEN applying auto-split rules, THE Rule_Engine SHALL skip transactions that are already split
5. WHEN auto-split is triggered, THE Rule_Engine SHALL use the transaction's datetime as the start date for split calculations

### Requirement 8: Split Transaction Queries

**User Story:** As a user, I want to query and filter split transactions efficiently, so that I can view all splits related to a parent transaction.

#### Acceptance Criteria

1. WHEN querying for split transactions by parent ID, THE Firestore SHALL use the composite index on (uid, splitParentId, datetime)
2. WHEN querying split transactions, THE Transaction_UI SHALL order results by datetime in ascending order
3. WHEN displaying a parent transaction, THE Transaction_UI SHALL provide a way to view all related child splits
4. THE Transaction_UI SHALL support filtering transactions to show or hide split transactions

### Requirement 9: Split Validation and Error Handling

**User Story:** As a user, I want clear error messages when split operations fail, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN split count is less than 2 or greater than 12, THE Split_Dialog SHALL display a validation error and prevent submission
2. WHEN a user attempts to split a transaction they don't own, THE Split_Service SHALL return a permission error
3. WHEN a user attempts to split an already-split transaction, THE Split_Service SHALL return an error indicating the transaction is already split
4. WHEN Firestore write operations fail during split creation, THE Split_Service SHALL roll back all changes and return an error
5. WHEN the Split_Service returns an error, THE Transaction_UI SHALL display a user-friendly error message

### Requirement 10: Split Transaction Atomicity

**User Story:** As a developer, I want split creation to be atomic, so that partial splits are never created if any operation fails.

#### Acceptance Criteria

1. WHEN creating split transactions, THE Split_Service SHALL use Firestore batch writes for all operations
2. WHEN any write operation in the batch fails, THE Split_Service SHALL ensure no split transactions are created
3. WHEN the batch commit succeeds, THE Split_Service SHALL ensure all split transactions and parent updates are persisted
4. THE Split_Service SHALL return success only after the batch commit completes successfully

### Requirement 11: User Rule Application to Splits

**User Story:** As a user, I want my transaction rules to apply to newly created split transactions, so that splits are automatically categorized and configured according to my preferences.

#### Acceptance Criteria

1. WHEN creating split transactions, THE Split_Service SHALL apply the user's rule transformations to each split
2. WHEN applying rules to splits, THE Split_Service SHALL evaluate all matching rules based on the split's properties
3. WHEN rules modify split properties, THE Split_Service SHALL persist the modified values to Firestore
4. THE Split_Service SHALL apply rules before persisting split transactions to the database

### Requirement 12: Split Security and Permissions

**User Story:** As a system administrator, I want split operations to enforce proper security rules, so that users can only split their own transactions.

#### Acceptance Criteria

1. WHEN a user attempts to split a transaction, THE Split_Service SHALL verify the user owns the transaction before proceeding
2. WHEN reading split transactions, THE Firestore SHALL enforce that users can only read their own transactions
3. WHEN creating split transactions, THE Firestore SHALL prevent direct client-side creation of transactions with isSplit set to true
4. WHEN updating split transactions, THE Firestore SHALL allow modifications only to category, savingTargetId, and hidden fields
5. THE Split_Service SHALL rate limit split operations to maximum 10 per minute per user

### Requirement 13: Split Data Integrity

**User Story:** As a developer, I want split transactions to maintain referential integrity, so that all splits reference valid parent transactions.

#### Acceptance Criteria

1. WHEN creating split transactions, THE Split_Service SHALL verify the parent transaction exists before creating splits
2. WHEN a split transaction references a parent, THE Split_Service SHALL ensure the parent transaction has splitParentId set to its own ID (self-reference)
3. THE Split_Service SHALL prevent circular references where a split references itself as parent (except for the parent's self-reference)
4. THE Split_Service SHALL ensure splitParentId always references an existing transaction ID when non-null

### Requirement 14: Split Configuration Validation

**User Story:** As a developer, I want split configurations to be validated before processing, so that invalid configurations are rejected early.

#### Acceptance Criteria

1. WHEN validating split configuration, THE Split_Service SHALL verify splitCount is between 2 and 12 inclusive
2. WHEN validating split configuration, THE Split_Service SHALL verify frequency is one of weekly, monthly, or yearly
3. WHEN validating split configuration, THE Split_Service SHALL verify startDate is a positive epoch timestamp
4. WHEN validation fails, THE Split_Service SHALL return a descriptive error message indicating which parameter is invalid

### Requirement 15: Firestore Index Configuration

**User Story:** As a developer, I want proper Firestore indexes configured, so that split transaction queries perform efficiently.

#### Acceptance Criteria

1. THE Firestore SHALL have a composite index on (uid, splitParentId, datetime) for querying splits by parent and ordering by date
2. THE Firestore SHALL have a composite index on (uid, splitParentId) for filtering split transactions
3. WHEN deploying the application, THE Firestore SHALL create these indexes automatically from the index configuration file
