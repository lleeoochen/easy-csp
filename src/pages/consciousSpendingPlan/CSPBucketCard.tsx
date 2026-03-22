import { useState, useCallback, useMemo } from "react";
import { CSPBucket, type CSPCategoryBudget } from "@easy-csp/shared-types";
import { Card, CardContent, CardHeader } from "../../components/common/card";
import { camelCaseToSentence } from "../../utils/stringUtils";
import { formatCurrency } from "../../utils/financialUtils";
import { CSPBudgetRow } from "./CSPBudgetRow";
import { AddCategoryRow } from "./AddCategoryRow";

// const bucketColor = {
//   [CSPBucket.FixedCost]: 'bg-orange-300',
//   [CSPBucket.Savings]: 'bg-green-300',
//   [CSPBucket.Investment]: 'bg-blue-300',
//   [CSPBucket.GuildFreeSpending]: 'bg-red-300',
// };

interface CSPBucketCardProps {
  cspBucket: CSPBucket;
  cspBudgets: CSPCategoryBudget[];
  currentMonthString: string;
  showAddRow?: boolean;
}

export function CSPBucketCard({ cspBucket, cspBudgets, currentMonthString, showAddRow = true }: CSPBucketCardProps) {
  // State to store data from each child row
  const [rowData, setRowData] = useState<Record<string, { spending: number; budget: number }>>({});

  // Stable callback function that child components will call
  const handleRowDataChange = useCallback((category: string, spending: number, budget: number) => {
    setRowData(prev => ({
      ...prev,
      [category]: { spending, budget }
    }));
  }, []);

  // Calculate totals from aggregated child data
  const { totalSpent, totalBudgeted } = useMemo(() => {
    const totalSpent = Object.values(rowData).reduce((sum, { spending }) => sum + spending, 0);
    const totalBudgeted = Object.values(rowData).reduce((sum, { budget }) => sum + budget, 0);
    return { totalSpent, totalBudgeted };
  }, [rowData]);
  // const percentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  // const isOverBudget = totalSpent > totalBudgeted;

  return (
    <Card className="flex-1">
      <CardHeader className={`flex flex-row items-stretch`}>
        {/* <div className={`${bucketColor[cspBucket]} w-2 mr-2 my-1.5 rounded-full`}></div> */}
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
              onDataChange={handleRowDataChange}
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
