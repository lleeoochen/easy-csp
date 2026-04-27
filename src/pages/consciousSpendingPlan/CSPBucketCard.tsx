import { useMemo } from "react";
import { CSPBucket, type CSPCategoryBudget } from "@easy-csp/shared-types";
import { Card, CardContent, CardHeader } from '@/components/common/card';
import { camelCaseToSentence } from '@/utils/stringUtils';
import { formatCurrency } from '@/utils/financialUtils';
import { CSPBudgetRow } from "./CSPBudgetRow";
import { AddCategoryRow } from "./AddCategoryRow";
import { useTransactions } from '@/hooks/api/useTransactions';
import { getMonthBoundaries } from '@/utils/dateUtils';
import { sumTransactions } from '@/utils/transactionUtils';
import { useCSP } from '@/hooks/api/useCSP';
import { Button } from "@/components/common/button";
import { useNavigate } from "react-router-dom";

const FUND_BUCKETS = [CSPBucket.Savings, CSPBucket.Investment];

interface CSPBucketCardProps {
  cspBucket: CSPBucket;
  cspBudgets: CSPCategoryBudget[];
  currentMonthString: string;
}

export function CSPBucketCard({ cspBucket, cspBudgets, currentMonthString }: CSPBucketCardProps) {
  const [year, month] = currentMonthString.split('-').map(Number);
  const { startDate, endDate } = getMonthBoundaries(year, month - 1);
  const { data: transactionPages } = useTransactions({ startDate, endDate });
  const { data: csp } = useCSP();
  const navigate = useNavigate();

  const transactions = useMemo(() =>
    transactionPages?.pages.flatMap(p => p.transactions ?? []) ?? [],
    [transactionPages]
  );

  // Calculate totals using our transaction utility
  const { totalSpent, totalBudgeted } = useMemo(() => {
    const totalSpent = sumTransactions(transactions, {
      includeBuckets: [cspBucket],
      excludeFundAllocated: true,
      includeHidden: false,
      csp
    });

    const totalBudgeted = cspBudgets.reduce((sum, budget) => sum + budget.amount, 0);

    return { totalSpent, totalBudgeted };
  }, [cspBudgets, cspBucket, transactions, csp]);

  return (
    <Card className="flex-1 md:h-full! xl:h-fit!">
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
      <CardContent className="flex flex-col p-0! divide-y divide-gray-200 md:h-full! xl:h-fit!">
        {cspBudgets.map((budget) => (
          <div key={budget.category} className="px-4 py-1.5">
            <CSPBudgetRow
              budget={budget}
              bucket={cspBucket as CSPBucket}
              currentMonthString={currentMonthString}
            />
          </div >
        ))}
        <div className="p-2 flex">
          { FUND_BUCKETS.includes(cspBucket)
            ? (
              <Button variant="secondary" className="flex-1" onClick={() => navigate('/funds')}>
                Manage funds
              </Button>
            ) : (
              <div className="flex-1">
                <AddCategoryRow bucket={cspBucket} />
              </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
