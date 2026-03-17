import { CSPBucket, CSPCategory, getCSPBucket, type CSPCategoryBudget } from "@easy-csp/shared-types";
import { CSPBucketCard } from "./CSPBucketCard";
import { useCSP } from "../../hooks/api/useCSP";
import { useTransactions } from "../../hooks/api/useTransactions";
import { formatCurrency } from "../../utils/financialUtils";
import { Card } from "../../components/common/card";
import { getMonthBoundaries } from "../../utils/dateUtils";

const CSP_BUCKET_ORDER: CSPBucket[] = [
  CSPBucket.Income,
  CSPBucket.FixedCost,
  CSPBucket.Savings,
  CSPBucket.Investment,
  CSPBucket.GuildFreeSpending,
  CSPBucket.Ignored,
];

interface CSPBucketCardListProps {
  selectedMonth: number;
  selectedYear: number;
}

export function CSPBucketCardList({ selectedMonth, selectedYear }: CSPBucketCardListProps) {
  const { data: consciousSpendingPlan = {}, isLoading, error, refetch } = useCSP();
  const { startDate, endDate } = getMonthBoundaries(selectedYear, selectedMonth);
  const { data: transactionPages } = useTransactions({ startDate, endDate });
  const transactions = transactionPages?.pages.flatMap(p => p.transactions ?? []).filter(t => t !== undefined) ?? [];

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse">Loading consciousSpendingPlan...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg mx-4">
        <p className="text-red-600">Error loading consciousSpendingPlan: {error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Format current month as YYYY-MM for URL parameter
  const currentMonthString = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}`;

  const totalIncomeTarget = Object.entries<CSPCategoryBudget[]>(consciousSpendingPlan)
    .filter(([bucket]) => bucket === CSPBucket.Income)
    .reduce((total, entry) => {
      const [, categoryBudgets] = entry;
      return total + categoryBudgets.reduce((subtotal, categoryBudget) => subtotal + categoryBudget.amount, 0);
    }, 0);

  const consciousSpendingPlanSortedEntries = Object
    .entries<CSPCategoryBudget[]>(consciousSpendingPlan)
    .sort((a, b) => {
        // Find the index of each item in the custom order array
        const indexA = CSP_BUCKET_ORDER.indexOf(a[0] as CSPBucket);
        const indexB = CSP_BUCKET_ORDER.indexOf(b[0] as CSPBucket);
        // Sort based on the indices
        return indexA - indexB;
    });

  const spendingBuckets = consciousSpendingPlanSortedEntries
    .filter(([bucket]) => bucket !== CSPBucket.Income && bucket !== CSPBucket.Ignored);

  const totalSpendingTarget = consciousSpendingPlanSortedEntries
    .filter(([bucket]) => bucket !== CSPBucket.Income && bucket !== CSPBucket.Ignored)
    .reduce((total, entry) => {
      const [, categoryBudgets] = entry;
      return total + categoryBudgets.reduce((subtotal, categoryBudget) => subtotal + categoryBudget.amount, 0);
    }, 0);

  let totalIncome = 0;
  let totalSpending = 0;

  transactions.forEach(transaction => {
    const cspBucket = getCSPBucket(transaction.category as CSPCategory);
    if (transaction.hidden) {
      return;
    }

    switch (cspBucket) {
      case CSPBucket.Ignored:
        break;
      case CSPBucket.Income:
        totalIncome += transaction.amount;
        break;
      default:
        totalSpending += transaction.amount;
    }
  });

  return (
    <>
      {/* Summary Cards */}
      <div className="gap-3 hidden">
        <Card className="flex-1 px-6 py-4 p-3 text-center bg-primary-bg">
          <div className="font-medium">Total Income</div>
          <div className={`text-2xl font-medium`}>{formatCurrency(totalIncome)}</div>
          <div className="font-medium">{formatCurrency(totalIncomeTarget)}</div>
        </Card>
        <Card className="flex-1 px-6 py-4 p-3 text-center bg-primary-bg">
          <div className="font-medium">Total Spending</div>
          <div className={`text-2xl font-medium`}>{formatCurrency(totalSpending)}</div>
          <div className="font-medium">{formatCurrency(totalSpendingTarget)}</div>
        </Card>
      </div>

      {/* Category Sections */}
      <div className="space-y-4">
        {spendingBuckets.map(([cspBucket, cspBudgets]) => (
          <CSPBucketCard
            key={cspBucket}
            cspBucket={cspBucket as CSPBucket}
            cspBudgets={cspBudgets}
            currentMonthString={currentMonthString}
          />
        ))}
      </div>
    </>
  );
}
