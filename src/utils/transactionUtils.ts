import { type Transaction, type CSPCategory, CSPBucket } from "@easy-csp/shared-types";
import { CSP_CATEGORY_TO_BUCKET_MAPPING } from "@easy-csp/shared-types";

export interface TransactionSumOptions {
  /** Include hidden transactions in the sum (default: false) */
  includeHidden?: boolean;
  /** Include transactions from ignored bucket categories (default: false) */
  includeIgnoredBucket?: boolean;
  /** Only include inflow transactions (amount < 0) (default: false) */
  inflowOnly?: boolean;
  /** Only include outflow transactions (amount > 0) (default: false) */
  outflowOnly?: boolean;
  /** Filter by specific category */
  category?: string;
  /** Filter by specific saving target ID */
  savingTargetId?: string;
  /** Filter by specific institution ID */
  institutionId?: string;
  /** Filter by specific account ID */
  accountId?: string;
  /** Exclude transactions that have a saving target ID (default: false) */
  excludeSavingTargets?: boolean;

  savingTargetsOnly?: boolean;
  id?: string;
}

/**
 * Sums transaction amounts with flexible filtering options.
 * Returns the absolute sum of matching transactions.
 *
 * @param transactions - Array of transactions to sum
 * @param options - Filtering options
 * @returns The sum of absolute values of matching transaction amounts
 *
 * @example
 * // Sum all non-hidden transactions for a specific category
 * const total = sumTransactions(transactions, {
 *   category: 'groceries',
 *   includeHidden: false
 * });
 *
 * @example
 * // Sum only inflow transactions (negative amounts) excluding saving targets
 * const inflows = sumTransactions(transactions, {
 *   inflowOnly: true,
 *   excludeSavingTargets: true
 * });
 */
export function sumTransactions(
  transactions: Transaction[],
  options: TransactionSumOptions = {}
): number {
  const {
    id,
    includeHidden = false,
    includeIgnoredBucket = false,
    inflowOnly = false,
    outflowOnly = false,
    category,
    savingTargetId,
    institutionId,
    accountId,
    excludeSavingTargets = false,
    savingTargetsOnly = false
  } = options;

  const result = transactions
    .filter(transaction => {
      // Filter by hidden status
      if (!includeHidden && transaction.hidden) {
        return false;
      }

      // Filter by ignored bucket
      if (!includeIgnoredBucket) {
        const categoryBucket = CSP_CATEGORY_TO_BUCKET_MAPPING[transaction.category as CSPCategory];
        if (categoryBucket === CSPBucket.Ignored) {
          return false;
        }
      }

      // Filter by inflow only
      if (inflowOnly && transaction.amount >= 0) {
        return false;
      }

      if (outflowOnly && transaction.amount <= 0) {
        return false;
      }

      // Filter by category
      if (category && transaction.category !== category) {
        return false;
      }

      // Filter by saving target ID
      if (savingTargetId && transaction.savingTargetId !== savingTargetId) {
        return false;
      }

      // Exclude transactions with saving targets
      if (excludeSavingTargets && transaction.savingTargetId) {
        return false;
      }

      // Filter by institution ID
      if (institutionId && transaction.institutionId !== institutionId) {
        return false;
      }

      // Filter by account ID
      if (accountId && transaction.accountId !== accountId) {
        return false;
      }

      if (savingTargetsOnly && !transaction.savingTargetId) {
        return false;
      }

      return true;
    });
    if (id === 'savingTargetRow') {
      console.log(result.map(t => ({
        name: t.name,
        amount: t.amount
      })));
    }

    return result.reduce((sum, transaction) => sum + transaction.amount, 0);
}

/**
 * Common transaction summation patterns for easy use
 */
export const TransactionSummaries = {
  /**
   * Sum all visible transactions (excludes hidden transactions)
   */
  allVisible: (transactions: Transaction[]) =>
    sumTransactions(transactions, { includeHidden: false }),

  /**
   * Sum all inflow transactions (negative amounts) excluding hidden and saving targets
   */
  inflowsOnly: (transactions: Transaction[]) =>
    sumTransactions(transactions, {
      includeHidden: false,
      inflowOnly: true,
      excludeSavingTargets: true
    }),

  /**
   * Sum transactions for a specific category, excluding hidden
   */
  byCategory: (transactions: Transaction[], category: string) =>
    sumTransactions(transactions, {
      category,
      includeHidden: false
    }),

  /**
   * Sum transactions for a specific saving target
   */
  bySavingTarget: (transactions: Transaction[], savingTargetId: string) =>
    sumTransactions(transactions, {
      savingTargetId,
      includeHidden: false
    }),

  /**
   * Sum all transactions excluding ignored bucket categories
   */
  excludingIgnored: (transactions: Transaction[]) =>
    sumTransactions(transactions, {
      includeHidden: false,
      includeIgnoredBucket: false
    })
};

/**
 * Utility functions for aggregating spending/budget data from child components
 */
export const BudgetAggregation = {
  /**
   * Sum spending amounts from aggregated row data
   */
  totalSpending: (rowData: Record<string, { spending: number; budget: number }>) =>
    Object.values(rowData).reduce((sum, { spending }) => sum + spending, 0),

  /**
   * Sum budget amounts from aggregated row data
   */
  totalBudget: (rowData: Record<string, { spending: number; budget: number }>) =>
    Object.values(rowData).reduce((sum, { budget }) => sum + budget, 0),

  /**
   * Get both total spending and budget in one call
   */
  totals: (rowData: Record<string, { spending: number; budget: number }>) => ({
    totalSpent: BudgetAggregation.totalSpending(rowData),
    totalBudgeted: BudgetAggregation.totalBudget(rowData)
  })
};