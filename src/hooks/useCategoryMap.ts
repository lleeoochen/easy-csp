import { useCategoryNameMap, useCSP } from "./api/useCSP";
import { useMemo } from "react";
import type { CSPCategoryBudget } from "@easy-csp/shared-types";

/**
 * Returns a flat dictionary of categoryId → display name,
 * derived from the user's CSP document and saving targets.
 */
export const useCategoryMap = (): Record<string, string> => {
  const map = useCategoryNameMap();
  return Object.fromEntries(map);
};

/**
 * Returns the set of category IDs that are tracking a saving target.
 * Prefer this over isSavingTargetCategory — it reads directly from CSP data.
 */
export const useSavingTargetCategoryIds = (): ReadonlySet<string> => {
  const { data: csp } = useCSP();
  return useMemo(() => {
    const ids = new Set<string>();
    if (!csp) return ids;
    for (const items of Object.values(csp)) {
      for (const item of items as CSPCategoryBudget[]) {
        if (item.isTrackingSavingTarget) ids.add(item.category);
      }
    }
    return ids;
  }, [csp]);
};

/**
 * Returns the set of category IDs that belong to the ignored bucket.
 */
export const useIgnoredCategoryIds = (): ReadonlySet<string> => {
  const { data: csp } = useCSP();
  return useMemo(() => {
    const ids = new Set<string>();
    if (!csp?.ignored) return ids;
    for (const item of csp.ignored) {
      ids.add(item.category);
    }
    return ids;
  }, [csp]);
};
