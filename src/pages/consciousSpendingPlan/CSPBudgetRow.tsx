import { useMemo } from "react";
import { CSPBucket, type CSPCategoryBudget } from "@easy-csp/shared-types";
import { CSPBudgetActionMenu } from "./CSPBudgetActionMenu";
import { useBudgetFromSavingTarget, useRegularBudget } from "../../hooks/useCSPBudgetRow";
import { useTransactions } from "../../hooks/api/useTransactions";
import { getMonthBoundaries } from "../../utils/dateUtils";
import { sumTransactions } from "../../utils/transactionUtils";
import { useSavingTargets } from "../../hooks/api/useSavingTargets";

interface CSPBudgetRowProps {
  budget: CSPCategoryBudget;
  bucket: CSPBucket;
  currentMonthString: string;
}

export const CSPBudgetRow = ({ budget, bucket, currentMonthString }: CSPBudgetRowProps) => {
  const [year, month] = currentMonthString.split('-').map(Number);
  const { startDate, endDate } = getMonthBoundaries(year, month - 1);
  const { data: transactionPages } = useTransactions({ startDate, endDate });
  const { data: savingTargets = [] } = useSavingTargets();

  const transactions = useMemo(() =>
    transactionPages?.pages.flatMap(p => p.transactions ?? []) ?? [],
    [transactionPages]
  );

  // Calculate spending using our transaction utility
  const actualAmount = useMemo(() => {
    if (budget.isTrackingSavingTarget) {
      const savingTarget = savingTargets.find(st => st.id === budget.category);
      if (!savingTarget) return 0;

      return Math.abs(sumTransactions(transactions, {
        id: 'savingTargetRow',
        institutionId: savingTarget.financialInstitutionId,
        accountId: savingTarget.accountId,
        includeHidden: false,
        inflowOnly: true
      }));
    }

    return sumTransactions(transactions, {
      category: budget.category,
      excludeSavingTargets: true,
      includeHidden: false
    });
  }, [budget.category, budget.isTrackingSavingTarget, transactions, savingTargets]);

  // Use the hooks for category names only
  const { getCategoryName } = useRegularBudget(budget.category);
  const { getCategoryName: getCategoryNameFromSavingTarget } = useBudgetFromSavingTarget(budget.category);

  const categoryName = budget.isTrackingSavingTarget ? getCategoryNameFromSavingTarget() : getCategoryName();
  const budgetAmount = budget.amount;
  const isOverBudget = budget.isTrackingSavingTarget ? false : actualAmount > budgetAmount;

  return (
    <CSPBudgetActionMenu
      budget={budget}
      bucket={bucket}
      categoryName={categoryName}
      actualAmount={actualAmount}
      budgetAmount={budgetAmount}
      isOverBudget={isOverBudget}
      currentMonth={currentMonthString}
    />
  );
};