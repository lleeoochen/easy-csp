import { useMemo, useCallback } from "react";
import type { Transaction } from "@easy-csp/shared-types";
import { useSavingTargets } from "./api/useSavingTargets";
import { useCategoryMap } from "./useCategoryMap";

export const useBudgetFromSavingTarget = (category: string, transactions: Transaction[]) => {
  const { data: savingTargets = [] } = useSavingTargets();
  const categoryMap = useCategoryMap();

  const savingTarget = useMemo(() => {
    return savingTargets.find(savingTarget => savingTarget.id === category);
  }, [category, savingTargets]);

  const getCategoryName = useCallback(() => {
    return categoryMap[category] ?? category;
  }, [category, categoryMap]);

  // Calculate spending for this category (tracks money flowing into the linked account)
  const getAmount = useCallback(() => {
    if (!savingTarget) return 0;

    return transactions
      .filter(t =>
        t.institutionId === savingTarget.financialInstitutionId &&
        t.accountId === savingTarget.accountId &&
        !t.hidden &&
        t.amount < 0
      )
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [savingTarget, transactions]);

  return { getCategoryName, getAmount };
};

export const useRegularBudget = (category: string, transactions: Transaction[]) => {
  const categoryMap = useCategoryMap();

  const getCategoryName = useCallback(() => {
    return categoryMap[category] ?? category;
  }, [category, categoryMap]);

  const getAmount = useCallback(() => {
    return transactions
      .filter(t => t.category === category && !t.hidden)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [category, transactions]);

  return { getCategoryName, getAmount };
};