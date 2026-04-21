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
