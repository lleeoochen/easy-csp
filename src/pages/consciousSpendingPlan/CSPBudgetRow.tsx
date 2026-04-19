import { useMemo } from "react";
import { CSPBucket, type CSPCategoryBudget } from "@easy-csp/shared-types";
import { CSPBudgetActionMenu } from "./CSPBudgetActionMenu";
import { useRegularBudget } from "../../hooks/useCSPBudgetRow";
import { useTransactions } from "../../hooks/api/useTransactions";
import { getMonthBoundaries } from "../../utils/dateUtils";
import { sumTransactions } from "../../utils/transactionUtils";
import { useAccounts } from "../../hooks/api/useAccounts";
import { useCSP } from "../../hooks/api/useCSP";

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
  const { data: accounts = [] } = useAccounts();
  const { data: csp } = useCSP();

  const transactions = useMemo(() =>
    transactionPages?.pages.flatMap(p => p.transactions ?? []) ?? [],
    [transactionPages]
  );

  // Calculate spending using our transaction utility
  const actualAmount = useMemo(() => {
    if (!budget.isTrackingAccount) {
      return sumTransactions(transactions, {
        excludeFundAllocated: true,
        category: budget.category,
        csp,
        includeHidden: false,
      });
    }

    // For tracking accounts, find the linked account
    const account = accounts.find(a => a.id === budget.category);
    if (!account) {
      return 0;
    }

    // For manual accounts, sum transactions by accountId
    if (account.isManual) {
      return Math.abs(sumTransactions(transactions, {
        csp,
        accountId: account.id,
        includeHidden: false,
        inflowOnly: true
      }));
    }

    // For linked accounts, sum by institutionId and accountId
    return Math.abs(sumTransactions(transactions, {
      accountId: account.accountId,
      includeHidden: false,
      inflowOnly: true,
    }));

  }, [budget.isTrackingAccount, budget.category, transactions, csp, accounts]);

  // Use the hooks for category names only
  const { getCategoryName } = useRegularBudget(budget.category);

  const categoryName = getCategoryName();
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