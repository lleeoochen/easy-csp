import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FinancialInstitutionsService } from '@/services/financialInstitutionsService';
import { type FinancialInstitution, FinancialInstitutionStatus } from '@easy-csp/shared-types';
import { removeItemFromCache } from './cacheUtils';

export const FINANCIAL_INSTITUTIONS_QUERY_KEY = ['financialInstitutions'];

const POLL_INTERVAL_MS = 5_000;
const POLL_ROUNDS = 12; // poll for up to 60s

export const useFinancialInstitutions = () => {
  return useQuery({
    queryKey: FINANCIAL_INSTITUTIONS_QUERY_KEY,
    queryFn: () => FinancialInstitutionsService.listFinancialInstitutions(),
    staleTime: 1000 * 60 * 5,
  });
};

const startPolling = (queryClient: ReturnType<typeof useQueryClient>) => {
  let round = 0;
  const tick = async () => {
    if (round >= POLL_ROUNDS) return;
    round++;
    await queryClient.refetchQueries({ queryKey: FINANCIAL_INSTITUTIONS_QUERY_KEY, type: 'active' });
    setTimeout(tick, POLL_INTERVAL_MS);
  };
  setTimeout(tick, POLL_INTERVAL_MS);
};

export const useRefreshFinancialInstitutions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => FinancialInstitutionsService.refreshFinancialInstitutions(),
    onMutate: () => {
      // Optimistically set all institutions to AwaitSync so UI updates immediately
      queryClient.setQueryData(FINANCIAL_INSTITUTIONS_QUERY_KEY, (old: FinancialInstitution[] | undefined) =>
        old?.map(inst => ({ ...inst, status: FinancialInstitutionStatus.AwaitSync })) ?? []
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCIAL_INSTITUTIONS_QUERY_KEY });
      startPolling(queryClient);
    },
  });
};

export const useRetrySyncInstitution = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) => FinancialInstitutionsService.retrySyncInstitution(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCIAL_INSTITUTIONS_QUERY_KEY });
      startPolling(queryClient);
    },
  });
};

export const useRemoveInstitution = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) => FinancialInstitutionsService.removeInstitution(docId),
    onSuccess: (_data, docId) => {
      removeItemFromCache(queryClient, FINANCIAL_INSTITUTIONS_QUERY_KEY, docId);
    },
  });
};

export const useMarkInstitutionForResync = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) => FinancialInstitutionsService.markInstitutionForResync(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCIAL_INSTITUTIONS_QUERY_KEY });
      startPolling(queryClient);
    },
  });
};

/**
 * React Query mutation hook for permanently deleting a financial institution
 *
 * Calls the deleteFinancialInstitution cloud function which:
 * - Revokes Plaid access token
 * - Deletes Secret Manager secret
 * - Deletes all accounts under the institution
 * - Deletes the institution document
 *
 * Blocks if any account under the institution has funds linked.
 */
export const useDeleteFinancialInstitution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ institutionId }: { institutionId: string }) => {
      const { httpsCallable, getFunctions } = await import('firebase/functions');
      const functions = getFunctions();
      const fn = httpsCallable<{ institutionId: string }, { success: true; deletedAccountIds: string[] }>(
        functions,
        'deleteFinancialInstitution'
      );
      const result = await fn({ institutionId });
      return result.data;
    },
    onMutate: async ({ institutionId }) => {
      await queryClient.cancelQueries({ queryKey: FINANCIAL_INSTITUTIONS_QUERY_KEY });
      const previous = queryClient.getQueryData<FinancialInstitution[]>(FINANCIAL_INSTITUTIONS_QUERY_KEY);
      queryClient.setQueryData<FinancialInstitution[]>(FINANCIAL_INSTITUTIONS_QUERY_KEY, (old) =>
        old?.map((inst) =>
          inst.institutionId === institutionId ? { ...inst, status: FinancialInstitutionStatus.Deleting } : inst
        )
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FINANCIAL_INSTITUTIONS_QUERY_KEY, context.previous);
      }
    },
    onSuccess: (_data, { institutionId }) => {
      queryClient.setQueryData<FinancialInstitution[]>(FINANCIAL_INSTITUTIONS_QUERY_KEY, (old) =>
        old?.filter((inst) => inst.institutionId !== institutionId)
      );
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['accounts', 'withInfo'] });
    },
  });
};
