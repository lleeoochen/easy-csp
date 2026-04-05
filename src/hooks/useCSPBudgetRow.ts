import { useCallback } from "react";
import { useCategoryMap } from "./useCategoryMap";

export const useBudgetFromFund = (category: string) => {
  const categoryMap = useCategoryMap();

  const getCategoryName = useCallback(() => {
    return categoryMap[category] ?? category;
  }, [category, categoryMap]);

  return { getCategoryName };
};

export const useRegularBudget = (category: string) => {
  const categoryMap = useCategoryMap();

  const getCategoryName = useCallback(() => {
    return categoryMap[category] ?? category;
  }, [category, categoryMap]);

  return { getCategoryName };
};