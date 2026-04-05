import { type Transaction, CSPBucket, type ConsciousSpendingPlan } from "@easy-csp/shared-types";

export interface TransactionSumOptions {
  /** Include hidden transactions in the sum (default: false) */
  includeHidden?: boolean;
  /** Only include inflow transactions (amount < 0) (default: false) */
  inflowOnly?: boolean;
  /** Only include outflow transactions (amount > 0) (default: false) */
  outflowOnly?: boolean;
  /** Filter by specific category */
  category?: string;
  /** Filter by saving target ID. Use 'any' to match transactions with any saving target, or a specific ID */
  fundId?: string | 'any';
  /** Exclude transactions that have any fundId (useful for non-Savings buckets) */
  excludeWithFund?: boolean;
  /** Filter by specific institution ID */
  institutionId?: string;
  /** Filter by specific account ID */
  accountId?: string;
  /** Include only transactions from these buckets */
  includeBuckets?: CSPBucket[];
  /** Exclude transactions from these buckets */
  excludeBuckets?: CSPBucket[];
  /** User's CSP data for bucket filtering (required when using includeBuckets/excludeBuckets) */
  csp?: ConsciousSpendingPlan;
  debug?: boolean;
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
 *   excludeFunds: true
 * });
 */
export function sumTransactions(
  transactions: Transaction[],
  options: TransactionSumOptions = {}
): number {
  const {
    debug,
    includeHidden = false,
    inflowOnly = false,
    outflowOnly = false,
    category,
    fundId,
    excludeWithFund = false,
    institutionId,
    accountId,
    includeBuckets,
    excludeBuckets,
    csp
  } = options;

  // Build category/fundId-to-bucket mapping once for performance
  let categoryToBucket: Map<string, CSPBucket> | undefined;
  let fundToBucket: Map<string, CSPBucket> | undefined;

  if ((includeBuckets || excludeBuckets) && csp) {
    categoryToBucket = new Map();
    fundToBucket = new Map();

    for (const [bucket, budgets] of Object.entries(csp)) {
      const bucketType = bucket as CSPBucket;
      for (const budget of budgets) {
        if (budget.isTrackingFund) {
          // For saving target budgets, map by fundId (stored in category field)
          fundToBucket.set(budget.category, bucketType);
        } else {
          // For regular budgets, map by category
          categoryToBucket.set(budget.category, bucketType);
        }
      }
    }
  }

  const result = transactions
    .filter(transaction => {
      // Filter by hidden status
      if (!includeHidden && transaction.hidden) {
        return false;
      }

      // Exclude transactions with saving targets if requested
      if (excludeWithFund && transaction.fundId) {
        return false;
      }

      // Determine transaction bucket(s) - a transaction can belong to multiple buckets
      const transactionBuckets: CSPBucket[] = [];
      if ((includeBuckets || excludeBuckets) && (categoryToBucket || fundToBucket)) {
        // Check fundId bucket
        if (transaction.fundId) {
          const savingBucket = fundToBucket?.get(transaction.fundId);
          if (savingBucket) {
            transactionBuckets.push(savingBucket);
          }
        }
        // Check category bucket
        const categoryBucket = categoryToBucket?.get(transaction.category);
        if (categoryBucket) {
          transactionBuckets.push(categoryBucket);
        }
      }

      if (debug && transaction.fundId) {
        console.log({transactionBuckets, fundToBucket, });
      }

      // Filter by bucket inclusion - transaction must be in at least one included bucket
      if (includeBuckets && !transactionBuckets.some(bucket => includeBuckets.includes(bucket))) {
        return false;
      }

      // Filter by bucket exclusion - transaction must not be in any excluded bucket
      if (excludeBuckets && transactionBuckets.some(bucket => excludeBuckets.includes(bucket))) {
        return false;
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
      if (fundId !== undefined) {
        if (fundId === 'any') {
          // Match any transaction with a saving target
          if (!transaction.fundId) {
            return false;
          }
        } else if (transaction.fundId !== fundId) {
          return false;
        }
      }

      // Filter by institution ID
      if (institutionId && transaction.institutionId !== institutionId) {
        return false;
      }

      // Filter by account ID
      if (accountId && transaction.accountId !== accountId) {
        return false;
      }

      return true;
    });
    if (debug) {
      console.log(result.map(t => ({
        name: t.name,
        category: t.category,
        fundId: t.fundId,
        amount: t.amount
      })));
      console.log(result.reduce((sum, transaction) => sum + transaction.amount, 0));
      console.log(options);
      console.log(transactions.map(t => ([t.name, t.amount, t.category])));
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
   * Sum all inflow transactions (negative amounts) excluding hidden
   */
  inflowsOnly: (transactions: Transaction[]) =>
    sumTransactions(transactions, {
      includeHidden: false,
      inflowOnly: true
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
  byFund: (transactions: Transaction[], fundId: string) =>
    sumTransactions(transactions, {
      fundId,
      includeHidden: false
    }),

  /**
   * Sum all transactions excluding ignored bucket categories
   */
  excludingIgnored: (transactions: Transaction[]) =>
    sumTransactions(transactions, {
      includeHidden: false,
      excludeBuckets: [CSPBucket.Ignored]
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