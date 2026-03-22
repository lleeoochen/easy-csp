import { useEffect } from "react";
import { CSPBucket, type CSPCategoryBudget } from "@easy-csp/shared-types";
import { CSPBudgetActionMenu } from "./CSPBudgetActionMenu";
import { useBudgetFromSavingTarget, useRegularBudget } from "../../hooks/useCSPBudgetRow";
import { useTransactions } from "../../hooks/api/useTransactions";
import { getMonthBoundaries } from "../../utils/dateUtils";


interface CSPBudgetRowProps {
  budget: CSPCategoryBudget;
  bucket: CSPBucket;
  onDataChange: (category: string, spending: number, budget: number) => void;
  currentMonthString: string;
}

export const CSPBudgetRow = ({ budget, bucket, onDataChange, currentMonthString }: CSPBudgetRowProps) => {
  const [year, month] = currentMonthString.split('-').map(Number);
  const { startDate, endDate } = getMonthBoundaries(year, month - 1);
  const { data: transactionPages } = useTransactions({ startDate, endDate });
  const transactions = transactionPages?.pages.flatMap(p => p.transactions ?? []) ?? [];

  const {
    getCategoryName,
    getAmount
  } = useRegularBudget(budget.category, transactions, bucket === CSPBucket.Savings);

  const {
    getCategoryName: getCategoryNameFromSavingTarget,
    getAmount: getAmountFromSavingTarget
  } = useBudgetFromSavingTarget(budget.category, transactions);

  const categoryName = budget.isTrackingSavingTarget ? getCategoryNameFromSavingTarget() : getCategoryName();
  const actualAmount = budget.isTrackingSavingTarget ? getAmountFromSavingTarget() : getAmount();
  const budgetAmount = budget.amount;
  const amountLeft = budgetAmount - actualAmount;
  const isOverBudget = budget.isTrackingSavingTarget ? false : actualAmount > budgetAmount;

  // Report data changes to parent
  useEffect(() => {
    onDataChange(budget.category, actualAmount, budgetAmount);
  }, [onDataChange, budget.category, actualAmount, budgetAmount]);

  return (
    <CSPBudgetActionMenu
      budget={budget}
      bucket={bucket}
      categoryName={categoryName}
      actualAmount={actualAmount}
      budgetAmount={budgetAmount}
      amountLeft={amountLeft}
      isOverBudget={isOverBudget}
      currentMonth={currentMonthString}
    />
  );
}
