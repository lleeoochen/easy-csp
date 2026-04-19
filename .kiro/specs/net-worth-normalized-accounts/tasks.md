# Tasks: Net Worth Page with Normalized Accounts

## 1. Update Shared Types Package

- [x] 1.1 Update Account interface in firestore.types.ts
  - [x] 1.1.1 Add new Account interface with top-level fields
  - [x] 1.1.2 Add isManual, nickname, targetAmount fields
  - [x] 1.1.3 Add Plaid metadata fields (plaidInstitutionId, institutionName, plaidAccountId, lastSyncTimestamp)
  - [x] 1.1.4 Update JSDoc comments with field descriptions

- [x] 1.2 Update FinancialInstitution interface
  - [x] 1.2.1 Remove accounts array field
  - [x] 1.2.2 Update JSDoc to clarify it's sync metadata only

- [x] 1.3 Update Transaction interface
  - [x] 1.3.1 Update accountId field comment to reference top-level account
  - [x] 1.3.2 Remove institutionId field
  - [x] 1.3.3 Remove fundId field (no longer needed)

- [x] 1.4 Remove Fund interface and related types
  - [x] 1.4.1 Remove Fund interface from firestore.types.ts
  - [x] 1.4.2 Remove FundType enum
  - [x] 1.4.3 Remove FUNDS_COLLECTION constant
  - [x] 1.4.4 Update exports in index.ts

- [x] 1.5 Add ACCOUNTS_COLLECTION constant
  - [x] 1.5.1 Add export const ACCOUNTS_COLLECTION = 'accounts'

- [x] 1.6 Add UI types for Net Worth page
  - [x] 1.6.1 Add UI_AccountWithInstitution interface (with targetAmount and progressPercentage)
  - [x] 1.6.2 Add NetWorthSummary interface

- [x] 1.7 Build and pack shared types
  - [x] 1.7.1 Run npm run install:special in easy-csp
  - [x] 1.7.2 Run npm run install:special in easy-csp-cloud/functions


## 2. Create Migration Cloud Function

- [x] 2.1 Create migration function file
  - [x] 2.1.1 Create functions/src/migration/migrateAccountsToTopLevel.ts
  - [x] 2.1.2 Add function signature and exports

- [x] 2.2 Implement account migration logic
  - [x] 2.2.1 Query all financialInstitutions for user
  - [x] 2.2.2 For each institution, extract nested accounts
  - [x] 2.2.3 Create top-level account document for each nested account
  - [x] 2.2.4 Set isManual=false and populate Plaid metadata
  - [x] 2.2.5 Use batch writes for performance

- [x] 2.3 Implement transaction reference updates
  - [x] 2.3.1 Query transactions by institutionId + accountId
  - [x] 2.3.2 Update accountId to reference new top-level account
  - [x] 2.3.3 Remove institutionId field using deleteField()
  - [x] 2.3.4 Use batch writes for performance

- [x] 2.4 Implement CSP savings/investment reference updates
  - [x] 2.4.1 Query CSP savings/investments that reference fundId
  - [x] 2.4.2 For each CSP entity, find the account that the fund was linked to
  - [x] 2.4.3 Update CSP entity to reference accountId instead of fundId
  - [x] 2.4.4 Use batch writes for performance

- [x] 2.5 Remove Fund collection
  - [x] 2.5.1 After all CSP references updated, delete Fund documents
  - [x] 2.5.2 Verify no remaining references to funds

- [x] 2.6 Remove accounts array from institutions
  - [x] 2.6.1 Update institution documents to remove accounts field
  - [x] 2.6.2 Use deleteField() for proper removal

- [x] 2.7 Add validation and error handling
  - [x] 2.7.1 Validate account count before/after migration
  - [x] 2.7.2 Validate all transactions have valid account references
  - [x] 2.7.3 Validate all CSP entities have valid account references
  - [x] 2.7.4 Log errors with context (user, account, etc.)
  - [x] 2.7.5 Support resuming from failure point

- [x] 2.8 Add migration progress tracking
  - [x] 2.8.1 Log migration start/end for each user
  - [x] 2.8.2 Track accounts migrated count
  - [x] 2.8.3 Track transactions updated count
  - [x] 2.8.4 Track CSP entities updated count

