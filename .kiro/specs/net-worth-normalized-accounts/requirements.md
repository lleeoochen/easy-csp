# Requirements Document: Net Worth Page with Normalized Accounts

## Feature Overview

Build a consolidated Net Worth page that displays all user assets and liabilities (both Plaid-linked and manual accounts) in one unified view, with support for account nicknames, flexible account type assignment, and fund linkage for goal tracking. This requires normalizing the Firestore data structure by moving accounts from nested arrays to a top-level collection.

## Functional Requirements

### FR1: Top-Level Accounts Collection

**FR1.1**: Create a new top-level `accounts/` collection in Firestore
- Each account is a document with auto-generated ID
- Supports both linked accounts (from Plaid) and manual accounts (user-created)
- Stores account name, nickname, type, balance, and ownership info

**FR1.2**: Distinguish between linked and manual accounts
- `isManual: true` for user-created accounts
- `isManual: false` for Plaid-linked accounts
- Linked accounts include Plaid metadata (institutionId, accountId, sync timestamp)
- Manual accounts have no Plaid metadata

**FR1.3**: Support account nicknames
- Users can set optional nickname for any account (linked or manual)
- Display nickname if set, otherwise display account name
- Nickname can be cleared/removed

**FR1.4**: Support flexible account types
- Account types: checking, savings, credit, investment, loan, other
- Users can set/change type for manual accounts
- Linked accounts get type from Plaid mapping

**FR1.5**: Support fund linkage
- Accounts can be linked to funds for goal tracking
- `linkedFundId` field references fund document
- Bidirectional linkage (account → fund, fund → account)


### FR2: Update Financial Institutions Collection

**FR2.1**: Remove accounts array from FinancialInstitution documents
- Financial institutions store only sync metadata
- No nested account data

**FR2.2**: Maintain institution-level sync state
- Status, cursor, lastSyncTimestamp, error codes
- Used to trigger Plaid sync operations

**FR2.3**: Preserve institution name for display
- Denormalized in account documents for efficient queries

### FR3: Update Transactions Collection

**FR3.1**: Reference top-level accounts directly
- `accountId` field references `accounts/{accountId}`
- Remove `institutionId` field (no longer needed)

**FR3.2**: Maintain transaction-to-account relationship
- All transactions must reference valid account
- Account must belong to same user as transaction

### FR4: Update Funds Collection

**FR4.1**: Reference top-level accounts directly
- `accountId` field references `accounts/{accountId}` (optional)
- Remove `financialInstitutionId` field (no longer needed)

**FR4.2**: Remove currentBalance field for account-linked funds
- Balance comes from linked account
- Manual funds without account linkage are deprecated (use manual accounts instead)

### FR5: Net Worth Page

**FR5.1**: Display consolidated net worth summary
- Total assets (sum of checking, savings, investment, other)
- Total liabilities (sum of credit, loan)
- Net worth (assets - liabilities)

**FR5.2**: Group accounts by type
- Assets section: checking, savings, investment, other
- Liabilities section: credit, loan
- Show subtotals for each account type

**FR5.3**: Display account cards
- Show account name or nickname
- Show current balance
- Show institution name (for linked accounts)
- Show last sync time (for linked accounts)
- Show sync status/errors (for linked accounts)
- Show "Manual account" label (for manual accounts)
- Show linked fund name (if linked)

**FR5.4**: Support account actions
- Edit nickname (all accounts)
- Update balance (manual accounts only)
- Link/unlink to fund (all accounts)
- Delete account (manual accounts only)
- Refresh sync (linked accounts via institution)


### FR6: Manual Account Management

**FR6.1**: Create manual accounts
- User provides: account name, account type, initial balance
- Optional: nickname
- System sets: uid, isManual=true, auto-generated ID

**FR6.2**: Update manual account balance
- User can update balance at any time
- Only works for manual accounts (isManual=true)
- Linked accounts cannot have balance manually updated

**FR6.3**: Update account nickname
- User can set/update/clear nickname for any account
- Works for both linked and manual accounts

**FR6.4**: Delete manual accounts
- User can delete manual accounts
- Cannot delete linked accounts (must remove institution)
- Confirm before deletion
- Unlink from fund if linked

**FR6.5**: Change manual account type
- User can change account type for manual accounts
- Cannot change type for linked accounts (comes from Plaid)

