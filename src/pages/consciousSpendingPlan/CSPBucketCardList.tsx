import { CSPBucket, CSPCategory, getCSPBucket } from "@easy-csp/shared-types";
import { CSPBucketCard } from "./CSPBucketCard";
import { useAppSelector } from "../../hooks/useRedux";
import { formatCurrency } from "../../utils/financialUtils";
import { Card } from "../../components/common/card";

export function CSPBucketCardList() {
  const consciousSpendingPlanState = useAppSelector(state => state.consciousSpendingPlan);
  const transactionState = useAppSelector(state => state.transaction);
  const consciousSpendingPlan = consciousSpendingPlanState.consciousSpendingPlan;
  const transactions = transactionState.transactions;

  const totalIncomeTarget = Object.entries(consciousSpendingPlan)
    .filter(([bucket]) => bucket === CSPBucket.Income)
    .reduce((total, entry) => {
      const [, categoryBudgets] = entry;
      return total + categoryBudgets.reduce((subtotal, categoryBudget) => subtotal + categoryBudget.amount, 0);
    }, 0);

  const spendingBuckets = Object
    .entries(consciousSpendingPlan)
    .filter(([bucket]) => bucket !== CSPBucket.Income && bucket !== CSPBucket.Ignored);

  const totalSpendingTarget = Object
    .entries(consciousSpendingPlan)
    .filter(([bucket]) => bucket !== CSPBucket.Income && bucket !== CSPBucket.Ignored)
    .reduce((total, entry) => {
      const [, categoryBudgets] = entry;
      return total + categoryBudgets.reduce((subtotal, categoryBudget) => subtotal + categoryBudget.amount, 0);
    }, 0);

  let totalIncome = 0;
  let totalSpending = 0;

  transactions.forEach(transaction => {
    const cspBucket = getCSPBucket(transaction.category as CSPCategory);
    if (transaction.hidden) {
      return;
    }

    switch (cspBucket) {
      case CSPBucket.Ignored:
        break;
      case CSPBucket.Income:
        totalIncome += transaction.amount;
        break;
      default:
        totalSpending += transaction.amount;
    }
  });

  return (
    <div className="p-2">
      {/* Summary Cards */}
      <div className="gap-3 hidden">
        <Card className="flex-1 px-6 py-4 p-3 text-center bg-cardHeader">
          <div className="text-md font-medium">Total Income</div>
          <div className={`text-2xl font-medium`}>{formatCurrency(totalIncome)}</div>
          <div className="text-md font-medium">{formatCurrency(totalIncomeTarget)}</div>
        </Card>
        <Card className="flex-1 px-6 py-4 p-3 text-center bg-cardHeader">
          <div className="text-md font-medium">Total Spending</div>
          <div className={`text-2xl font-medium`}>{formatCurrency(totalSpending)}</div>
          <div className="text-md font-medium">{formatCurrency(totalSpendingTarget)}</div>
        </Card>
      </div>

      {/* Category Sections */}
      <div className="space-y-2">
        {spendingBuckets.map(([cspBucket, cspBudgets]) => (
          <CSPBucketCard
            key={cspBucket}
            cspBucket={cspBucket}
            cspBudgets={cspBudgets}
          />
        ))}
      </div>
    </div>
  );
}
