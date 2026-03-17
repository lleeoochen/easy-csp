import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FinancialInstitutionsService } from '../../services/financialInstitutionsService';

export const FINANCIAL_INSTITUTIONS_QUERY_KEY = ['financialInstitutions'];

const POLL_INTERVAL_MS = 10_000;
const POLL_ROUNDS = 3;

export const useFinancialInstitutions = () => {
  return useQuery({
    queryKey: FINANCIAL_INSTITUTIONS_QUERY_KEY,
    queryFn: () => FinancialInstitutionsService.listFinancialInstitutions(),
    staleTime: 1000 * 60 * 5,
  });
};

const pollForSync = async (queryClient: ReturnType<typeof useQueryClient>) => {
  for (let i = 0; i < POLL_ROUNDS; i++) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    await queryClient.refetchQueries({ queryKey: FINANCIAL_INSTITUTIONS_QUERY_KEY });
  }
};

export const useRefreshFinancialInstitutions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await FinancialInstitutionsService.refreshFinancialInstitutions();
      await pollForSync(queryClient);
    },
  });
};

export const useRetrySyncInstitution = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (docId: string) => {
      await FinancialInstitutionsService.retrySyncInstitution(docId);
      await pollForSync(queryClient);
    },
  });
};

export const useRemoveInstitution = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) => FinancialInstitutionsService.removeInstitution(docId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FINANCIAL_INSTITUTIONS_QUERY_KEY }),
  });
};

export const useMarkInstitutionForResync = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) => FinancialInstitutionsService.markInstitutionForResync(docId),
    onSuccess: () => pollForSync(queryClient),
  });
};