### FR7: Plaid Sync with Normalized Accounts

**FR7.1**: Sync updates top-level accounts
- Cloud Function reads institution sync state
- Calls Plaid /transactions/sync API
- Updates account balances in accounts/ collection
- Matches accounts by plaidInstitutionId + plaidAccountId

**FR7.2**: Create accounts during initial link
- When user links new institution via Plaid
- Create account documents in accounts/ collection
- Set isManual=false and populate Plaid metadata

**FR7.3**: Update transactions with account references
- Create transactions with accountId referencing top-level account
- No institutionId field needed

**FR7.4**: Handle sync errors
- Set institution status to InstitutionError
- Store error code in institution document
- Do not update account balances on error
- Preserve last successful cursor


### FR8: Data Migration

**FR8.1**: Migrate nested accounts to top-level collection
- For each financial institution, extract nested accounts
- Create top-level account document for each nested account
- Preserve all account data (name, type, balance)
- Set isManual=false and populate Plaid metadata

**FR8.2**: Update transaction references
- Find all transactions referencing old institutionId + accountId
- Update to reference new top-level accountId
- Remove institutionId field

**FR8.3**: Update fund references
- Find all funds referencing old financialInstitutionId + accountId
- Update to reference new top-level accountId
- Remove financialInstitutionId field

**FR8.4**: Migrate manual funds to manual accounts
- For each fund without accountId (manual fund)
- Create manual account with fund name and balance
- Link account to fund
- Remove currentBalance field from fund

**FR8.5**: Remove accounts array from institutions
- After successful migration, remove accounts field
- Keep institution as sync metadata only

**FR8.6**: Validate migration
- Verify account count matches before/after
- Verify all transactions have valid account references
- Verify all funds have valid account references
- Verify no data loss

### FR9: Fund Linkage

**FR9.1**: Link account to fund
- User selects account and fund to link
- Set account.linkedFundId = fund.id
- Set fund.accountId = account.id
- Fund balance automatically reflects account balance

**FR9.2**: Unlink account from fund
- User confirms unlinking
- Clear account.linkedFundId
- Clear fund.accountId
- Fund reverts to manual balance tracking (deprecated)

**FR9.3**: Prevent duplicate linkage
- Account can only be linked to one fund
- Fund can only be linked to one account
- Show warning if relinking to different fund

**FR9.4**: Update Funds page
- Show account balance for linked funds
- Show account name and institution
- Allow unlinking from Funds page


## Non-Functional Requirements

### NFR1: Performance

**NFR1.1**: Net Worth page load time
- Load all accounts and calculate net worth in <500ms (p95)
- Support up to 50 accounts per user efficiently

**NFR1.2**: Real-time updates
- Account balance changes reflect in UI within 100ms
- Net worth recalculates automatically on account changes

**NFR1.3**: Sync performance
- Sync 5 accounts in <5 seconds (p95)
- Process 100 transactions in <2 seconds

**NFR1.4**: Query optimization
- Use Firestore composite indexes for common queries
- Denormalize institution name to avoid joins
- Batch account updates during sync

### NFR2: Security

**NFR2.1**: Account access control
- Users can only read/write their own accounts
- Firestore security rules enforce uid matching

**NFR2.2**: Manual vs linked account permissions
- Users can create/update/delete manual accounts
- Only Cloud Functions can create/update linked accounts
- Users cannot modify Plaid metadata

**NFR2.3**: Plaid token security
- Access tokens stored in Secret Manager (not Firestore)
- Never exposed to client
- Retrieved only by Cloud Functions

**NFR2.4**: Data validation
- Validate account ownership before operations
- Validate account type is valid enum
- Validate balance is valid number
- Prevent modification of isManual flag after creation

### NFR3: Reliability

**NFR3.1**: Migration reliability
- Zero data loss during migration
- Rollback capability if migration fails
- Validate data before removing old structure

**NFR3.2**: Sync reliability
- Handle Plaid errors gracefully
- Preserve last successful cursor on error
- Retry transient errors automatically

**NFR3.3**: Data consistency
- Maintain bidirectional fund linkage consistency
- Ensure all transactions reference valid accounts
- Prevent orphaned data


### NFR4: Usability

