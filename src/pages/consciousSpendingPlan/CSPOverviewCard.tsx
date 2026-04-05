import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CSPBucket, type CSPCategoryBudget } from "@easy-csp/shared-types";
import { Card, CardContent, CardHeader } from "../../components/common/card";
import { CSPBudgetActionMenu } from "./CSPBudgetActionMenu";
import { useTransactions } from "../../hooks/api/useTransactions";
import { getMonthBoundaries } from "../../utils/dateUtils";
import { sumTransactions } from "../../utils/transactionUtils";
import { useCSP } from "../../hooks/api/useCSP";

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
  const { data: csp } = useCSP();

  const transactions = useMemo(() =>
    transactionPages?.pages.flatMap(p => p.transactions ?? []) ?? [],
    [transactionPages]
  );

  const { totalIncome, totalIncomeBudget } = useMemo(() => {
    const totalIncome = Math.abs(
      sumTransactions(transactions, {
        excludeBuckets: [CSPBucket.Ignored],
        includeHidden: false,
        inflowOnly: true,
        csp,
      })
    );

    const totalIncomeBudget = incomeBudgets.reduce((sum, budget) => sum + budget.amount, 0);

    return { totalIncome, totalIncomeBudget };
  }, [incomeBudgets, transactions, csp]);

  const { totalExpenses, totalExpensesBudget, totalSavings, totalSavingsBudget } = useMemo(() => {
    // Regular expenses (FixedCost and GuildFreeSpending buckets only)
    const regularExpenses = sumTransactions(transactions, {
      includeBuckets: [CSPBucket.FixedCost, CSPBucket.GuildFreeSpending],
      excludeWithFund: true,
      includeHidden: false,
      outflowOnly: true,
      csp
    });

    // Savings and investment contributions
    const savingsContributions = Math.abs(sumTransactions(transactions, {
      includeBuckets: [CSPBucket.Savings, CSPBucket.Investment],
      includeHidden: false,
      inflowOnly: true,
      csp
    }));

    let totalExpensesBudget = 0;
    let totalSavingsBudget = 0;

    expenseBuckets.forEach(({ bucket, budgets }) => {
      budgets.forEach(budget => {
        if (bucket === CSPBucket.Savings || bucket === CSPBucket.Investment) {
          totalSavingsBudget += budget.amount;
        } else if (bucket !== CSPBucket.Ignored) {
          totalExpensesBudget += budget.amount;
        }
      });
    });

    return {
      totalExpenses: regularExpenses,
      totalExpensesBudget,
      totalSavings: savingsContributions,
      totalSavingsBudget
    };
  }, [expenseBuckets, transactions, csp]);

  // Create synthetic budgets for overview rows
  const incomeBudget: CSPCategoryBudget = {
    category: 'income',
    amount: totalIncomeBudget
  };

  const expenseBudget: CSPCategoryBudget = {
    category: 'expenses',
    amount: totalExpensesBudget
  };

  const savingsBudget: CSPCategoryBudget = {
    category: 'savings',
    amount: totalSavingsBudget
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
      <CardContent className="flex flex-col p-0! divide-y divide-gray-200">
        <CSPBudgetActionMenu
          className="px-4 py-1.5"
          budget={incomeBudget}
          bucket={CSPBucket.Income}
          categoryName="Total Income"
          actualAmount={totalIncome}
          budgetAmount={totalIncomeBudget}
          currentMonth={currentMonthString}
          showEdit={true}
          showDelete={false}
          exceedingIsGood={true}
          onViewTransactions={() => navigate(`/transactions?category=income&month=${currentMonthString}`)}
        />
        <CSPBudgetActionMenu
          className="px-4 py-1.5"
          budget={expenseBudget}
          bucket={CSPBucket.FixedCost}
          categoryName="Total Expenses"
          actualAmount={totalExpenses}
          budgetAmount={totalExpensesBudget}
          currentMonth={currentMonthString}
          showEdit={false}
          showDelete={false}
          onViewTransactions={() => navigate(`/transactions?month=${currentMonthString}`)}
        />
        <CSPBudgetActionMenu
          className="px-4 py-1.5"
          budget={savingsBudget}
          bucket={CSPBucket.Savings}
          categoryName="Total Savings"
          actualAmount={totalSavings}
          budgetAmount={totalSavingsBudget}
          currentMonth={currentMonthString}
          showEdit={false}
          showDelete={false}
          exceedingIsGood={true}
          onViewTransactions={() => navigate(`/transactions?buckets=savings,investment&month=${currentMonthString}`)}
        />
      </CardContent>
    </Card>
  );
}