import { Progress } from "../../components/common/progress";
import type { CSPCategoryBudget } from "@easy-csp/shared-types";
import { useAppSelector } from "../../hooks/useRedux";
import { Card } from "../../components/common/card";
import { camelCaseToSentence } from "../../utils/stringUtils";
import { formatCurrency } from "../../utils/financialUtils";

interface CSPBucketCardProps {
  cspBucket: string;
  cspBudgets: CSPCategoryBudget[];
}

export function CSPBucketCard({ cspBucket, cspBudgets }: CSPBucketCardProps) {
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
  // const isOverBudget = totalSpent > totalBudgeted;

  return (
    <Card className="flex-1">
      {/* Category Header */}
      <div className="flex items-start justify-between px-6 py-4 bg-amber-100">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{camelCaseToSentence(cspBucket)}</h3>
          </div>
        </div>
        <div className="text-right">
          <div className="font-medium">
            {formatCurrency(totalSpent)}
          </div>
          <div className="text-xs text-gray-400">
            / {formatCurrency(totalBudgeted)}
          </div>
        </div>
      </div>
      <div className="px-6 pb-4 bg-amber-100">
        <Progress value={Math.min(percentage, 100)} className="h-2" />
      </div>
      {/* SubCategories */}
      <div className="px-6 py-4">
        {cspBudgets.map((budget) => (
          categorySpending[budget.category]
          ? (
            <div key={budget.category} className="flex justify-between items-center active:bg-accent/50">
              <div className="font-medium text-sm truncate">{camelCaseToSentence(budget.category)}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {formatCurrency(categorySpending[budget.category])} / {formatCurrency(budget.amount)}
              </div>
            </div>
          ) : (
            undefined
          )
        ))}
      </div>
    </Card>
  );
}
