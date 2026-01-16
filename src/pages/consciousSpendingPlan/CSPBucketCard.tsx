import type { CSPCategoryBudget } from "@easy-csp/shared-types";
import { useAppSelector } from "../../hooks/useRedux";
import { Card, CardHeader } from "../../components/common/card";
import { camelCaseToSentence } from "../../utils/stringUtils";
import { formatCurrency } from "../../utils/financialUtils";
import { CSPBudgetRow } from "./CSPBudgetRow";

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

  // const totalBudgeted = cspBudgets.reduce((sum, sub) => sum + sub.amount, 0);
  const totalSpent = Object.values(categorySpending).reduce((sum, spent) => sum + spent, 0);
  // const percentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  // const isOverBudget = totalSpent > totalBudgeted;

  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{camelCaseToSentence(cspBucket)}</h3>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">
              {formatCurrency(totalSpent)}
            </div>
          </div>
        </div>
        {/* <Progress value={Math.min(percentage, 100)} hintText={formatCurrency(totalBudgeted)} activeColorClass="bg-green-200" /> */}
      </CardHeader>
      {/* SubCategories */}
      <div className="p-4 flex flex-col gap-2">
        {cspBudgets.map((budget, index) => (
          <>
            { index !== 0 ? <div className="h-0.5 bg-gray-200 w-full"></div> : null }
            <CSPBudgetRow
              categorySpending={categorySpending}
              budget={budget}
            />
          </>
        ))}
      </div>
    </Card>
  );
}