**NFR4.1**: Responsive design
- Single component with Tailwind responsive classes
- Mobile-first approach (base styles for mobile, md:/lg: for larger screens)
- Touch-friendly interactions (44x44px minimum touch targets)
- No duplicate components for different screen sizes

**NFR4.2**: Clear visual hierarchy
- Net worth prominently displayed at top
- Assets and liabilities clearly separated
- Account cards grouped by type with subtotals
- Color coding (green for assets, red for liabilities)

**NFR4.3**: Intuitive actions
- Clear labels for all actions (Edit, Link, Delete, etc.)
- Confirmation dialogs for destructive actions
- Inline editing where appropriate
- Loading states for async operations

**NFR4.4**: Error messaging
- Clear, actionable error messages
- Specific guidance for Plaid errors
- Toast notifications for success/error feedback

**NFR4.5**: Mobile enhancements (Capacitor)
- Haptic feedback on button presses (optional)
- Pull-to-refresh for account sync (optional)
- Native-feeling interactions
- Works seamlessly on iOS and Android

### NFR5: Maintainability

**NFR5.1**: Code organization
- Separate services for accounts, funds, transactions
- React Query hooks for data fetching
- Reusable UI components
- Clear separation of concerns

**NFR5.2**: Type safety
- TypeScript interfaces in shared-types package
- Strict type checking enabled
- No `any` types in production code

**NFR5.3**: Testing
- Unit tests for all services
- Property-based tests for critical algorithms
- Integration tests for Plaid sync
- End-to-end tests for user flows

**NFR5.4**: Documentation
- Code comments for complex logic
- README for migration process
- API documentation for services
- User-facing help documentation


## Acceptance Criteria

### AC1: Top-Level Accounts Collection

**Given** a user has linked Plaid accounts and manual accounts
**When** the system queries the accounts collection
**Then** all accounts (linked and manual) are returned as top-level documents
**And** each account has a unique Firestore-generated ID
**And** linked accounts have `isManual: false` and Plaid metadata
**And** manual accounts have `isManual: true` and no Plaid metadata

### AC2: Net Worth Calculation

**Given** a user has multiple accounts of different types
**When** the Net Worth page loads
**Then** total assets equals sum of (checking + savings + investment + other)
**And** total liabilities equals sum of (credit + loan)
**And** net worth equals (total assets - total liabilities)
**And** all calculations are accurate to 2 decimal places

### AC3: Manual Account Creation

**Given** a user is on the Net Worth page
**When** the user clicks "Add Manual Account"
**And** fills in account name, type, and initial balance
**And** clicks "Create"
**Then** a new manual account is created in Firestore
**And** the account appears in the appropriate section (assets or liabilities)
**And** net worth recalculates to include the new account
**And** the account has `isManual: true`

### AC4: Manual Account Balance Update

**Given** a user has a manual account
**When** the user clicks "Edit" on the account
**And** updates the balance
**And** clicks "Save"
**Then** the account balance is updated in Firestore
**And** the UI reflects the new balance immediately
**And** net worth recalculates automatically
**And** linked funds (if any) show the updated balance

### AC5: Account Nickname

**Given** a user has any account (linked or manual)
**When** the user sets a nickname for the account
**Then** the account card displays the nickname instead of the account name
**And** the nickname is stored in Firestore
**When** the user clears the nickname
**Then** the account card displays the original account name

### AC6: Plaid Sync Updates Accounts

**Given** a user has linked Plaid accounts
**When** a Plaid sync is triggered
**Then** the Cloud Function updates account balances in the accounts/ collection
**And** accounts are matched by plaidInstitutionId + plaidAccountId
**And** new transactions reference the top-level account ID
**And** the institution's lastSyncTimestamp is updated
**And** account cards show the updated balances in real-time

### AC7: Fund Linkage

**Given** a user has an account and a fund
**When** the user links the account to the fund
**Then** account.linkedFundId is set to the fund ID
**And** fund.accountId is set to the account ID
**And** the fund balance automatically reflects the account balance
**And** the account card shows "Linked to: [Fund Name]"
**And** the Funds page shows the account balance for the fund

### AC8: Data Migration

**Given** the system has existing nested accounts in financialInstitutions
**When** the migration script runs
**Then** all nested accounts are created as top-level documents
**And** all transactions are updated to reference new account IDs
**And** all funds are updated to reference new account IDs
**And** manual funds are converted to manual accounts
**And** the accounts array is removed from financialInstitutions
**And** no data is lost during migration
**And** account count before equals account count after

