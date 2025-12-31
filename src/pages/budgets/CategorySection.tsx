import { Progress } from "../../components/common/progress";
import type { CSPBucket, CSPCategoryBudget } from "@easy-csp/shared-types";
import { useAppSelector } from "../../hooks/useRedux";

interface CategorySectionProps {
  cspBucket: CSPBucket;
  cspBudgets: CSPCategoryBudget[];
}

export function CategorySection({ cspBucket, cspBudgets }: CategorySectionProps) {
  const transactionState = useAppSelector(state => state.transaction);

  // Helper function to calculate spending for a specific category
  const calculateCategorySpending = (category: string): number => {
    return transactionState.transactions
      .filter(transaction => transaction.category === category && !transaction.hidden)
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  };

  // Calculate spending for each category and total for section
  const categorySpending = cspBudgets.reduce((acc, budget) => {
    acc[budget.category] = calculateCategorySpending(budget.category);
    return acc;
  }, {} as Record<string, number>);

  const totalBudgeted = cspBudgets.reduce((sum, sub) => sum + sub.amount, 0);
  const totalSpent = Object.values(categorySpending).reduce((sum, spent) => sum + spent, 0);
  const percentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const isOverBudget = totalSpent > totalBudgeted;

  return (
    <div className="bg-card border border-gray-200 rounded-lg overflow-hidden">
      {/* Category Header */}
      <div className="p-4 bg-amber-100 px-6 py-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{cspBucket}</h3>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold">
              ${totalSpent.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              of ${totalBudgeted.toLocaleString()}
            </div>
          </div>
        </div>
        <Progress value={Math.min(percentage, 100)} className="h-2 mb-2" />
        <div className="flex justify-between text-xs">
          <span className={isOverBudget ? "text-destructive font-medium" : "text-muted-foreground"}>
            {percentage.toFixed(0)}% used
          </span>
          <span className={isOverBudget ? "text-destructive font-medium" : "text-muted-foreground"}>
            ${(totalBudgeted - totalSpent).toLocaleString()} left
          </span>
        </div>
      </div>

      {/* SubCategories */}
      <div>
        {cspBudgets.map((budget) => (
          <div key={budget.category} className="p-3 flex items-center justify-between active:bg-accent/50">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{budget.category}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                ${categorySpending[budget.category]?.toLocaleString() || '0'} / ${budget.amount.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
