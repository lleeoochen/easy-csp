import { useMemo } from "react";
import { CSPBucket, type CSPCategoryBudget } from "@easy-csp/shared-types";
import { Card, CardContent, CardHeader } from "../../components/common/card";
import { camelCaseToSentence } from "../../utils/stringUtils";
import { formatCurrency } from "../../utils/financialUtils";
import { CSPBudgetRow } from "./CSPBudgetRow";
import { AddCategoryRow } from "./AddCategoryRow";
import { useTransactions } from "../../hooks/api/useTransactions";
import { getMonthBoundaries } from "../../utils/dateUtils";
import { sumTransactions } from "../../utils/transactionUtils";
import { useSavingTargets } from "../../hooks/api/useSavingTargets";

interface CSPBucketCardProps {
  cspBucket: CSPBucket;
  cspBudgets: CSPCategoryBudget[];
  currentMonthString: string;
  showAddRow?: boolean;
}

export function CSPBucketCard({ cspBucket, cspBudgets, currentMonthString, showAddRow = true }: CSPBucketCardProps) {
  const [year, month] = currentMonthString.split('-').map(Number);
  const { startDate, endDate } = getMonthBoundaries(year, month - 1);
  const { data: transactionPages } = useTransactions({ startDate, endDate });
  const { data: savingTargets = [] } = useSavingTargets();

  const transactions = useMemo(() =>
    transactionPages?.pages.flatMap(p => p.transactions ?? []) ?? [],
    [transactionPages]
  );

  // Calculate totals using our transaction utility
  const { totalSpent, totalBudgeted } = useMemo(() => {
    let totalSpent = 0;
    let totalBudgeted = 0;

    cspBudgets.forEach(budget => {
      if (budget.isTrackingSavingTarget) {
        const savingTarget = savingTargets.find(st => st.id === budget.category);
        if (savingTarget) {
          totalSpent += sumTransactions(transactions, {
            institutionId: savingTarget.financialInstitutionId,
            accountId: savingTarget.accountId,
            includeHidden: false,
            inflowOnly: true
          });
        }
      } else if (cspBucket === CSPBucket.Savings) {
        totalSpent += sumTransactions(transactions, {
          category: budget.category,
          excludeSavingTargets: true,
          includeHidden: false,
          inflowOnly: true
        });
      } else {
        totalSpent += sumTransactions(transactions, {
          category: budget.category,
          excludeSavingTargets: true,
          includeHidden: false
        });
      }

      totalBudgeted += budget.amount;
    });

    return { totalSpent, totalBudgeted };
  }, [cspBudgets, cspBucket, transactions, savingTargets]);

  return (
    <Card className="flex-1">
      <CardHeader className={`flex flex-row items-stretch`}>
        <div className="flex flex-col items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg">{camelCaseToSentence(cspBucket)}</h3>
            </div>
          </div>
          <div className="text-gray-300 text-sm">
            Target: {formatCurrency(totalBudgeted)}
          </div>
        </div>
        <div className="text-lg ml-auto my-auto">
          {formatCurrency(totalSpent)}
        </div>
      </CardHeader>
      {/* SubCategories */}
      <CardContent className="flex flex-col p-0! divide-y divide-gray-200">
        {cspBudgets.map((budget) => (
          <div key={budget.category} className="px-4 py-1.5">
            <CSPBudgetRow
              budget={budget}
              bucket={cspBucket as CSPBucket}
              currentMonthString={currentMonthString}
            />
          </div >
        ))}
        {showAddRow && cspBucket !== CSPBucket.Savings && (
          <div className="p-2">
            <AddCategoryRow bucket={cspBucket} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}