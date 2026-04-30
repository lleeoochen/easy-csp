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
  /** Filter by fund ID. Use 'any' to match transactions with any account, or a specific ID */
  allocatedFundId?: string;
  /** Exclude transactions that have been allocated to a fund account (allocatedFundId is set) */
  excludeFundAllocated?: boolean;
  /** Include only transactions from these buckets */
  includeBuckets?: CSPBucket[];
  /** Exclude transactions from these buckets */
  excludeBuckets?: CSPBucket[];
  /** User's CSP data for bucket filtering (required when using includeBuckets/excludeBuckets) */
  csp?: ConsciousSpendingPlan;
  includePending?: boolean;
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
 * // Sum only inflow transactions (negative amounts) excluding accounts
 * const inflows = sumTransactions(transactions, {
 *   inflowOnly: true,
 *   excludeWithAccount: true
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
    allocatedFundId,
    excludeFundAllocated = false,
    includeBuckets,
    excludeBuckets,
    includePending = false,
    csp
  } = options;

  // Build category-to-bucket mapping once for performance
  let categoryToBucket: Map<string, CSPBucket> | undefined;

  if ((includeBuckets || excludeBuckets) && csp) {
    categoryToBucket = new Map();

    for (const [bucket, budgets] of Object.entries(csp)) {
      const bucketType = bucket as CSPBucket;
      for (const budget of budgets) {
        // Only map regular category budgets (not fund tracking budgets)
        if (!budget.isTrackingFund) {
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

      if (!includePending && transaction.plaidPending) {
        return false;
      }

      // Exclude transactions that have been allocated to a fund account
      if (excludeFundAllocated && transaction.allocatedFundId) {
        return false;
      }

      // Determine transaction bucket(s) - a transaction can belong to multiple buckets
      const transactionBuckets: CSPBucket[] = [];
      if ((includeBuckets || excludeBuckets) && categoryToBucket) {
        // Check if transaction is allocated to a fund (savings/investment)
        if (transaction.allocatedFundId) {
          // Transactions allocated to funds are considered savings/investment
          // We need to determine which bucket based on the fund type
          // For now, we'll include both Savings and Investment buckets
          // The actual fund type filtering happens at a higher level
          transactionBuckets.push(CSPBucket.Savings, CSPBucket.Investment);
        }

        // Check category bucket
        const categoryBucket = categoryToBucket.get(transaction.category);
        if (categoryBucket) {
          transactionBuckets.push(categoryBucket);
        }
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

      if (allocatedFundId !== undefined) {
        if (transaction.allocatedFundId !== allocatedFundId) {
          return false;
        }
      }

      return true;
    });
    if (debug) {
      console.log("======");
      console.log(result.map(t => ({
        name: t.name,
        category: t.category,
        accountId: t.accountId,
        amount: t.amount
      })));
      console.log(result.reduce((sum, transaction) => sum + transaction.amount, 0));
      console.log(options);
      console.log(transactions.map(t => ([t.name, t.amount, t.category, t.accountId])));
      console.log("======");
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