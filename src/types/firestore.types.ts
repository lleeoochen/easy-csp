import { Timestamp } from 'firebase-admin/firestore';

// Collection Name Constants
export const USERS_COLLECTION = 'users';
export const TRANSACTIONS_COLLECTION = 'transactions';
export const BUDGETS_COLLECTION = 'budgets';
export const FINANCIAL_INSTITUTIONS_COLLECTION = 'financialInstitutions';
export const SAVING_TARGETS_COLLECTION = 'savingTargets';
export const RULES_COLLECTION = 'rules';

// Type Definitions

/**
 * User document type
 * Collection: users
 * Document ID: userId (uid)
 */
export interface User {
  uid: string;
  name: string;
  // Add additional user fields as needed
}

/**
 * Transaction document type
 * Collection: transactions
 * Document ID: auto-generated id
 */
export interface Transaction {
  id: string;
  uid: string;                // User ID who owns this transaction
  accountId: string;          // Account ID within the institution
  name: string;               // Transaction name/description
  amount: number;             // Transaction amount
  date: string | Timestamp;   // Transaction date
  category?: string;           // Transaction category
  hidden: boolean;            // Whether this transaction is hidden
}

/**
 * Budget document type
 * Collection: budgets
 * Document ID: userId (uid)
 */
export interface Budget {
  uid: string;               // User ID who owns this budget
  category: string;          // Budget category
  budgetType: BudgetType;    // Type of budget (fixed costs, savings, etc.)
  amount: number;            // Budget amount
}

/**
 * Budget type enum
 */
export enum BudgetType {
  FixedCost = 'fixedCost',
  Savings = 'savings',
  Investment = 'investment',
  GuildFreeSpending = 'guildFreeSpending',
  Income = 'income',
}

/**
 * Account sub-type for financial institutions
 */
export interface Account {
  accountId: string;         // Account ID
  accountName: string;       // Account name
  balance: number;           // Current balance
  accountType: AccountType;  // Type of account
}

/**
 * Account type enum
 */
export enum AccountType {
  Checking = 'checking',
  Savings = 'savings',
  Credit = 'credit',
  Investment = 'investment',
  Loan = 'loan',
  Other = 'other',
}

/**
 * Financial Institution document type
 * Collection: financialInstitutions
 * Document ID: auto-generated id
 */
export interface FinancialInstitution {
  uid: string;                            // User ID who owns this connection
  status: FinancialInstitutionStatus;     // Status of the connection
  institutionId: string;                  // Institution ID from Plaid
  institutionName: string;                // Institution name from Plaid
  lastSyncTimestamp: string | Timestamp;  // Last time data was synced
  accounts: Account[];                    // List of accounts
  cursor: string;                         // Plaid transactions sync cursor
  accessToken: string;                    // Plaid access token
}

/**
 * Financial Institution Status enum
 */
export enum FinancialInstitutionStatus {
  Active = 'active',
  Inactive = 'inactive',
  AwaitSync = 'awaitSync',
  SyncFailed = 'syncFailed'
}

/**
 * Saving Target document type
 * Collection: savingTargets
 * Document ID: userId (uid)
 */
export interface SavingTarget {
  uid: string;                              // User ID who owns this saving target
  trackingAccounts: Record<string, number>; // Map of account IDs to target amounts
}

/**
 * Transformation matching criteria
 */
export interface MatchingCriteria {
  name?: string;  // Match transaction by name (can be regex)
  type?: string;  // Match transaction by type
}

/**
 * Transformation action
 */
export interface TransformAction {
  category?: string;  // Category to set
  split?: string;     // How to split the transaction (TBD: might need a more specific format)
}

/**
 * Transformation sub-type for rules
 */
export interface Transformation {
  matchingCriteria: MatchingCriteria;
  transformAction: TransformAction;
}

/**
 * Rule document type
 * Collection: rules
 * Document ID: userId (uid)
 */
export interface Rule {
  uid: string;                // User ID who owns this rule
  transformations: Transformation[];  // List of transformations
}
