import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FundsService } from '../../services/fundsService';
import { useFinancialInstitutions } from './useFinancialInstitutions';
import { parseAccountOptionValue } from '../../utils/accountUtils';
import { removeItemFromCache } from './cacheUtils';
import { MANUAL_ACCOUNT_VALUE } from '../../components/common/AccountSelector';
import { FundType } from '@easy-csp/shared-types';

export const FUNDS_QUERY_KEY = ['funds'];

export const useFunds = () => {
  return useQuery({
    queryKey: FUNDS_QUERY_KEY,
    queryFn: async () => {
      const result = await FundsService.listFunds();
      if (!result.success) throw new Error(result.message ?? 'Failed to fetch funds');
      return result.funds!;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useAddFund = () => {
  const queryClient = useQueryClient();
  const { data: institutions = [] } = useFinancialInstitutions();

  return useMutation({
    mutationFn: async ({ name, type, targetAmount, selectedAccount }: { name: string; type: FundType; targetAmount: number; selectedAccount?: string }) => {
      // If selectedAccount is undefined, empty, or "manual", create manual fund
      if (!selectedAccount || selectedAccount === MANUAL_ACCOUNT_VALUE) {
        const result = await FundsService.addFund(name, type, targetAmount);
        if (!result.success) throw new Error(result.message ?? 'Failed to add fund');

        return {
          ...result.fund!,
          institutionName: '',
          accountName: '',
          currentAmount: 0,
        };
      }

      // Otherwise, create account-based fund (existing logic)
      const { institutionId, accountId } = parseAccountOptionValue(selectedAccount);
      const institution = institutions.find(i => i.institutionId === institutionId);
      const account = institution?.accounts.find(a => a.accountId === accountId);

      if (!institution || !account) throw new Error('Invalid institution selected');

      const result = await FundsService.addFund(name, type, targetAmount, institution.institutionId, accountId);
      if (!result.success) throw new Error(result.message ?? 'Failed to add fund');

      return {
        ...result.fund!,
        institutionName: institution.institutionName,
        accountName: account.accountName,
        currentAmount: account.balance,
      };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FUNDS_QUERY_KEY }),
  });
};

export const useUpdateFund = () => {
  const queryClient = useQueryClient();
  const { data: institutions = [] } = useFinancialInstitutions();

  return useMutation({
    mutationFn: async ({ id, name, type, targetAmount, selectedAccount }: { id: string; name: string; type: FundType; targetAmount: number; selectedAccount: string }) => {
      // If selectedAccount is "manual", update to manual fund
      if (selectedAccount === MANUAL_ACCOUNT_VALUE) {
        const result = await FundsService.updateFund(id, {
          name,
          type,
          targetAmount,
          financialInstitutionId: undefined,
          accountId: undefined,
        });
        if (!result.success) throw new Error(result.message ?? 'Failed to update fund');

        return {
          ...result.fund!,
          institutionName: '',
          accountName: '',
          currentAmount: result.fund!.currentBalance ?? 0,
        };
      }

      // Otherwise, update to account-based fund
      const { institutionId, accountId } = parseAccountOptionValue(selectedAccount);
      const institution = institutions.find(i => i.institutionId === institutionId);
      const account = institution?.accounts.find(a => a.accountId === accountId);

      if (!institution || !account) throw new Error('Invalid institution selected');

      const result = await FundsService.updateFund(id, {
        name,
        type,
        targetAmount,
        financialInstitutionId: institution.institutionId,
        accountId,
      });
      if (!result.success) throw new Error(result.message ?? 'Failed to update fund');

      return {
        ...result.fund!,
        institutionName: institution.institutionName,
        accountName: account.accountName,
        currentAmount: account.balance,
      };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FUNDS_QUERY_KEY }),
  });
};

export const useDeleteFund = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await FundsService.removeFund(id);
      if (!result.success) throw new Error(result.message ?? 'Failed to delete fund');
    },
    onSuccess: (_data, id) => {
      removeItemFromCache(queryClient, FUNDS_QUERY_KEY, id);
    },
  });
};

export const useSetFundBalance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ fundId, newBalance }: { fundId: string; newBalance: number }) => {
      const result = await FundsService.setFundBalance(fundId, newBalance);
      if (!result.success) throw new Error(result.message ?? 'Failed to set fund balance');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FUNDS_QUERY_KEY });
    },
  });
};
