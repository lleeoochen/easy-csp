import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConsciousSpendingPlanService } from '@/services/consciousSpendingPlanService';
import type { CSPBucket } from '@easy-csp/shared-types';
import { useMemo } from 'react';
import { camelCaseToSentence } from '@/utils/stringUtils';
import { useFunds } from '@/hooks/api/useFunds';

export const CSP_QUERY_KEY = ['csp'];

export const useCSP = () => {
  return useQuery({
    queryKey: CSP_QUERY_KEY,
    queryFn: async () => {
      const result = await ConsciousSpendingPlanService.getCSP();
      if (!result.success) throw new Error(result.message ?? 'Failed to fetch CSP');
      return result.csp!;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateCSPItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bucket, category, amount }: { bucket: CSPBucket; category: string; amount: number }) =>
      ConsciousSpendingPlanService.updateCSPItem(bucket, category, amount).then(r => {
        if (!r.success) throw new Error(r.message ?? 'Failed to update CSP item');
        return r.csp!;
      }),
    onSuccess: (csp) => queryClient.setQueryData(CSP_QUERY_KEY, csp),
  });
};

export const useAddCSPItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bucket, category, amount, isTrackingFund, name }: { bucket: CSPBucket; category: string; amount: number; isTrackingFund?: boolean; name?: string }) =>
      ConsciousSpendingPlanService.addCSPItem(bucket, category, amount, isTrackingFund, name).then(r => {
        if (!r.success) throw new Error(r.message ?? 'Failed to add CSP item');
        return r.csp!;
      }),
    onSuccess: (csp) => queryClient.setQueryData(CSP_QUERY_KEY, csp),
  });
};

/**
 * Returns a map of category ID → display name derived from CSP data.
 * For account-linked categories, uses the account's display name.
 * Use `categoryNameMap.get(id) ?? camelCaseToSentence(id)` at the call site.
 */
export const useCategoryNameMap = (): ReadonlyMap<string, string> => {
  const { data: csp } = useCSP();
  const { data: funds = [] } = useFunds();

  return useMemo(() => {
    const map = new Map<string, string>();
    if (!csp) return map;
    for (const items of Object.values(csp)) {
      for (const item of items) {
        if (item.isTrackingFund) {
          const fund = funds.find(fund => fund.id === item.category);
          map.set(item.category, fund?.name ?? item.name ?? camelCaseToSentence(item.category));
        } else {
          map.set(item.category, item.name ?? camelCaseToSentence(item.category));
        }
      }
    }
    return map;
  }, [csp, funds]);
};

/**
 * Returns a map of category ID → display name, excluding account IDs.
 * Use this for category selectors where users assign transaction categories.
 */
export const useRegularCategoryNameMap = (): ReadonlyMap<string, string> => {
  const { data: csp } = useCSP();

  return useMemo(() => {
    const map = new Map<string, string>();
    if (!csp) return map;
    for (const items of Object.values(csp)) {
      for (const item of items) {
        // Exclude account-tracking categories
        if (!item.isTrackingFund) {
          map.set(item.category, item.name ?? camelCaseToSentence(item.category));
        }
      }
    }
    return map;
  }, [csp]);
};

export const useDeleteCSPItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bucket, category }: { bucket: CSPBucket; category: string }) =>
      ConsciousSpendingPlanService.deleteCSPItem(bucket, category).then(r => {
        if (!r.success) throw new Error(r.message ?? 'Failed to delete CSP item');
        return r.csp!;
      }),
    onSuccess: (csp) => queryClient.setQueryData(CSP_QUERY_KEY, csp),
  });
};
