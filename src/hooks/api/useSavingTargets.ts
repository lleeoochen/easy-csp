import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SavingTargetsService } from '../../services/savingTargetsService';
import { useFinancialInstitutions } from './useFinancialInstitutions';
import { parseAccountOptionValue } from '../../utils/accountUtils';
import { removeItemFromCache } from './cacheUtils';

export const SAVING_TARGETS_QUERY_KEY = ['savingTargets'];

export const useSavingTargets = () => {
  return useQuery({
    queryKey: SAVING_TARGETS_QUERY_KEY,
    queryFn: async () => {
      const result = await SavingTargetsService.listSavingTargets();
      if (!result.success) throw new Error(result.message ?? 'Failed to fetch saving targets');
      return result.savingTargets!;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useAddSavingTarget = () => {
  const queryClient = useQueryClient();
  const { data: institutions = [] } = useFinancialInstitutions();

  return useMutation({
    mutationFn: async ({ name, targetAmount, selectedAccount }: { name: string; targetAmount: number; selectedAccount: string }) => {
      const { institutionId, accountId } = parseAccountOptionValue(selectedAccount);
      const institution = institutions.find(i => i.institutionId === institutionId);
      const account = institution?.accounts.find(a => a.accountId === accountId);

      if (!institution || !account) throw new Error('Invalid institution selected');

      const result = await SavingTargetsService.addSavingTarget(name, targetAmount, institution.institutionId, accountId);
      if (!result.success) throw new Error(result.message ?? 'Failed to add saving target');

      return {
        ...result.savingTarget!,
        institutionName: institution.institutionName,
        accountName: account.accountName,
        currentAmount: account.balance,
      };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SAVING_TARGETS_QUERY_KEY }),
  });
};

export const useUpdateSavingTarget = () => {
  const queryClient = useQueryClient();
  const { data: institutions = [] } = useFinancialInstitutions();

  return useMutation({
    mutationFn: async ({ id, name, targetAmount, selectedAccount }: { id: string; name: string; targetAmount: number; selectedAccount: string }) => {
      const { institutionId, accountId } = parseAccountOptionValue(selectedAccount);
      const institution = institutions.find(i => i.institutionId === institutionId);
      const account = institution?.accounts.find(a => a.accountId === accountId);

      if (!institution || !account) throw new Error('Invalid institution selected');

      const result = await SavingTargetsService.updateSavingTarget(id, {
        name,
        targetAmount,
        financialInstitutionId: institution.institutionId,
        accountId,
      });
      if (!result.success) throw new Error(result.message ?? 'Failed to update saving target');

      return {
        ...result.savingTarget!,
        institutionName: institution.institutionName,
        accountName: account.accountName,
        currentAmount: account.balance,
      };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SAVING_TARGETS_QUERY_KEY }),
  });
};

export const useDeleteSavingTarget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await SavingTargetsService.removeSavingTarget(id);
      if (!result.success) throw new Error(result.message ?? 'Failed to delete saving target');
    },
    onSuccess: (_data, id) => {
      removeItemFromCache(queryClient, SAVING_TARGETS_QUERY_KEY, id);
    },
  });
};
