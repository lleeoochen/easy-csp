import { useMemo } from "react";
import { CSPBucket, type CSPCategoryBudget, type Fund } from "@easy-csp/shared-types";
import { CSPBudgetActionMenu } from "./CSPBudgetActionMenu";
import { useBudgetFromFund, useRegularBudget } from "../../hooks/useCSPBudgetRow";
import { useTransactions } from "../../hooks/api/useTransactions";
import { getMonthBoundaries } from "../../utils/dateUtils";
import { sumTransactions } from "../../utils/transactionUtils";
import { useFunds } from "../../hooks/api/useFunds";
import { useCSP } from "../../hooks/api/useCSP";

const isManualFund = (fund: Fund) => {
  return !fund.financialInstitutionId || !fund.accountId;
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
  const { data: funds = [] } = useFunds();
  const { data: csp } = useCSP();

  const transactions = useMemo(() =>
    transactionPages?.pages.flatMap(p => p.transactions ?? []) ?? [],
    [transactionPages]
  );

  // Calculate spending using our transaction utility
  const actualAmount = useMemo(() => {
    if (!budget.isTrackingFund) {
      return sumTransactions(transactions, {
        excludeWithFund: true,
        category: budget.category,
        csp,
        includeHidden: false
      });
    }

    const fund = funds.find(st => st.id === budget.category);
    if (!fund) {
      return 0;
    }

    if (isManualFund(fund)) {
      return Math.abs(sumTransactions(transactions, {
        csp,
        fundId: fund.id,
        includeHidden: false,
        inflowOnly: true
      }));
    }

    return Math.abs(sumTransactions(transactions, {
      institutionId: fund.financialInstitutionId,
      accountId: fund.accountId,
      includeHidden: false,
      inflowOnly: true
    }));

  }, [budget.isTrackingFund, budget.category, transactions, csp, funds]);

  // Use the hooks for category names only
  const { getCategoryName } = useRegularBudget(budget.category);
  const { getCategoryName: getCategoryNameFromFund } = useBudgetFromFund(budget.category);

  const categoryName = budget.isTrackingFund ? getCategoryNameFromFund() : getCategoryName();
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