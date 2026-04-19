// Dedicated file for UI-specific type definitions
// All UI types should begin with UI_ prefix

import {
  AccountType,
  FinancialInstitutionStatus,
  PlaidErrorCode,
} from '@easy-csp/shared-types';

/**
 * UI-specific account type with denormalized institution and fund information
 *
 * This interface is used by the Net Worth page and other UI components that need
 * to display account information along with related institution and fund data.
 * It combines data from the FinancialAccount document with denormalized fields from
 * FinancialInstitution and Fund documents for efficient rendering.
 *
 * Use this type when:
 * - Displaying accounts in the Net Worth page
 * - Showing account cards with institution sync status
 * - Rendering account lists with fund linkage information
 * - Building account selection dropdowns with full context
 *
 * @example
 * // Linked account with institution info
 * const linkedAccount: UI_FinancialAccount = {
 *   id: 'acc123',
 *   accountId: 'plaid_account_id',
 *   accountName: 'Chase Checking',
 *   nickname: 'Main Checking',
 *   displayName: 'Main Checking',
 *   accountType: AccountType.Checking,
 *   balance: 5000.00,
 *   isManual: false,
 *   institutionId: 'item_123',
 *   institutionName: 'Chase',
 *   lastSyncTimestamp: 1234567890,
 *   syncStatus: FinancialInstitutionStatus.Active,
 * };
 *
 * @example
 * // Manual account without institution info
 * const manualAccount: UI_FinancialAccount = {
 *   id: 'acc456',
 *   accountId: 'manual_001',
 *   accountName: 'Cash Savings',
 *   displayName: 'Cash Savings',
 *   accountType: AccountType.Savings,
 *   balance: 10000.00,
 *   isManual: true,
 *   linkedFundId: 'fund789',
 *   linkedFundName: 'Emergency Fund',
 * };
 */
export interface UI_FinancialAccount {
  /**
   * Firestore document ID from accounts/ collection (PRIMARY KEY)
   * This is the main identifier used for all account operations
   */
  id: string;

  /**
   * Plaid's account_id (for linked accounts) or user-generated ID (for manual accounts)
   * NOTE: This is NOT the Firestore document ID - see `id` field for that
   */
  accountId: string;

  /**
   * Original account name from Plaid or user-entered name
   * For display, prefer `displayName` which respects user's nickname preference
   */
  accountName: string;

  /**
   * Optional user-defined nickname for the account
   * Allows users to customize display names (e.g., "Emergency Fund" instead of "Savings Account")
   */
  nickname?: string;

  /**
   * Display name for UI rendering
   * Computed as: nickname || accountName
   * Always use this field for displaying account names in the UI
   */
  displayName: string;

  /**
   * Account type classification
   * Values: checking, savings, credit, investment, loan, other
   * Used for grouping accounts in net worth calculations (assets vs liabilities)
   */
  accountType: AccountType;

  /**
   * Current account balance
   * For linked accounts: updated during Plaid sync
   * For manual accounts: updated by user
   * Positive for asset accounts, can be negative for credit/loan accounts
   */
  balance: number;

  /**
   * Distinguishes between manual and linked accounts
   * true = manual account (user-created, no Plaid connection)
   * false = linked account (synced from Plaid)
   */
  isManual: boolean;

  /**
   * Plaid Item ID (institution connection identifier)
   * Only defined for linked accounts (isManual === false)
   * Used to match accounts during Plaid sync operations
   * undefined for manual accounts
   */
  institutionId?: string;

  /**
   * Institution name (denormalized from FinancialInstitution)
   * Only defined for linked accounts (isManual === false)
   * Displayed in account cards to show which bank/institution the account belongs to
   * undefined for manual accounts
   */
  institutionName?: string;

  /**
   * Last sync timestamp (denormalized from FinancialInstitution)
   * Only defined for linked accounts (isManual === false)
   * Displayed in account cards to show data freshness
   * Epoch milliseconds
   * undefined for manual accounts
   */
  lastSyncTimestamp?: number;

  /**
   * Current sync status (denormalized from FinancialInstitution)
   * Only defined for linked accounts (isManual === false)
   * Used to show sync status indicators (active, syncing, error, etc.)
   * undefined for manual accounts
   */
  syncStatus?: FinancialInstitutionStatus;

  /**
   * Plaid error code (denormalized from FinancialInstitution)
   * Only defined for linked accounts with errors (syncStatus === InstitutionError)
   * Used to display specific error messages and recovery actions
   * undefined for manual accounts or accounts without errors
   */
  syncError?: PlaidErrorCode;

  /**
   * Optional target amount for savings goals
   * Allows users to set a target balance for the account (e.g., emergency fund goal)
   * Used for progress tracking and goal visualization in the UI
   * undefined if no target is set
   */
  targetAmount?: number;

  /**
   * Whether this account is used as a fund for transaction allocation
   * When true, transactions can be allocated to this account for tracking purposes
   * Fund allocations are metadata only and do not affect the actual account balance
   * Only asset accounts (checking, savings, investment, other) can be fund accounts
   */
  isFundAccount?: boolean;
}
