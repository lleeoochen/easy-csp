import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConsciousSpendingPlanService } from '../../services/consciousSpendingPlanService';
import type { CSPBucket } from '@easy-csp/shared-types';

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
    mutationFn: ({ bucket, category, amount, isTrackingSavingTarget, name }: { bucket: CSPBucket; category: string; amount: number; isTrackingSavingTarget?: boolean; name?: string }) =>
      ConsciousSpendingPlanService.addCSPItem(bucket, category, amount, isTrackingSavingTarget, name).then(r => {
        if (!r.success) throw new Error(r.message ?? 'Failed to add CSP item');
        return r.csp!;
      }),
    onSuccess: (csp) => queryClient.setQueryData(CSP_QUERY_KEY, csp),
  });
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