### AC9: Account Deletion

**Given** a user has a manual account
**When** the user clicks "Delete" on the account
**And** confirms the deletion
**Then** the account is removed from Firestore
**And** the account disappears from the UI
**And** net worth recalculates without the account
**And** if the account was linked to a fund, the fund is unlinked
**And** no transactions reference the deleted account

### AC10: Responsive Design

**Given** a user accesses the Net Worth page on different devices
**When** viewing on mobile (< 768px)
**Then** accounts are displayed in a single column
**And** all interactive elements are touch-friendly (44x44px minimum)
**When** viewing on tablet (768px - 1024px)
**Then** accounts are displayed in a 2-column grid
**When** viewing on desktop (> 1024px)
**Then** accounts are displayed in a 3-column grid
**And** the same component is used for all screen sizes (no duplication)

### AC11: Security

**Given** a user is authenticated
**When** the user queries accounts
**Then** only accounts belonging to that user are returned
**And** Firestore security rules enforce uid matching
**When** a user tries to create a linked account from the client
**Then** the operation is rejected by security rules
**When** a user tries to modify another user's account
**Then** the operation is rejected by security rules

### AC12: Error Handling

**Given** a Plaid sync fails with an error
**When** the error occurs
**Then** the institution status is set to InstitutionError
**And** the error code is stored in the institution document
**And** account balances are not updated
**And** the user sees an error banner with appropriate action (Retry/Reconnect/Remove)
**And** the last successful cursor is preserved


## User Stories

### US1: View Net Worth

**As a** user
**I want to** see my total net worth in one place
**So that** I can understand my overall financial position

**Acceptance Criteria:**
- Net worth is prominently displayed at the top of the page
- Assets and liabilities are clearly separated and totaled
- All accounts (linked and manual) are included in the calculation
- The page updates in real-time when account balances change

### US2: Create Manual Account

**As a** user
**I want to** add manual accounts that aren't linked to Plaid
**So that** I can track all my assets and liabilities in one place

**Acceptance Criteria:**
- I can click a button to add a manual account
- I can specify the account name, type, and initial balance
- The account appears immediately in the appropriate section
- My net worth updates to include the new account

### US3: Update Manual Account Balance

**As a** user
**I want to** update the balance of my manual accounts
**So that** my net worth stays accurate over time

**Acceptance Criteria:**
- I can edit the balance of any manual account
- The change is reflected immediately in the UI
- My net worth recalculates automatically
- Linked funds (if any) show the updated balance

### US4: Rename Accounts

**As a** user
**I want to** give my accounts custom nicknames
**So that** I can identify them more easily

**Acceptance Criteria:**
- I can set a nickname for any account (linked or manual)
- The nickname is displayed instead of the original account name
- I can clear the nickname to revert to the original name
- Nicknames work for both Plaid-linked and manual accounts

### US5: Link Accounts to Funds

**As a** user
**I want to** link my accounts to saving/investment funds
**So that** I can track progress toward my financial goals

**Acceptance Criteria:**
- I can link any account to a fund
- The fund automatically shows the account balance
- The account card shows which fund it's linked to
- I can unlink the account from the fund

### US6: See Sync Status

**As a** user
**I want to** see when my linked accounts were last synced
**So that** I know how current my data is

**Acceptance Criteria:**
- Each linked account shows "Last synced: X hours ago"
- Manual accounts show "Manual account" label
- Sync errors are clearly displayed with actionable guidance
- I can trigger a refresh to sync all accounts

### US7: Organize by Account Type

**As a** user
**I want to** see my accounts grouped by type
**So that** I can understand my financial breakdown

**Acceptance Criteria:**
- Accounts are grouped into Assets and Liabilities sections
- Within each section, accounts are grouped by type (checking, savings, etc.)
- Each group shows a subtotal
- The grouping is automatic based on account type

### US8: Delete Manual Accounts

**As a** user
**I want to** delete manual accounts I no longer need
**So that** my net worth view stays clean and accurate

**Acceptance Criteria:**
- I can delete any manual account
- I'm asked to confirm before deletion
- The account is removed immediately from the UI
- My net worth recalculates without the deleted account
- Linked funds are automatically unlinked

