import type { AccountType, NetWorthSummary } from '@easy-csp/shared-types';
import type { UI_FinancialAccount } from '../types/uiTypes';

/**
 * Calculates net worth summary from all user accounts
 *
 * This function categorizes accounts by type (assets vs liabilities) and
 * calculates totals for each category. Assets include checking, savings,
 * investment, and other accounts. Liabilities include credit and loan accounts.
 *
 * Net worth is calculated as: assets.total - liabilities.total
 *
 * IMPORTANT: This calculation uses ONLY the account.balance field.
 * Fund allocations (transaction.allocatedFundId) are metadata for tracking
 * purposes and do NOT affect account balances or net worth calculations.
 * Fund allocations are displayed separately in the Fund Account View.
 *
 * @param accounts - Array of Account objects to calculate net worth from
 * @returns NetWorthSummary with categorized totals and net worth
 *
 * @example
 * const accounts = await AccountService.listAccounts();
 * const netWorth = calculateNetWorth(accounts);
 * console.log(`Net Worth: $${netWorth.netWorth.toFixed(2)}`);
 * console.log(`Total Assets: $${netWorth.assets.total.toFixed(2)}`);
 * console.log(`Total Liabilities: $${netWorth.liabilities.total.toFixed(2)}`);
 */
export function calculateNetWorth(accounts: UI_FinancialAccount[]): NetWorthSummary {
  // Initialize summary structure
  const summary: NetWorthSummary = {
    assets: {
      checking: 0,
      savings: 0,
      investment: 0,
      other: 0,
      total: 0,
    },
    liabilities: {
      credit: 0,
      loan: 0,
      total: 0,
    },
    netWorth: 0,
  };

  // Categorize and sum accounts by type
  // NOTE: Balance calculations use ONLY account.balance field.
  // Fund allocations (transaction.allocatedFundId) do NOT affect these calculations.
  for (const account of accounts) {
    const balance = account.balance;

    switch (account.accountType) {
      case 'checking':
        summary.assets.checking += balance;
        break;
      case 'savings':
        summary.assets.savings += balance;
        break;
      case 'investment':
        summary.assets.investment += balance;
        break;
      case 'other':
        summary.assets.other += balance;
        break;
      case 'credit':
        // Credit card debt is typically negative, use absolute value
        summary.liabilities.credit += Math.abs(balance);
        break;
      case 'loan':
        // Loan debt is typically negative, use absolute value
        summary.liabilities.loan += Math.abs(balance);
        break;
    }
  }

  // Calculate totals
  summary.assets.total =
    summary.assets.checking +
    summary.assets.savings +
    summary.assets.investment +
    summary.assets.other;

  summary.liabilities.total =
    summary.liabilities.credit +
    summary.liabilities.loan;

  summary.netWorth = summary.assets.total - summary.liabilities.total;

  return summary;
}

/**
 * Determines if an account type is an asset
 *
 * Asset accounts have positive value and contribute positively to net worth.
 * Includes: checking, savings, investment, other
 *
 * @param accountType - The account type to check
 * @returns true if the account type is an asset, false otherwise
 *
 * @example
 * if (isAssetAccount(AccountType.Checking)) {
 *   console.log('This is an asset account');
 * }
 */
export function isAssetAccount(accountType: AccountType): boolean {
  return (
    accountType === 'checking' ||
    accountType === 'savings' ||
    accountType === 'investment' ||
    accountType === 'other'
  );
}

/**
 * Determines if an account type is a liability
 *
 * Liability accounts represent debt and contribute negatively to net worth.
 * Includes: credit, loan
 *
 * @param accountType - The account type to check
 * @returns true if the account type is a liability, false otherwise
 *
 * @example
 * if (isLiabilityAccount(AccountType.Credit)) {
 *   console.log('This is a liability account');
 * }
 */
export function isLiabilityAccount(accountType: AccountType): boolean {
  return accountType === 'credit' || accountType === 'loan';
}

/**
 * Gets a human-readable display name for an account type
 *
 * Converts account type enum values to user-friendly display strings.
 *
 * @param accountType - The account type to get display name for
 * @returns Human-readable display name
 *
 * @example
 * const displayName = getAccountTypeDisplay(AccountType.Checking);
 * console.log(displayName); // "Checking"
 */
export function getAccountTypeDisplay(accountType: AccountType): string {
  const displayNames: Record<AccountType, string> = {
    checking: 'Checking',
    savings: 'Savings',
    credit: 'Credit Card',
    investment: 'Investment',
    loan: 'Loan',
    other: 'Other',
  };

  return displayNames[accountType] || accountType;
}

/**
 * Gets the display name for an account (nickname if set, otherwise account name)
 *
 * This function respects the user's nickname preference and falls back to
 * the original account name if no nickname is set.
 *
 * @param account - The account to get display name for
 * @returns Display name (nickname || accountName)
 *
 * @example
 * const account = { accountName: 'Chase Checking', nickname: 'Main Account', ... };
 * const displayName = getAccountDisplayName(account);
 * console.log(displayName); // "Main Account"
 *
 * @example
 * const account = { accountName: 'Chase Checking', nickname: undefined, ... };
 * const displayName = getAccountDisplayName(account);
 * console.log(displayName); // "Chase Checking"
 */
export function getAccountDisplayName(account: UI_FinancialAccount): string {
  return account.nickname || account.accountName;
}

/**
 * Calculates progress percentage toward a target amount
 *
 * Used for displaying goal progress when an account has a targetAmount set.
 * Returns a percentage between 0 and 100 (capped at 100 even if balance exceeds target).
 *
 * @param currentBalance - Current account balance
 * @param targetAmount - Target amount for the goal
 * @returns Progress percentage (0-100)
 *
 * @example
 * const progress = calculateProgressPercentage(5000, 10000);
 * console.log(progress); // 50
 *
 * @example
 * const progress = calculateProgressPercentage(12000, 10000);
 * console.log(progress); // 100 (capped at 100%)
 */
export function calculateProgressPercentage(
  currentBalance: number,
  targetAmount: number
): number {
  if (targetAmount <= 0) return 0;
  const percentage = (currentBalance / targetAmount) * 100;
  return Math.min(Math.max(percentage, 0), 100); // Clamp between 0 and 100
}
