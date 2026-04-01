import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CSPBucket, type CSPCategoryBudget } from "@easy-csp/shared-types";
import { Card, CardContent, CardHeader } from "../../components/common/card";
import { CSPBudgetActionMenu } from "./CSPBudgetActionMenu";
import { useTransactions } from "../../hooks/api/useTransactions";
import { getMonthBoundaries } from "../../utils/dateUtils";
import { sumTransactions } from "../../utils/transactionUtils";

interface CSPOverviewCardProps {
  incomeBudgets: CSPCategoryBudget[];
  expenseBuckets: Array<{ bucket: CSPBucket; budgets: CSPCategoryBudget[] }>;
  currentMonthString: string;
}

export function CSPOverviewCard({ incomeBudgets, expenseBuckets, currentMonthString }: CSPOverviewCardProps) {
  const navigate = useNavigate();
  const [year, month] = currentMonthString.split('-').map(Number);
  const { startDate, endDate } = getMonthBoundaries(year, month - 1);
  const { data: transactionPages } = useTransactions({ startDate, endDate });

  const transactions = useMemo(() =>
    transactionPages?.pages.flatMap(p => p.transactions ?? []) ?? [],
    [transactionPages]
  );

  const { totalIncome, totalIncomeBudget } = useMemo(() => {
    let totalIncome = 0;
    let totalIncomeBudget = 0;

    incomeBudgets.forEach(budget => {
      totalIncome += Math.abs(
        sumTransactions(transactions, {
          category: budget.category,
          excludeSavingTargets: false,
          includeHidden: false,
          inflowOnly: true
        })
      );
      totalIncomeBudget += budget.amount;
    });

    return { totalIncome, totalIncomeBudget };
  }, [incomeBudgets, transactions]);

  const { totalExpenses, totalExpensesBudget } = useMemo(() => {
    // Total expenses = regular outflows + contributions to savings targets
    const regularExpenses = sumTransactions(transactions, {
      excludeSavingTargets: true,
      includeHidden: false,
      includeIgnoredBucket: false,
      outflowOnly: true
    });

    const savingsContributions = Math.abs(sumTransactions(transactions, {
      savingTargetsOnly: true,
      includeHidden: false,
      includeIgnoredBucket: false,
      inflowOnly: true
    }));

    const totalExpenses = regularExpenses + savingsContributions;
    let totalExpensesBudget = 0;

    expenseBuckets.forEach(({ budgets }) => {
      budgets.forEach(budget => {
        totalExpensesBudget += budget.amount;
      });
    });

    return { totalExpenses, totalExpensesBudget };
  }, [expenseBuckets, transactions]);

  // Create synthetic budgets for overview rows
  const incomeBudget: CSPCategoryBudget = {
    category: 'income',
    amount: totalIncomeBudget
  };

  const expenseBudget: CSPCategoryBudget = {
    category: 'expenses',
    amount: totalExpensesBudget
  };

  return (
    <Card className="flex-1">
      <CardHeader className={`flex flex-row items-stretch`}>
        <div className="flex flex-col items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg">Overview</h3>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col">
        <CSPBudgetActionMenu
          budget={incomeBudget}
          bucket={CSPBucket.Income}
          categoryName="Total Income"
          actualAmount={totalIncome}
          budgetAmount={totalIncomeBudget}
          isOverBudget={false}
          currentMonth={currentMonthString}
          showEdit={true}
          showDelete={false}
          onViewTransactions={() => navigate(`/transactions?category=income&month=${currentMonthString}`)}
        />
        <CSPBudgetActionMenu
          budget={expenseBudget}
          bucket={CSPBucket.FixedCost}
          categoryName="Total Spent"
          actualAmount={totalExpenses}
          budgetAmount={totalExpensesBudget}
          isOverBudget={totalExpenses > totalExpensesBudget}
          currentMonth={currentMonthString}
          showEdit={false}
          showDelete={false}
          onViewTransactions={() => navigate(`/transactions?month=${currentMonthString}`)}
        />
      </CardContent>
    </Card>
  );
}