- [x] 2.9 Test migration with emulator
  - [x] 2.9.1 Create test data with nested accounts
  - [x] 2.9.2 Run migration function
  - [x] 2.9.3 Verify all accounts migrated correctly
  - [x] 2.9.4 Verify all references updated correctly
  - [x] 2.9.5 Verify no data loss


## 3. Update Firestore Security Rules

- [x] 3.1 Add accounts collection rules
  - [x] 3.1.1 Add read rule (user can read own accounts)
  - [x] 3.1.2 Add create rule (user can create manual accounts only)
  - [x] 3.1.3 Add update rule (user can update own manual accounts)
  - [x] 3.1.4 Add delete rule (user can delete own manual accounts)
  - [x] 3.1.5 Prevent modification of isManual flag
  - [x] 3.1.6 Prevent modification of Plaid metadata by client

- [x] 3.2 Update transactions collection rules
  - [x] 3.2.1 Update to reference top-level accountId
  - [x] 3.2.2 Remove institutionId validation
  - [x] 3.2.3 Remove fundId validation (no longer needed)

- [x] 3.3 Remove funds collection rules
  - [x] 3.3.1 Remove all fund-related security rules (funds collection being removed)

- [x] 3.4 Test security rules with emulator
  - [x] 3.4.1 Test user can read own accounts
  - [x] 3.4.2 Test user cannot read other users' accounts
  - [x] 3.4.3 Test user can create manual accounts
  - [x] 3.4.4 Test user cannot create linked accounts
  - [x] 3.4.5 Test user can update own manual accounts
  - [x] 3.4.6 Test user cannot update linked accounts
  - [x] 3.4.7 Test user cannot modify isManual flag

## 4. Create Firestore Indexes

- [x] 4.1 Add accounts collection indexes
  - [x] 4.1.1 Add composite index: uid ASC, accountType ASC, accountName ASC
  - [x] 4.1.2 Add composite index: uid ASC, plaidInstitutionId ASC, plaidAccountId ASC
  - [x] 4.1.3 Add composite index: uid ASC, isManual ASC

- [x] 4.2 Update firestore.indexes.json
  - [x] 4.2.1 Add index definitions to file
  - [x] 4.2.2 Deploy indexes to Firebase

- [ ] 4.3 Test index performance
  - [ ] 4.3.1 Query accounts by uid and accountType
  - [ ] 4.3.2 Query accounts by uid and plaidInstitutionId
  - [ ] 4.3.3 Verify queries use indexes (not full collection scan)


## 5. Update Plaid Sync Cloud Function

- [x] 5.1 Update sync function to write to accounts collection
  - [x] 5.1.1 Query accounts by plaidInstitutionId + plaidAccountId
  - [x] 5.1.2 Update existing account balance if found
  - [x] 5.1.3 Create new account if not found
  - [x] 5.1.4 Update lastSyncTimestamp on account

- [x] 5.2 Update transaction creation
  - [x] 5.2.1 Find account by plaidInstitutionId + plaidAccountId
  - [x] 5.2.2 Create transaction with top-level accountId
  - [x] 5.2.3 Remove institutionId field

- [x] 5.3 Update institution metadata
  - [x] 5.3.1 Update cursor after successful sync
  - [x] 5.3.2 Update lastSyncTimestamp
  - [x] 5.3.3 Update status to Active or InstitutionError
  - [x] 5.3.4 Do not update accounts array (removed)

- [x] 5.4 Add error handling
  - [x] 5.4.1 Handle Plaid API errors
  - [x] 5.4.2 Set institution status to InstitutionError
  - [x] 5.4.3 Store plaidErrorCode in institution
  - [x] 5.4.4 Preserve last successful cursor

- [ ] 5.5 Test sync with emulator
  - [ ] 5.5.1 Mock Plaid API responses
  - [ ] 5.5.2 Verify accounts are created/updated correctly
  - [ ] 5.5.3 Verify transactions reference correct accounts
  - [ ] 5.5.4 Verify error handling works

## 6. Update Plaid Exchange Cloud Function

- [x] 6.1 Update to create accounts in top-level collection
  - [x] 6.1.1 After token exchange, get account data from Plaid
  - [x] 6.1.2 Create account documents in accounts/ collection
  - [x] 6.1.3 Set isManual=false and populate Plaid metadata
  - [x] 6.1.4 Do not add accounts array to institution

