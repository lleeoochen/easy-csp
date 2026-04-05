import { useMemo } from "react";
import { CSPBucket, type CSPCategoryBudget, type SavingTarget } from "@easy-csp/shared-types";
import { CSPBudgetActionMenu } from "./CSPBudgetActionMenu";
import { useBudgetFromSavingTarget, useRegularBudget } from "../../hooks/useCSPBudgetRow";
import { useTransactions } from "../../hooks/api/useTransactions";
import { getMonthBoundaries } from "../../utils/dateUtils";
import { sumTransactions } from "../../utils/transactionUtils";
import { useSavingTargets } from "../../hooks/api/useSavingTargets";
import { useCSP } from "../../hooks/api/useCSP";

const isManualSavingTarget = (savingTarget: SavingTarget) => {
  return !savingTarget.financialInstitutionId || !savingTarget.accountId;
};

const POSITIVE_BUCKETS = [CSPBucket.Savings, CSPBucket.Income, CSPBucket.Investment];

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
  const { data: csp } = useCSP();

  const transactions = useMemo(() =>
    transactionPages?.pages.flatMap(p => p.transactions ?? []) ?? [],
    [transactionPages]
  );

  // Calculate spending using our transaction utility
  const actualAmount = useMemo(() => {
    if (!budget.isTrackingSavingTarget) {
      return sumTransactions(transactions, {
        excludeWithSavingTarget: true,
        category: budget.category,
        csp,
        includeHidden: false
      });
    }

    const savingTarget = savingTargets.find(st => st.id === budget.category);
    if (!savingTarget) {
      return 0;
    }

    if (isManualSavingTarget(savingTarget)) {
      return Math.abs(sumTransactions(transactions, {
        debug: true,
        csp,
        includeHidden: false,
        inflowOnly: true
      }));
    }

    return Math.abs(sumTransactions(transactions, {
      institutionId: savingTarget.financialInstitutionId,
      accountId: savingTarget.accountId,
      includeHidden: false,
      inflowOnly: true
    }));

  }, [budget.isTrackingSavingTarget, budget.category, transactions, csp, savingTargets]);

  // Use the hooks for category names only
  const { getCategoryName } = useRegularBudget(budget.category);
  const { getCategoryName: getCategoryNameFromSavingTarget } = useBudgetFromSavingTarget(budget.category);

  const categoryName = budget.isTrackingSavingTarget ? getCategoryNameFromSavingTarget() : getCategoryName();
  const budgetAmount = budget.amount;

  return (
    <CSPBudgetActionMenu
      budget={budget}
      bucket={bucket}
      categoryName={categoryName}
      actualAmount={actualAmount}
      budgetAmount={budgetAmount}
      exceedingIsGood={POSITIVE_BUCKETS.includes(bucket)}
      currentMonth={currentMonthString}
    />
  );
};