import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  ACCOUNTS_COLLECTION,
  FINANCIAL_INSTITUTIONS_COLLECTION,
  TRANSACTIONS_COLLECTION,
  AccountType,
  CSPBucket,
} from "@easy-csp/shared-types";
import type {
  FinancialAccount,
  FinancialInstitution,
} from "@easy-csp/shared-types";
import type { UI_FinancialAccount } from "../types/uiTypes";
import { prepareFirestoreData, withoutUndefinedValue } from "../utils/firestoreHelpers";

/**
 * Service for managing user accounts (both manual and Plaid-linked)
 *
 * This service provides methods for:
 * - Creating and managing manual accounts
 * - Updating account nicknames and balances
 *
 * All methods require user authentication and enforce user ownership via uid.
 */
export class AccountService {
  /**
   * Gets the authenticated user's ID
   *
   * @returns User ID (uid)
   * @throws Error if user is not authenticated
   */
  private static getAuthenticatedUserId(): string {
    const auth = getAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) {
      throw new Error("User not authenticated");
    }
    return uid;
  }

  /**
   * Lists all accounts for the authenticated user
   *
   * Returns all accounts (both manual and Plaid-linked) owned by the current user.
   * Accounts are returned as-is from Firestore without additional denormalization.
   *
   * @returns Promise resolving to array of Account objects
   * @throws Error if user is not authenticated
   *
   * @example
   * const accounts = await AccountService.listAccounts();
   * console.log(`User has ${accounts.length} accounts`);
   */
  static async listAccounts(): Promise<FinancialAccount[]> {
    const uid = this.getAuthenticatedUserId();
    const firestore = getFirestore();

    // Query accounts collection by uid
    const accountsQuery = query(
      collection(firestore, ACCOUNTS_COLLECTION),
      where("uid", "==", uid)
    );

    const accountsSnapshot = await getDocs(accountsQuery);

    // Map Firestore documents to FinancialAccount objects
    const accounts: FinancialAccount[] = accountsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as FinancialAccount));

    return accounts;
  }

  /**
   * Gets all accounts with denormalized institution information
   *
   * This method queries accounts and financial institutions, then joins
   * the data to create UI_FinancialAccount objects suitable for display
   * in the Net Worth page and other UI components.
   *
   * For linked accounts (isManual === false):
   * - Includes sync status from the associated financial institution
   * - Includes institution name and last sync timestamp
   * - Includes error information if sync failed
   *
   * For manual accounts (isManual === true):
   * - No institution information (all institution fields undefined)
   *
   * For all accounts:
   * - Computes displayName as nickname || accountName
   *
   * @returns Promise resolving to array of UI_FinancialAccount objects
   * @throws Error if user is not authenticated
   *
   * @example
   * const accountsWithInfo = await AccountService.getAccountsWithInstitutionInfo();
   * accountsWithInfo.forEach(account => {
   *   console.log(`${account.displayName}: $${account.balance}`);
   *   if (account.institutionName) {
   *     console.log(`  Institution: ${account.institutionName}`);
   *   }
   * });
   */
  static async getAccountsWithInstitutionInfo(): Promise<UI_FinancialAccount[]> {
    const uid = this.getAuthenticatedUserId();
    const firestore = getFirestore();

    // Step 1: Query accounts by uid
    const accountsQuery = query(
      collection(firestore, ACCOUNTS_COLLECTION),
      where("uid", "==", uid)
    );
    const accountsSnapshot = await getDocs(accountsQuery);
    const accounts: FinancialAccount[] = accountsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as FinancialAccount));

    // Step 2: Query financial institutions by uid
    const institutionsQuery = query(
      collection(firestore, FINANCIAL_INSTITUTIONS_COLLECTION),
      where("uid", "==", uid)
    );
    const institutionsSnapshot = await getDocs(institutionsQuery);
    const institutions: Map<string, FinancialInstitution> = new Map();
    institutionsSnapshot.docs.forEach((doc) => {
      const institution = { docId: doc.id, ...doc.data() } as FinancialInstitution;
      // Map by institutionId (Plaid Item ID) for efficient lookup
      institutions.set(institution.institutionId, institution);
    });

    // Step 3: Join data to create UI_FinancialAccount objects
    const accountsWithInfo: UI_FinancialAccount[] = accounts.map((account) => {
      // Base account data
      const accountWithInfo: UI_FinancialAccount = {
        id: account.id,
        accountId: account.accountId,
        accountName: account.accountName,
        nickname: account.nickname,
        displayName: account.nickname || account.accountName,
        accountType: account.accountType,
        balance: account.balance,
        isManual: account.isManual,
        isFundAccount: account.isFundAccount,
        lastSyncTimestamp: account.lastSyncTimestamp,
      };

      // Step 4: Include sync status from institution (for linked accounts)
      if (!account.isManual && account.institutionId) {
        const institution = institutions.get(account.institutionId);
        if (institution) {
          accountWithInfo.institutionId = account.institutionId;
          accountWithInfo.institutionName = account.institutionName;
          accountWithInfo.syncStatus = institution.status;
          accountWithInfo.syncError = institution.plaidErrorCode;
        }
      }

      return accountWithInfo;
    });

    return accountsWithInfo;
  }

  /**
   * Creates a new manual account for the authenticated user
   *
   * Manual accounts are user-created accounts that are not linked to Plaid.
   * They allow users to track accounts that cannot be linked automatically
   * (e.g., cash, cryptocurrency, foreign banks, etc.).
   *
   * The method validates inputs, creates the account document with isManual=true,
   * and returns the new account ID for immediate use.
   *
   * @param accountName - Display name for the account (required, non-empty)
   * @param accountType - Type of account (checking, savings, credit, investment, loan, other)
   * @param initialBalance - Starting balance for the account (required, must be valid number)
   * @param nickname - Optional custom display name (can be set later via updateAccountNickname)
   * @returns Promise resolving to the new account's Firestore document ID
   * @throws Error if user is not authenticated
   * @throws Error if validation fails (empty name, invalid type, invalid balance)
   *
   * @example
   * // Create a manual savings account
   * const accountId = await AccountService.createManualAccount(
   *   "Emergency Account",
   *   AccountType.Savings,
   *   5000.00,
   *   "Rainy Day Account"
   * );
   * console.log(`Created account: ${accountId}`);
   *
   * @example
   * // Create a manual credit card account
   * const accountId = await AccountService.createManualAccount(
   *   "Amex Blue Cash",
   *   AccountType.Credit,
   *   -1250.50  // Negative balance for debt
   * );
   */
  static async createManualAccount(
    accountName: string,
    accountType: AccountType,
    initialBalance: number,
    nickname?: string
  ): Promise<string> {
    // Step 1: Validate inputs
    const uid = this.getAuthenticatedUserId();

    // Validate account name
    if (!accountName || accountName.trim().length === 0) {
      throw new Error("Account name is required and cannot be empty");
    }

    // Validate account type
    const validAccountTypes = Object.values(AccountType);
    if (!validAccountTypes.includes(accountType)) {
      throw new Error(
        `Invalid account type. Must be one of: ${validAccountTypes.join(", ")}`
      );
    }

    // Validate balance
    if (typeof initialBalance !== "number" || isNaN(initialBalance)) {
      throw new Error("Initial balance must be a valid number");
    }

    // Step 2: Create account document with isManual=true
    const firestore = getFirestore();

    // Generate a unique accountId for manual accounts
    // Use a timestamp-based ID to ensure uniqueness
    const manualAccountId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Set default isFundAccount value based on account type
    // Savings and investment accounts default to true (commonly used for fund tracking)
    // Other account types default to false
    const isFundAccount = accountType === AccountType.Savings || accountType === AccountType.Investment;

    // Prepare account data
    const accountData: Omit<FinancialAccount, "id"> = {
      uid,
      accountId: manualAccountId,
      accountName: accountName.trim(),
      nickname: nickname?.trim() || undefined,
      accountType,
      balance: initialBalance,
      isManual: true,
      isFundAccount: isFundAccount,
      // Plaid metadata fields are undefined for manual accounts
      institutionId: undefined,
      institutionName: undefined,
      lastSyncTimestamp: undefined,
    };

    // Step 3: Use withoutUndefinedValue for addDoc
    // This filters out undefined fields before writing to Firestore
    const docRef = await addDoc(
      collection(firestore, ACCOUNTS_COLLECTION),
      withoutUndefinedValue(accountData)
    );

    // Step 4: Return new account ID
    return docRef.id;
  }

  /**
   * Updates the nickname for an account (linked or manual)
   *
   * Nicknames allow users to customize the display name for any account.
   * This works for both Plaid-linked accounts and manual accounts.
   *
   * To clear a nickname and revert to the original account name, pass null
   * or undefined as the nickname parameter.
   *
   * @param accountId - Firestore document ID of the account to update
   * @param nickname - New nickname (string to set, null/undefined to clear)
   * @returns Promise that resolves when the update is complete
   * @throws Error if user is not authenticated
   * @throws Error if account does not exist
   * @throws Error if account does not belong to the authenticated user
   *
   * @example
   * // Set a nickname
   * await AccountService.updateAccountNickname("account123", "My Savings");
   *
   * @example
   * // Clear a nickname (revert to original account name)
   * await AccountService.updateAccountNickname("account123", null);
   */
  static async updateAccountNickname(
    accountId: string,
    nickname: string | null | undefined
  ): Promise<void> {
    // Step 1: Verify account exists and belongs to user
    const uid = this.getAuthenticatedUserId();
    const firestore = getFirestore();

    // Get the account document
    const accountRef = doc(firestore, ACCOUNTS_COLLECTION, accountId);
    const accountSnapshot = await getDoc(accountRef);

    // Verify account exists
    if (!accountSnapshot.exists()) {
      throw new Error(`Account with ID ${accountId} does not exist`);
    }

    // Verify account belongs to user
    const accountData = accountSnapshot.data() as FinancialAccount;
    if (accountData.uid !== uid) {
      throw new Error("Unauthorized: Account does not belong to the authenticated user");
    }

    // Step 2: Update nickname field
    // Step 3: Use prepareFirestoreData for updateDoc
    // Step 4: Support clearing nickname (set to null)
    // prepareFirestoreData converts undefined to deleteField()
    // This allows clearing the nickname by passing null or undefined
    await updateDoc(
      accountRef,
      prepareFirestoreData({
        nickname: nickname || undefined, // Convert null/empty string to undefined for deletion
      })
    );
  }
  /**
   * Updates the balance of a manual account
   *
   * This method allows users to update the balance of their manual accounts.
   * It only works for manual accounts (isManual === true). Plaid-linked accounts
   * cannot have their balance manually updated as they sync automatically.
   *
   * @param accountId - Firestore document ID of the account to update
   * @param newBalance - New balance value (must be a valid number)
   * @returns Promise that resolves when the update is complete
   * @throws Error if user is not authenticated
   * @throws Error if account does not exist
   * @throws Error if account does not belong to the authenticated user
   * @throws Error if account is not manual (isManual === false)
   * @throws Error if newBalance is not a valid number
   *
   * @example
   * // Update a manual savings account balance
   * await AccountService.updateManualAccountBalance("account123", 5500.00);
   *
   * @example
   * // Update a manual credit card balance (negative for debt)
   * await AccountService.updateManualAccountBalance("account456", -1250.50);
   */
  /**
   * Updates the balance of a manual account
   *
   * NOTE: This updates ONLY the account.balance field for manual accounts.
   * Fund allocations (transaction.allocatedFundId) are metadata for tracking
   * purposes and do NOT affect account balances. This method updates the
   * actual account balance as entered by the user.
   *
   * @param accountId - The Firestore document ID of the account
   * @param newBalance - The new balance value
   * @throws Error if account doesn't exist, doesn't belong to user, or is not manual
   *
   * @example
   * await AccountService.updateManualAccountBalance('account-123', 5000.00);
   */
  static async updateManualAccountBalance(
    accountId: string,
    newBalance: number
  ): Promise<void> {
    // Step 1: Verify account exists and belongs to user
    const uid = this.getAuthenticatedUserId();
    const firestore = getFirestore();

    // Get the account document
    const accountRef = doc(firestore, ACCOUNTS_COLLECTION, accountId);
    const accountSnapshot = await getDoc(accountRef);

    // Verify account exists
    if (!accountSnapshot.exists()) {
      throw new Error(`Account with ID ${accountId} does not exist`);
    }

    // Verify account belongs to user
    const accountData = accountSnapshot.data() as FinancialAccount;
    if (accountData.uid !== uid) {
      throw new Error("Unauthorized: Account does not belong to the authenticated user");
    }

    // Step 2: Verify account is manual (isManual=true)
    if (!accountData.isManual) {
      throw new Error(
        "Cannot manually update balance for Plaid-linked accounts. " +
        "Linked accounts sync automatically from your financial institution."
      );
    }

    // Validate balance
    if (typeof newBalance !== "number" || isNaN(newBalance)) {
      throw new Error("New balance must be a valid number");
    }

    // Step 3: Update balance field and lastSyncTimestamp
    // NOTE: Balance is updated directly from user input.
    // Fund allocations do NOT affect this balance.
    // Step 4: Use prepareFirestoreData for updateDoc
    await updateDoc(
      accountRef,
      prepareFirestoreData({
        balance: newBalance,
        lastSyncTimestamp: Date.now(),
      })
    );
  }

  /**
   * Updates multiple fields of a manual account in a single operation
   *
   * This method allows updating balance and/or nickname for manual accounts
   * in a single Firestore write operation. It automatically updates the
   * lastSyncTimestamp whenever any field is modified.
   *
   * @param accountId - Firestore document ID of the account to update
   * @param updates - Object containing fields to update (balance and/or nickname)
   * @returns Promise that resolves when the update is complete
   * @throws Error if user is not authenticated
   * @throws Error if account does not exist
   * @throws Error if account does not belong to the authenticated user
   * @throws Error if account is not manual (isManual === false)
   * @throws Error if balance is provided but not a valid number
   *
   * @example
   * // Update both balance and nickname
   * await AccountService.updateManualAccount("account123", {
   *   balance: 5500.00,
   *   nickname: "Emergency Fund"
   * });
   *
   * @example
   * // Update only balance
   * await AccountService.updateManualAccount("account123", {
   *   balance: 5500.00
   * });
   *
   * @example
   * // Update only nickname
   * await AccountService.updateManualAccount("account123", {
   *   nickname: "My Savings"
   * });
   *
   * @example
   * // Clear nickname
   * await AccountService.updateManualAccount("account123", {
   *   nickname: null
   * });
   */
  static async updateManualAccount(
    accountId: string,
    updates: {
      balance?: number;
      nickname?: string | null;
    }
  ): Promise<void> {
    // Step 1: Verify account exists and belongs to user
    const uid = this.getAuthenticatedUserId();
    const firestore = getFirestore();

    // Get the account document
    const accountRef = doc(firestore, ACCOUNTS_COLLECTION, accountId);
    const accountSnapshot = await getDoc(accountRef);

    // Verify account exists
    if (!accountSnapshot.exists()) {
      throw new Error(`Account with ID ${accountId} does not exist`);
    }

    // Verify account belongs to user
    const accountData = accountSnapshot.data() as FinancialAccount;
    if (accountData.uid !== uid) {
      throw new Error("Unauthorized: Account does not belong to the authenticated user");
    }

    // Step 2: Verify account is manual (isManual=true)
    if (!accountData.isManual) {
      throw new Error(
        "Cannot manually update Plaid-linked accounts. " +
        "Linked accounts sync automatically from your financial institution."
      );
    }

    // Step 3: Validate and prepare updates
    const updateData: Partial<FinancialAccount> = {
      lastSyncTimestamp: Date.now(),
    };

    // Validate and add balance if provided
    if (updates.balance !== undefined) {
      if (typeof updates.balance !== "number" || isNaN(updates.balance)) {
        throw new Error("Balance must be a valid number");
      }
      updateData.balance = updates.balance;
    }

    // Add nickname if provided (convert null/empty to undefined for deletion)
    if (updates.nickname !== undefined) {
      updateData.nickname = updates.nickname || undefined;
    }

    // Step 4: Update account with all changes in a single operation
    await updateDoc(
      accountRef,
      prepareFirestoreData(updateData)
    );
  }

  /**
   * Updates the target amount for an account (for goal tracking)
   *
   * This method allows users to set or update a target amount for any account
   * (both manual and Plaid-linked). The target amount is used to track progress
   * toward savings or investment goals directly on the account.
   *
   * To clear a target amount, pass null or undefined as the targetAmount parameter.
   *
   * @param accountId - Firestore document ID of the account to update
   * @param targetAmount - Target amount (positive number to set, null/undefined to clear)
   * @returns Promise that resolves when the update is complete
   * @throws Error if user is not authenticated
   * @throws Error if account does not exist
   * @throws Error if account does not belong to the authenticated user
   * @throws Error if targetAmount is not a positive number (when not null/undefined)
   *
   * @example
   * // Set a target amount for a savings account
   * await AccountService.updateAccountTargetAmount("account123", 10000.00);
   *
   * @example
   * // Clear a target amount
   * await AccountService.updateAccountTargetAmount("account123", null);
   */
  static async updateAccountTargetAmount(
    accountId: string,
    targetAmount: number | null | undefined
  ): Promise<void> {
    // Step 1: Verify account exists and belongs to user
    const uid = this.getAuthenticatedUserId();
    const firestore = getFirestore();

    // Get the account document
    const accountRef = doc(firestore, ACCOUNTS_COLLECTION, accountId);
    const accountSnapshot = await getDoc(accountRef);

    // Verify account exists
    if (!accountSnapshot.exists()) {
      throw new Error(`Account with ID ${accountId} does not exist`);
    }

    // Verify account belongs to user
    const accountData = accountSnapshot.data() as FinancialAccount;
    if (accountData.uid !== uid) {
      throw new Error("Unauthorized: Account does not belong to the authenticated user");
    }

    // Step 2: Validate targetAmount is positive number or null
    if (targetAmount !== null && targetAmount !== undefined) {
      if (typeof targetAmount !== "number" || isNaN(targetAmount)) {
        throw new Error("Target amount must be a valid number");
      }
      if (targetAmount <= 0) {
        throw new Error("Target amount must be a positive number");
      }
    }

    // Step 3: Update targetAmount field (or remove if null)
    // Step 4: Use prepareFirestoreData for updateDoc
    // prepareFirestoreData converts undefined to deleteField()
    await updateDoc(
      accountRef,
      prepareFirestoreData({
        targetAmount: targetAmount || undefined, // Convert null to undefined for deletion
      })
    );
  }

  /**
   * Deletes a manual account
   *
   * This method permanently deletes a manual account from Firestore.
   * It can only delete manual accounts (isManual === true). Plaid-linked accounts
   * cannot be deleted directly - users must remove the institution connection instead.
   *
   * Before deletion, the method verifies:
   * - Account exists and belongs to the authenticated user
   * - Account is manual (isManual === true)
   * - No transactions reference this account
   *
   * @param accountId - Firestore document ID of the account to delete
   * @returns Promise that resolves when the deletion is complete
   * @throws Error if user is not authenticated
   * @throws Error if account does not exist or does not belong to user
   * @throws Error if account is not manual (isManual === false)
   * @throws Error if transactions reference this account
   *
   * @example
   * // Delete a manual account
   * await AccountService.deleteManualAccount("account123");
   * // Account is permanently removed from Firestore
   */
  static async deleteManualAccount(accountId: string): Promise<void> {
    // Step 1: Verify account exists and belongs to user
    const uid = this.getAuthenticatedUserId();
    const firestore = getFirestore();

    // Get the account document
    const accountRef = doc(firestore, ACCOUNTS_COLLECTION, accountId);
    const accountSnapshot = await getDoc(accountRef);

    // Verify account exists
    if (!accountSnapshot.exists()) {
      throw new Error(`Account with ID ${accountId} does not exist`);
    }

    // Verify account belongs to user
    const accountData = accountSnapshot.data() as FinancialAccount;
    if (accountData.uid !== uid) {
      throw new Error("Unauthorized: Account does not belong to the authenticated user");
    }

    // Step 2: Verify account is manual (isManual=true)
    if (!accountData.isManual) {
      throw new Error(
        "Cannot delete Plaid-linked accounts. " +
        "To remove a linked account, remove the financial institution connection instead."
      );
    }

    // Step 3: Verify no transactions reference this account
    const transactionsQuery = query(
      collection(firestore, TRANSACTIONS_COLLECTION),
      where("uid", "==", uid),
      where("accountId", "==", accountId)
    );
    const transactionsSnapshot = await getDocs(transactionsQuery);

    if (!transactionsSnapshot.empty) {
      throw new Error(
        `Cannot delete account: ${transactionsSnapshot.size} transaction(s) reference this account. ` +
        "Please delete or reassign these transactions first."
      );
    }

    // Step 4: Delete account document
    await deleteDoc(accountRef);
  }

  /**
   * Validates if an account type can be designated as a fund account
   *
   * Only asset accounts (checking, savings, investment, other) can be fund accounts.
   * Liability accounts (credit, loan) cannot be fund accounts.
   *
   * @param accountType - The account type to validate
   * @returns true if the account type can be a fund account, false otherwise
   *
   * @example
   * // Check if savings account can be a fund
   * const canBeFund = AccountService.validateFundAccountEligibility(AccountType.Savings);
   * console.log(canBeFund); // true
   *
   * @example
   * // Check if credit account can be a fund
   * const canBeFund = AccountService.validateFundAccountEligibility(AccountType.Credit);
   * console.log(canBeFund); // false
   */
  static validateFundAccountEligibility(accountType: AccountType): boolean {
    // Only asset accounts can be fund accounts
    const assetAccountTypes: AccountType[] = [
      AccountType.Checking,
      AccountType.Savings,
      AccountType.Investment,
      AccountType.Other,
    ];
    return assetAccountTypes.includes(accountType);
  }

  /**
   * Updates the fund account status for an account
   *
   * This method toggles the isFundAccount field on an account.
   * Only asset accounts (checking, savings, investment, other) can be fund accounts.
   * Liability accounts (credit, loan) cannot be fund accounts.
   *
   * @param accountId - Firestore document ID of the account to update
   * @param isFundAccount - New fund account status (true to enable, false to disable)
   * @returns Promise resolving to success status and optional message
   * @throws Error if user is not authenticated
   * @throws Error if account does not exist
   * @throws Error if account does not belong to the authenticated user
   * @throws Error if attempting to enable fund status on a liability account
   *
   * @example
   * // Enable fund account status on a savings account
   * const result = await AccountService.updateFundAccountStatus("account123", true);
   * if (result.success) {
   *   console.log("Fund account enabled");
   * }
   *
   * @example
   * // Disable fund account status
   * const result = await AccountService.updateFundAccountStatus("account123", false);
   * if (result.success) {
   *   console.log("Fund account disabled");
   * }
   */
  static async updateFundAccountStatus(
    accountId: string,
    isFundAccount: boolean
  ): Promise<{ success: boolean; message?: string }> {
    // Step 1: Verify account exists and belongs to user
    const uid = this.getAuthenticatedUserId();
    const firestore = getFirestore();

    // Get the account document
    const accountRef = doc(firestore, ACCOUNTS_COLLECTION, accountId);
    const accountSnapshot = await getDoc(accountRef);

    // Verify account exists
    if (!accountSnapshot.exists()) {
      throw new Error(`Account with ID ${accountId} does not exist`);
    }

    // Verify account belongs to user
    const accountData = accountSnapshot.data() as FinancialAccount;
    if (accountData.uid !== uid) {
      throw new Error("Unauthorized: Account does not belong to the authenticated user");
    }

    // Step 2: Validate fund account eligibility (only when enabling)
    if (isFundAccount && !this.validateFundAccountEligibility(accountData.accountType)) {
      throw new Error(
        "Only asset accounts (checking, savings, investment, other) can be fund accounts. " +
        "Liability accounts (credit, loan) cannot be fund accounts."
      );
    }

    // Step 3: Update isFundAccount field
    await updateDoc(
      accountRef,
      prepareFirestoreData({
        isFundAccount,
      })
    );

    // Step 4: Return success
    return {
      success: true,
      message: isFundAccount
        ? "Fund account status enabled"
        : "Fund account status disabled",
    };
  }

  /**
   * Gets all fund accounts for the authenticated user
   *
   * Returns all accounts where isFundAccount === true.
   * These accounts can be used for transaction allocation in the fund tracking feature.
   *
   * @returns Promise resolving to array of FinancialAccount objects that are fund accounts
   * @throws Error if user is not authenticated
   *
   * @example
   * const fundAccounts = await AccountService.getFundAccounts();
   * console.log(`User has ${fundAccounts.length} fund accounts`);
   * fundAccounts.forEach(account => {
   *   console.log(`${account.accountName} (${account.accountType})`);
   * });
   */
  static async getFundAccounts(): Promise<FinancialAccount[]> {
    const uid = this.getAuthenticatedUserId();
    const firestore = getFirestore();

    // Query accounts where isFundAccount === true
    const fundAccountsQuery = query(
      collection(firestore, ACCOUNTS_COLLECTION),
      where("uid", "==", uid),
      where("isFundAccount", "==", true)
    );

    const fundAccountsSnapshot = await getDocs(fundAccountsQuery);

    // Map Firestore documents to FinancialAccount objects
    const fundAccounts: FinancialAccount[] = fundAccountsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as FinancialAccount));

    return fundAccounts;
  }

  /**
   * Automatically enables fund account status when linking to CSP savings/investment categories
   *
   * This method is called by the CSP settings UI when a user links an account to a category.
   * If the category belongs to the Savings or Investment bucket, the account is automatically
   * enabled as a fund account (isFundAccount = true).
   *
   * This provides a seamless user experience - accounts linked to savings/investment categories
   * are immediately available for transaction allocation without additional configuration.
   *
   * @param accountId - The Firestore document ID of the account being linked
   * @param cspBucket - The CSP bucket the category belongs to
   * @returns Promise resolving to success status and optional message
   * @throws Error if user is not authenticated
   * @throws Error if account does not exist
   * @throws Error if account does not belong to the authenticated user
   * @throws Error if attempting to link a liability account to Savings/Investment bucket
   *
   * @example
   * // User links account to "Emergency Fund" category (Savings bucket)
   * const result = await AccountService.handleCSPCategoryLinking(
   *   "account123",
   *   CSPBucket.Savings
   * );
   * if (result.success) {
   *   console.log(result.message); // "Fund account status enabled"
   * }
   *
   * @example
   * // User links account to "Groceries" category (FixedCost bucket)
   * const result = await AccountService.handleCSPCategoryLinking(
   *   "account123",
   *   CSPBucket.FixedCost
   * );
   * // No action taken, fund status unchanged
   */
  static async handleCSPCategoryLinking(
    accountId: string,
    cspBucket: CSPBucket
  ): Promise<{ success: boolean; message?: string }> {
    // Step 1: Check if this is a Savings or Investment bucket
    // Only these buckets trigger automatic fund enablement
    if (cspBucket !== CSPBucket.Savings && cspBucket !== CSPBucket.Investment) {
      return {
        success: true,
        message: "No fund status change needed for this bucket",
      };
    }

    // Step 2: Verify account exists and belongs to user
    const uid = this.getAuthenticatedUserId();
    const firestore = getFirestore();

    const accountRef = doc(firestore, ACCOUNTS_COLLECTION, accountId);
    const accountSnapshot = await getDoc(accountRef);

    if (!accountSnapshot.exists()) {
      throw new Error(`Account with ID ${accountId} does not exist`);
    }

    const accountData = accountSnapshot.data() as FinancialAccount;
    if (accountData.uid !== uid) {
      throw new Error("Unauthorized: Account does not belong to the authenticated user");
    }

    // Step 3: Validate account is an asset type
    // Liability accounts cannot be linked to Savings/Investment categories
    if (!this.validateFundAccountEligibility(accountData.accountType)) {
      throw new Error(
        "Only asset accounts can be linked to savings/investment categories. " +
        "Liability accounts (credit, loan) are not eligible."
      );
    }

    // Step 4: Check if account is already a fund account
    if (accountData.isFundAccount) {
      return {
        success: true,
        message: "Account is already a fund account",
      };
    }

    // Step 5: Enable fund account status
    await updateDoc(
      accountRef,
      prepareFirestoreData({
        isFundAccount: true,
      })
    );

    return {
      success: true,
      message: "Fund account status enabled",
    };
  }
}