- [ ] 6.2 Test exchange with emulator
  - [ ] 6.2.1 Mock Plaid token exchange
  - [ ] 6.2.2 Verify accounts are created correctly
  - [ ] 6.2.3 Verify institution is created without accounts array


## 7. Create Frontend Account Service

- [x] 7.1 Create AccountService class
  - [x] 7.1.1 Create src/services/accountService.ts
  - [x] 7.1.2 Add getAuthenticatedUserId helper

- [x] 7.2 Implement listAccounts method
  - [x] 7.2.1 Query accounts collection by uid
  - [x] 7.2.2 Return array of accounts

- [x] 7.3 Implement getAccountsWithInstitutionInfo method
  - [x] 7.3.1 Query accounts by uid
  - [x] 7.3.2 Query financial institutions by uid
  - [x] 7.3.3 Join data to create UI_AccountWithInstitution objects
  - [x] 7.3.4 Include sync status from institution
  - [x] 7.3.5 Calculate progress percentage if targetAmount is set

- [x] 7.4 Implement createManualAccount method
  - [x] 7.4.1 Validate inputs (name, type, balance)
  - [x] 7.4.2 Create account document with isManual=true
  - [x] 7.4.3 Use withoutUndefinedValue for addDoc
  - [x] 7.4.4 Return new account ID

- [x] 7.5 Implement updateAccountNickname method
  - [x] 7.5.1 Verify account exists and belongs to user
  - [x] 7.5.2 Update nickname field
  - [x] 7.5.3 Use prepareFirestoreData for updateDoc
  - [x] 7.5.4 Support clearing nickname (set to null)

- [x] 7.6 Implement updateManualAccountBalance method
  - [x] 7.6.1 Verify account exists and belongs to user
  - [x] 7.6.2 Verify account is manual (isManual=true)
  - [x] 7.6.3 Update balance field
  - [x] 7.6.4 Use prepareFirestoreData for updateDoc

- [x] 7.7 Implement updateAccountTargetAmount method
  - [x] 7.7.1 Verify account exists and belongs to user
  - [x] 7.7.2 Validate targetAmount is positive number or null
  - [x] 7.7.3 Update targetAmount field (or remove if null)
  - [x] 7.7.4 Use prepareFirestoreData for updateDoc

- [x] 7.8 Implement deleteManualAccount method
  - [x] 7.8.1 Verify account exists and belongs to user
  - [x] 7.8.2 Verify account is manual (isManual=true)
  - [x] 7.8.3 Verify no transactions reference this account
  - [x] 7.8.4 Delete account document

- [ ] 7.9 Add unit tests for AccountService
  - [ ] 7.9.1 Test createManualAccount
  - [ ] 7.9.2 Test updateAccountNickname
  - [ ] 7.9.3 Test updateManualAccountBalance
  - [ ] 7.9.4 Test updateAccountTargetAmount
  - [ ] 7.9.5 Test deleteManualAccount
  - [ ] 7.9.6 Test error cases (unauthorized, not found, etc.)


## 8. Create React Query Hooks for Accounts

- [x] 8.1 Create useAccounts hook
  - [x] 8.1.1 Create src/hooks/api/useAccounts.ts
  - [x] 8.1.2 Use useQuery with AccountService.listAccounts
  - [x] 8.1.3 Set appropriate staleTime and cacheTime

- [x] 8.2 Create useAccountsWithInfo hook
  - [x] 8.2.1 Use useQuery with AccountService.getAccountsWithInstitutionInfo
  - [x] 8.2.2 Return UI_AccountWithInstitution array

- [x] 8.3 Create useCreateManualAccount hook
  - [x] 8.3.1 Use useMutation with AccountService.createManualAccount
  - [x] 8.3.2 Invalidate accounts query on success

- [x] 8.4 Create useUpdateAccountNickname hook
  - [x] 8.4.1 Use useMutation with AccountService.updateAccountNickname
  - [x] 8.4.2 Invalidate accounts query on success

- [ ] 8.5 Create useUpdateManualAccountBalance hook
  - [x] 8.5.1 Use useMutation with AccountService.updateManualAccountBalance
  - [x] 8.5.2 Invalidate accounts queries on success

- [-] 8.6 Create useUpdateAccountTargetAmount hook
  - [x] 8.6.1 Use useMutation with AccountService.updateAccountTargetAmount
  - [x] 8.6.2 Invalidate accounts queries on success

