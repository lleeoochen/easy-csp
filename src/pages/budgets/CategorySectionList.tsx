import { CSPBucket, type ConsciousSpendingPlan, type Transaction } from "@easy-csp/shared-types";
import { CategorySection } from "./CategorySection";

interface CategorySectionListProps {
  consciousSpendingPlan: ConsciousSpendingPlan;
  transactions?: Transaction[];
}

export function CategorySectionList({
  consciousSpendingPlan,
  transactions = []
}: CategorySectionListProps) {
  const totalBudgeted = Object.values(consciousSpendingPlan).reduce(
    (sum, cspBudgets) =>
      sum + cspBudgets.reduce((subSum, sub) => subSum + sub.amount, 0),
    0
  );

  // Calculate total spent from transactions
  const totalSpent = transactions.reduce((sum, transaction) => {
    // Only include non-hidden transactions with positive amounts (expenses)
    if (!transaction.hidden && transaction.amount > 0) {
      return sum + transaction.amount;
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-4 p-4 pb-24">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-100 px-6 py-4 border-b border-gray-200 rounded-lg p-3">
          <div className="text-xs text-muted-foreground">Budgeted</div>
          <div className="text-lg font-bold mt-0.5">${totalBudgeted.toLocaleString()}</div>
        </div>
        <div className="bg-amber-100 px-6 py-4 border-b border-gray-200 rounded-lg p-3">
          <div className="text-xs text-muted-foreground">Spent</div>
          <div className="text-lg font-bold mt-0.5">${totalSpent.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">
            {totalBudgeted > 0 ? ((totalSpent / totalBudgeted) * 100).toFixed(0) : 0}% of budget
          </div>
        </div>
      </div>

      {/* Category Sections */}
      <div className="space-y-3">
        {Object.entries(consciousSpendingPlan).map(([cspBucket, cspBudgets]) => (
          <CategorySection
            key={cspBucket}
            cspBucket={cspBucket as CSPBucket}
            cspBudgets={cspBudgets}
          />
        ))}
      </div>
    </div>
  );
}