### US9: Mobile Access

**As a** user
**I want to** view and manage my net worth on my mobile device
**So that** I can check my finances on the go

**Acceptance Criteria:**
- The page is fully responsive on mobile devices
- All actions are accessible and touch-friendly
- The layout adapts appropriately to screen size
- The experience is smooth and native-feeling (via Capacitor)

### US10: Understand Migration

**As a** user
**I want to** have my existing accounts migrated seamlessly
**So that** I don't lose any data or have to re-enter information

**Acceptance Criteria:**
- All my existing Plaid accounts are preserved
- All my existing transactions still reference the correct accounts
- All my existing funds still work correctly
- The migration happens automatically without my intervention
- I'm notified if any issues occur during migration


## Dependencies and Constraints

### Dependencies

**Frontend:**
- React 19 with TypeScript
- @tanstack/react-query for data fetching
- Firebase SDK for Firestore access
- Tailwind CSS v4 for styling
- lucide-react for icons
- Existing authentication system

**Backend:**
- Firebase Cloud Functions (Node 20)
- Plaid Node SDK
- Google Cloud Secret Manager
- Firebase Admin SDK

**Shared:**
- @easy-csp/shared-types package (updated with new interfaces)

### Constraints

**Technical Constraints:**
- Must maintain backward compatibility during migration
- Cannot break existing Plaid sync functionality
- Must preserve all existing data (zero data loss)
- Firestore security rules must prevent unauthorized access
- Must work with existing Firebase emulator setup

**Business Constraints:**
- Migration must complete within maintenance window
- No downtime for users during migration
- Must support rollback if migration fails
- Must maintain existing user workflows

**Design Constraints:**
- Must follow existing UI patterns and design system
- Must be responsive (mobile, tablet, desktop)
- Must use Tailwind CSS v4 (no custom CSS)
- Must use single components with responsive classes (no duplication)

**Performance Constraints:**
- Page load time < 500ms (p95)
- Support up to 50 accounts per user
- Real-time updates < 100ms latency
- Sync completion < 5s for 5 accounts

## Out of Scope

The following features are explicitly out of scope for this initial release:

1. **Net Worth History Tracking** - Storing historical snapshots over time
2. **Multi-Currency Support** - Accounts in different currencies
3. **Account Sharing** - Sharing accounts with other users
4. **Advanced Reporting** - Charts, graphs, export to PDF
5. **Account Categories/Tags** - Custom categorization beyond standard types
6. **Bulk Operations** - Bulk editing multiple accounts at once
7. **Smart Insights** - AI-powered financial recommendations
8. **Account Goals** - Setting target balances for accounts
9. **Liability Payoff Projections** - Calculating payoff timelines
10. **Household Net Worth** - Combining multiple users' net worth

These features may be considered for future phases after the core functionality is stable and validated with users.

## Success Criteria

This feature will be considered successful when:

1. **Migration Complete**: All existing accounts migrated to top-level collection with zero data loss
2. **User Adoption**: 70%+ of active users view Net Worth page within first month
3. **Manual Accounts**: 30%+ of users create at least one manual account
4. **Performance**: Page load time < 500ms (p95) and sync time < 5s (p95)
5. **Reliability**: 99.9%+ uptime and <1% error rate
6. **User Satisfaction**: 4.5+/5 rating for feature usefulness
7. **No Regressions**: Existing Plaid sync, funds, and transactions continue working correctly

## Glossary

- **Account**: A financial account (checking, savings, credit card, etc.) that holds money
- **Linked Account**: An account connected via Plaid that syncs automatically
- **Manual Account**: A user-created account with manually updated balance
- **Net Worth**: Total assets minus total liabilities
- **Asset**: An account with positive value (checking, savings, investment, other)
- **Liability**: An account with negative value (credit card debt, loans)
- **Fund**: A saving or investment goal that can be linked to an account
- **Institution**: A financial institution (bank, credit union, etc.) connected via Plaid
- **Plaid**: Third-party service for connecting to financial institutions
- **Sync**: Process of updating account balances and transactions from Plaid
- **Migration**: One-time process of moving accounts from nested arrays to top-level collection
- **Firestore**: Google Cloud's NoSQL database used for data storage
- **Cloud Function**: Serverless backend function that runs in response to events