- [-] 8.7 Create useDeleteManualAccount hook
  - [x] 8.7.1 Use useMutation with AccountService.deleteManualAccount
  - [x] 8.7.2 Remove from cache on success using removeItemFromCache

## 9. Update CSP Services

- [~] 9.1 Update CSP savings service
  - [ ] 9.1.1 Remove fundId references
  - [ ] 9.1.2 Add accountId references
  - [ ] 9.1.3 Update queries to use accounts instead of funds

- [~] 9.2 Update CSP investments service
  - [ ] 9.2.1 Remove fundId references
  - [ ] 9.2.2 Add accountId references
  - [ ] 9.2.3 Update queries to use accounts instead of funds

- [ ] 9.3 Update unit tests for CSP services
  - [ ] 9.3.1 Update tests to use accountId
  - [ ] 9.3.2 Remove tests for fundId references


## 10. Update CSP Hooks

- [~] 10.1 Update CSP savings hooks
  - [ ] 10.1.1 Remove fundId parameter
  - [ ] 10.1.2 Use accountId parameter
  - [ ] 10.1.3 Remove fund lookup logic
  - [ ] 10.1.4 Get account info from accounts query

- [~] 10.2 Update CSP investments hooks
  - [ ] 10.2.1 Remove fundId parameter
  - [ ] 10.2.2 Use accountId parameter
  - [ ] 10.2.3 Remove fund lookup logic

## 11. Create Net Worth Utility Functions

- [x] 11.1 Create calculateNetWorth function
  - [x] 11.1.1 Create src/utils/netWorthUtils.ts
  - [x] 11.1.2 Implement calculateNetWorth(accounts: Account[]): NetWorthSummary
  - [x] 11.1.3 Categorize accounts by type (assets vs liabilities)
  - [x] 11.1.4 Sum balances for each category
  - [x] 11.1.5 Calculate net worth (assets - liabilities)

- [x] 11.2 Create account type helpers
  - [x] 11.2.1 Create isAssetAccount(accountType: AccountType): boolean
  - [x] 11.2.2 Create isLiabilityAccount(accountType: AccountType): boolean
  - [x] 11.2.3 Create getAccountTypeDisplay(accountType: AccountType): string

- [x] 11.3 Create account display helpers
  - [x] 11.3.1 Create getAccountDisplayName(account: Account): string (nickname || accountName)
  - [x] 11.3.2 Create formatCurrency(amount: number): string

- [ ] 11.4 Add unit tests for utility functions
  - [ ] 11.4.1 Test calculateNetWorth with various account combinations
  - [ ] 11.4.2 Test edge cases (empty accounts, all assets, all liabilities)
  - [ ] 11.4.3 Test account type helpers
  - [ ] 11.4.4 Test display helpers


## 12. Create Net Worth Page Components

- [~] 12.1 Create NetWorthPage component
  - [ ] 12.1.1 Create src/pages/netWorth/NetWorthPage.tsx
  - [ ] 12.1.2 Use Page component wrapper
  - [ ] 12.1.3 Use useAccountsWithInfo hook to fetch accounts
  - [ ] 12.1.4 Calculate net worth using calculateNetWorth utility
  - [ ] 12.1.5 Handle loading and error states
  - [ ] 12.1.6 Add "+ Manual" button in header

- [~] 12.2 Create NetWorthSummary component
  - [ ] 12.2.1 Create src/pages/netWorth/NetWorthSummary.tsx
  - [ ] 12.2.2 Display total net worth prominently
  - [ ] 12.2.3 Display total assets and liabilities
  - [ ] 12.2.4 Use color coding (green for positive, red for negative)
  - [ ] 12.2.5 Make responsive with Tailwind classes

- [~] 12.3 Create AccountCard component
  - [ ] 12.3.1 Create src/pages/netWorth/AccountCard.tsx
  - [ ] 12.3.2 Display account name (nickname if set)
  - [ ] 12.3.3 Display current balance with color coding
  - [ ] 12.3.4 Display institution name (for linked accounts)
  - [ ] 12.3.5 Display last sync time (for linked accounts)
  - [ ] 12.3.6 Display "Manual account" label (for manual accounts)
  - [ ] 12.3.7 Display target amount and progress bar (if targetAmount is set)
  - [ ] 12.3.8 Add action buttons (Edit, Set Goal, Delete)
  - [ ] 12.3.9 Make responsive with Tailwind classes

