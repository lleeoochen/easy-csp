import { CSPBucket, type CSPCategoryBudget } from "@easy-csp/shared-types";
import { CSPBucketCard } from "./CSPBucketCard";
import { useCSP } from "../../hooks/api/useCSP";
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

  return (
    <>
      <div className="space-y-3">
        {/* Summary Cards */}
        <div className="flex flex-row gap-3">
          <CSPBucketCard
            cspBucket={CSPBucket.Income}
            cspBudgets={consciousSpendingPlan[CSPBucket.Income] ?? []}
            currentMonthString={currentMonthString}
            showAddRow={false}
          />
        </div>

        {/* Category Sections */}
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
