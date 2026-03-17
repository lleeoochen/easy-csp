import { useMemo } from "react";
import type { CSPCategoryBudget } from "@easy-csp/shared-types";
import { camelCaseToSentence } from "../utils/stringUtils";
import { useSavingTargets } from "./api/useSavingTargets";
import { useCSP } from "./api/useCSP";

/**
 * Returns a flat dictionary of categoryId → display name,
 * derived from the user's CSP document and saving targets.
 * No longer uses the static CSPCategory enum.
 */
export const useCategoryMap = (): Record<string, string> => {
  const { data: csp } = useCSP();
  const { data: savingTargets = [] } = useSavingTargets();

  return useMemo(() => {
    const map: Record<string, string> = {};

    if (csp) {
      for (const items of Object.values(csp)) {
        for (const item of items as CSPCategoryBudget[]) {
          map[item.category] = item.name ?? camelCaseToSentence(item.category);
        }
      }
    }

    for (const target of savingTargets) {
      map[target.id] = target.name;
    }

    return map;
  }, [csp, savingTargets]);
};

/**
 * Returns true if the given categoryId belongs to a saving target.
 * Requires the set of known CSP category IDs (from the CSP document) to distinguish.
 */
export const isSavingTargetCategory = (categoryId: string, cspCategoryIds: Set<string>): boolean =>
  !cspCategoryIds.has(categoryId);