- [~] 12.4 Create AccountSection component
  - [ ] 12.4.1 Create src/pages/netWorth/AccountSection.tsx
  - [ ] 12.4.2 Accept title, accounts, and subtotal props
  - [ ] 12.4.3 Display section header with subtotal
  - [ ] 12.4.4 Group accounts by type
  - [ ] 12.4.5 Display AccountCard for each account
  - [ ] 12.4.6 Use responsive grid layout (1 col mobile, 2 col tablet, 3 col desktop)

- [~] 12.5 Create ManualAccountModal component
  - [ ] 12.5.1 Create src/pages/netWorth/ManualAccountModal.tsx
  - [ ] 12.5.2 Add form fields (account name, type, initial balance, nickname)
  - [ ] 12.5.3 Add validation (required fields, valid balance)
  - [ ] 12.5.4 Use useCreateManualAccount hook
  - [ ] 12.5.5 Show success/error toast
  - [ ] 12.5.6 Close modal on success

- [~] 12.6 Create AccountNicknameModal component
  - [ ] 12.6.1 Create src/pages/netWorth/AccountNicknameModal.tsx
  - [ ] 12.6.2 Add nickname input field
  - [ ] 12.6.3 Support clearing nickname
  - [ ] 12.6.4 Use useUpdateAccountNickname hook
  - [ ] 12.6.5 Show success/error toast
  - [ ] 12.6.6 Close modal on success

- [~] 12.7 Create TargetAmountModal component
  - [ ] 12.7.1 Create src/pages/netWorth/TargetAmountModal.tsx
  - [ ] 12.7.2 Add target amount input field
  - [ ] 12.7.3 Validate target amount is positive number
  - [ ] 12.7.4 Support clearing target amount
  - [ ] 12.7.5 Use useUpdateAccountTargetAmount hook
  - [ ] 12.7.6 Show success/error toast
  - [ ] 12.7.7 Close modal on success

- [~] 12.8 Add responsive styling
  - [ ] 12.9.1 Use mobile-first Tailwind classes
  - [ ] 12.9.2 Test on mobile (< 768px)
  - [ ] 12.9.3 Test on tablet (768px - 1024px)
  - [ ] 12.9.4 Test on desktop (> 1024px)
  - [ ] 12.9.5 Ensure touch targets are 44x44px minimum
  - [ ] 12.9.6 Verify no component duplication for different screen sizes


## 13. Update Existing Pages

- [~] 13.1 Update CSP Pages
  - [ ] 13.1.1 Update to use new account-based model
  - [ ] 13.1.2 Display account name and institution for linked accounts
  - [ ] 13.1.3 Remove fund selector (use account selector)
  - [ ] 13.1.4 Update CSP creation flow
  - [ ] 13.1.5 Update CSP editing flow

- [~] 13.2 Update FinancialInstitutionsPage
  - [ ] 13.2.1 Remove account display (accounts now on Net Worth page)
  - [ ] 13.2.2 Show only sync status and institution info
  - [ ] 13.2.3 Keep error handling and reconnect flow
  - [ ] 13.2.4 Add link to Net Worth page to view accounts

- [~] 13.3 Update TransactionsPage (if needed)
  - [ ] 13.3.1 Verify transactions display correctly with new account references
  - [ ] 13.3.2 Update account filtering if needed

## 14. Add Navigation

- [~] 14.1 Add Net Worth route
  - [ ] 14.1.1 Add route to router configuration
  - [ ] 14.1.2 Set path to /net-worth

- [~] 14.2 Add Net Worth navigation link
  - [ ] 14.2.1 Add to main navigation menu
  - [ ] 14.2.2 Add icon (lucide-react)
  - [ ] 14.2.3 Position prominently (e.g., first in menu)

- [~] 14.3 Update home page (if applicable)
  - [ ] 14.3.1 Add Net Worth card/link to dashboard

## 15. Add Real-Time Updates

- [~] 15.1 Set up Firestore real-time listener for accounts
  - [ ] 15.1.1 Use onSnapshot in useAccountsWithInfo hook
  - [ ] 15.1.2 Filter by uid
  - [ ] 15.1.3 Update React Query cache on changes

- [~] 15.2 Optimize real-time updates
  - [ ] 15.2.1 Debounce rapid updates during sync
  - [ ] 15.2.2 Show loading indicator during updates
  - [ ] 15.2.3 Recalculate net worth automatically

- [ ] 15.3 Test real-time updates
  - [ ] 15.3.1 Update account balance in Firestore console
  - [ ] 15.3.2 Verify UI updates within 100ms
  - [ ] 15.3.3 Verify net worth recalculates


## 16. Testing

- [ ] 16.1 Unit tests for services
  - [ ] 16.1.1 Test AccountService methods
  - [ ] 16.1.2 Test updated FundService methods
  - [ ] 16.1.3 Test net worth calculation utilities
  - [ ] 16.1.4 Achieve 80%+ code coverage

- [ ] 16.2 Property-based tests
  - [ ] 16.2.1 Install fast-check if not already installed
  - [ ] 16.2.2 Test net worth calculation invariants
  - [ ] 16.2.3 Test account balance update idempotency
  - [ ] 16.2.4 Test target amount validation properties
  - [ ] 16.2.5 Test migration completeness properties

- [ ] 16.3 Integration tests
  - [ ] 16.3.1 Test account creation and retrieval with Firestore emulator
  - [ ] 16.3.2 Test Plaid sync with mocked Plaid API
  - [ ] 16.3.3 Test target amount updates
  - [ ] 16.3.4 Test migration with test data

- [ ] 16.4 End-to-end tests
  - [ ] 16.4.1 Test complete user flow: link institution → view accounts → create manual account
  - [ ] 16.4.2 Test target amount setting flow end-to-end
  - [ ] 16.4.3 Test account deletion flow
  - [ ] 16.4.4 Test responsive design on different screen sizes

- [ ] 16.5 Manual testing
  - [ ] 16.5.1 Test on Chrome desktop
  - [ ] 16.5.2 Test on Firefox desktop
  - [ ] 16.5.3 Test on Safari mobile (iOS)
  - [ ] 16.5.4 Test on Chrome mobile (Android)
  - [ ] 16.5.5 Test with Capacitor on Android emulator (optional)
  - [ ] 16.5.6 Test with Capacitor on iOS simulator (optional, if Mac available)

## 17. Migration Execution

- [~] 17.1 Prepare for migration
  - [ ] 17.1.1 Backup production Firestore data
  - [ ] 17.1.2 Test migration on staging environment
  - [ ] 17.1.3 Validate migrated data on staging
  - [ ] 17.1.4 Prepare rollback plan

- [~] 17.2 Execute migration
  - [ ] 17.2.1 Schedule maintenance window (if needed)
  - [ ] 17.2.2 Run migration Cloud Function
  - [ ] 17.2.3 Monitor progress with Cloud Logging
  - [ ] 17.2.4 Validate migrated data

- [~] 17.3 Post-migration validation
  - [ ] 17.3.1 Verify account count matches before/after
  - [ ] 17.3.2 Verify all transactions have valid account references
  - [ ] 17.3.3 Verify all CSP entities have valid account references
  - [ ] 17.3.4 Verify no data loss
  - [ ] 17.3.5 Test key user flows

- [~] 17.4 Cleanup
  - [ ] 17.4.1 Remove accounts array from institution documents (if not done by migration)
  - [ ] 17.4.2 Update Firestore security rules
  - [ ] 17.4.3 Deploy updated Cloud Functions
  - [ ] 17.4.4 Deploy updated frontend


## 18. Deployment

- [~] 18.1 Deploy Cloud Functions
  - [ ] 18.1.1 Deploy updated Plaid sync function
  - [ ] 18.1.2 Deploy updated Plaid exchange function
  - [ ] 18.1.3 Deploy migration function (if not already run)
  - [ ] 18.1.4 Verify functions are running correctly

- [~] 18.2 Deploy Firestore security rules
  - [ ] 18.2.1 Deploy updated security rules
  - [ ] 18.2.2 Verify rules are enforced correctly

- [~] 18.3 Deploy Firestore indexes
  - [ ] 18.3.1 Deploy index definitions
  - [ ] 18.3.2 Wait for indexes to build
  - [ ] 18.3.3 Verify indexes are being used

- [~] 18.4 Deploy frontend
  - [ ] 18.4.1 Build production bundle
  - [ ] 18.4.2 Deploy to hosting (gh-pages or Firebase Hosting)
  - [ ] 18.4.3 Verify deployment is live
  - [ ] 18.4.4 Test key user flows on production

- [~] 18.5 Monitor deployment
  - [ ] 18.5.1 Monitor Cloud Functions logs for errors
  - [ ] 18.5.2 Monitor Firestore usage and performance
  - [ ] 18.5.3 Monitor frontend error tracking
  - [ ] 18.5.4 Monitor user feedback

## 19. Documentation

- [~] 19.1 Update developer documentation
  - [ ] 19.1.1 Document new Account data model
  - [ ] 19.1.2 Document migration process
  - [ ] 19.1.3 Document AccountService API
  - [ ] 19.1.4 Update architecture diagrams

- [~] 19.2 Create user documentation
  - [ ] 19.2.1 Write user guide for Net Worth page
  - [ ] 19.2.2 Write guide for creating manual accounts
  - [ ] 19.2.3 Write guide for linking accounts to funds
  - [ ] 19.2.4 Create FAQ for common questions

- [~] 19.3 Update README files
  - [ ] 19.3.1 Update main README with Net Worth feature
  - [ ] 19.3.2 Update shared-types README with new interfaces

## 20. Post-Launch

- [~] 20.1 Monitor metrics
  - [ ] 20.1.1 Track Net Worth page views
  - [ ] 20.1.2 Track manual account creation rate
  - [ ] 20.1.3 Track target amount usage rate
  - [ ] 20.1.4 Track page load performance
  - [ ] 20.1.5 Track error rates

- [~] 20.2 Gather user feedback
  - [ ] 20.2.1 Add feedback form to Net Worth page
  - [ ] 20.2.2 Monitor support requests
  - [ ] 20.2.3 Conduct user interviews (optional)
  - [ ] 20.2.4 Analyze usage patterns

- [~] 20.3 Iterate based on feedback
  - [ ] 20.3.1 Prioritize bug fixes
  - [ ] 20.3.2 Prioritize UX improvements
  - [ ] 20.3.3 Consider future enhancements
  - [ ] 20.3.4 Plan next iteration

- [~] 20.4 Performance optimization
  - [ ] 20.4.1 Optimize slow queries
  - [ ] 20.4.2 Add caching where appropriate
  - [ ] 20.4.3 Optimize bundle size
  - [ ] 20.4.4 Improve real-time update performance

## 21. Optional: Capacitor Mobile Enhancements

- [ ] 21.1 Add haptic feedback (optional)
  - [ ] 21.1.1 Install @capacitor/haptics if not already installed
  - [ ] 21.1.2 Add haptic feedback on button presses
  - [ ] 21.1.3 Add haptic feedback on success/error actions
  - [ ] 21.1.4 Test on Android device
  - [ ] 21.1.5 Test on iOS device (if available)

- [ ] 21.2 Add pull-to-refresh (optional)
  - [ ] 21.2.1 Implement pull-to-refresh for account sync
  - [ ] 21.2.2 Use native pull-to-refresh on mobile
  - [ ] 21.2.3 Test on Android device
  - [ ] 21.2.4 Test on iOS device (if available)

- [ ] 21.3 Test on mobile platforms (optional)
  - [ ] 21.3.1 Build Android app with Capacitor
  - [ ] 21.3.2 Test Net Worth page on Android
  - [ ] 21.3.3 Build iOS app with Capacitor (if Mac available)
  - [ ] 21.3.4 Test Net Worth page on iOS
  - [ ] 21.3.5 Verify all features work on mobile

## Summary

Total estimated tasks: ~180+ individual tasks across 21 major sections

Estimated timeline: 4-5 weeks for full implementation (simplified from original due to Fund removal)

Critical path:
1. Update shared types (Week 1)
2. Create migration function (Week 1-2)
3. Update Cloud Functions (Week 2)
4. Create frontend services (Week 3)
5. Build UI components (Week 3-4)
6. Execute migration and deploy (Week 4-5)
7. Monitor and iterate (Week 5+)

Key simplifications from original design:
- No Fund collection to manage
- No fund linkage logic needed
- Simpler migration (no manual fund conversion)
- Fewer UI components (no fund linkage modals)
- Direct goal tracking via Account.targetAmount
