import { FundService } from '@/services/fundService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAddCSPItem, useUpdateCSPItem, useDeleteCSPItem, CSP_QUERY_KEY } from './useCSP';
import { CSPBucket, type ConsciousSpendingPlan } from '@easy-csp/shared-types';
import type { UI_Fund } from '@/types/uiTypes';

/**
 * Query key for funds data
 * Used for cache management and invalidation
 */
export const FUNDS_QUERY_KEY = ['funds'];

/**
 * Query key for funds with institution info
 * Used for cache management and invalidation
 */
export const FUNDS_WITH_INFO_QUERY_KEY = ['funds', 'withInfo'];

/**
 * React Query hook for fetching all user funds
 *
 * Returns all funds (both manual and Plaid-linked) owned by the authenticated user.
 * Funds are returned as-is from Firestore without additional denormalization.
 *
 * @returns UseQueryResult containing array of Account objects
 *
 * @example
 * const { data: funds, isLoading, error } = useFunds();
 *
 * if (isLoading) return <div>Loading funds...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return (
 *   <div>
 *     {funds?.map(account => (
 *       <div key={account.id}>{account.accountName}: ${account.balance}</div>
 *     ))}
 *   </div>
 * );
 */
export const useFunds = () => {
  return useQuery({
    queryKey: FUNDS_QUERY_KEY,
    queryFn: async () => {
      return await FundService.listFunds();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - funds don't change frequently
  });
};

/**
 * React Query mutation hook for creating a new fund
 *
 * Creates a new fund linked to an existing account for tracking savings or investment goals.
 * Automatically creates a corresponding CSP entry for monthly contribution tracking.
 * On success, invalidates both funds and CSP caches to trigger refetches.
 *
 * @returns UseMutationResult with mutate function and loading/error states
 *
 * @example
 * const { mutate: createFund, isPending, error } = useCreateFund();
 *
 * const handleCreate = () => {
 *   createFund(
 *     {
 *       name: 'Emergency Fund',
 *       type: 'saving',
 *       accountId: 123,
 *       targetAmount: 10000.00,
 *       monthlyContribution: 500.00
 *     },
 *     {
 *       onSuccess: (fundId) => {
 *         console.log('Fund created:', fundId);
 *       },
 *       onError: (error) => {
 *         console.error('Failed to create fund:', error);
 *       }
 *     }
 *   );
 * };
 */
export const useCreateFund = () => {
  const queryClient = useQueryClient();
  const addCSPItem = useAddCSPItem();

  return useMutation({
    mutationFn: async ({
      name,
      type,
      accountId,
      targetAmount,
      monthlyContribution = 0,
    }: {
      name: string;
      type: 'saving' | 'investment';
      accountId: string;
      targetAmount?: number;
      monthlyContribution?: number;
    }) => {
      // Step 1: Create the fund
      const fundId = await FundService.createFund(name, type, accountId, targetAmount);

      // Step 2: Create corresponding CSP entry
      const bucket = type === 'saving' ? CSPBucket.Savings : CSPBucket.Investment;
      await addCSPItem.mutateAsync({
        bucket,
        category: fundId,
        amount: monthlyContribution,
        isTrackingFund: true,
      });

      return fundId;
    },
    onSuccess: () => {
      // Invalidate both funds and CSP queries
      queryClient.invalidateQueries({ queryKey: FUNDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FUNDS_WITH_INFO_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CSP_QUERY_KEY });
    },
  });
};

/**
 * React Query mutation hook for updating a fund
 *
 * Updates fund information including name, type, linked account, and target amount.
 * Automatically syncs the fund name to the corresponding CSP entry.
 * On success, invalidates both funds and CSP caches to trigger refetches.
 *
 * @returns UseMutationResult with mutate function and loading/error states
 */
export const useUpdateFund = () => {
  const queryClient = useQueryClient();
  const updateCSPItem = useUpdateCSPItem();

  return useMutation({
    mutationFn: async ({
      fundId,
      updates,
    }: {
      fundId: string;
      updates: {
        name?: string;
        type?: 'saving' | 'investment';
        accountId?: string;
        targetAmount?: number | null;
        monthlyContribution?: number;
      };
    }) => {
      // Step 1: Get current fund data to know the accountId and type
      const funds = queryClient.getQueryData<Array<UI_Fund>>(FUNDS_QUERY_KEY) || [];
      const currentFund = funds.find(f => f.id === fundId);

      if (!currentFund) {
        throw new Error('Fund not found');
      }

      // Step 2: Update the fund
      await FundService.updateFund(fundId, updates);

      // Step 3: If name or monthlyContribution changed, update CSP entry
      if (updates.name || updates.monthlyContribution !== undefined) {
        const bucket = (updates.type || currentFund.type) === 'saving' ? CSPBucket.Savings : CSPBucket.Investment;
        const accountId = updates.accountId || currentFund.accountId;

        // Get current CSP to find the amount if we're only updating name
        const csp = queryClient.getQueryData<ConsciousSpendingPlan>(CSP_QUERY_KEY);
        const currentCSPEntry = csp?.[bucket]?.find((item) => item.category === accountId);
        const amount = updates.monthlyContribution !== undefined ? updates.monthlyContribution : (currentCSPEntry?.amount || 0);

        await updateCSPItem.mutateAsync({
          bucket,
          category: fundId,
          amount
        });
      }
    },
    onSuccess: () => {
      // Invalidate both funds and CSP queries
      queryClient.invalidateQueries({ queryKey: FUNDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FUNDS_WITH_INFO_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CSP_QUERY_KEY });
    },
  });
};

/**
 * React Query mutation hook for deleting a fund
 *
 * Permanently deletes a fund from Firestore and removes the corresponding CSP entry.
 * On success, invalidates both funds and CSP caches to trigger refetches.
 *
 * @returns UseMutationResult with mutate function and loading/error states
 */
export const useDeleteFund = () => {
  const queryClient = useQueryClient();
  const deleteCSPItem = useDeleteCSPItem();

  return useMutation({
    mutationFn: async ({ id, type }: UI_Fund) => {
      // Step 1: Delete the fund
      await FundService.deleteFund(id);

      // Step 2: Delete corresponding CSP entry
      const bucket = type === 'saving' ? CSPBucket.Savings : CSPBucket.Investment;
      await deleteCSPItem.mutateAsync({
        bucket,
        category: id
      });
    },
    onSuccess: () => {
      // Invalidate both funds and CSP queries
      queryClient.invalidateQueries({ queryKey: FUNDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FUNDS_WITH_INFO_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CSP_QUERY_KEY });
    },
  });
};

/**
 * React Query mutation hook for updating an account's target amount
 *
 * Updates the target amount for any account (manual or linked) for goal tracking.
 * The target amount is used to track progress toward savings or investment goals
 * directly on the account. Pass null or undefined to clear the target amount.
 *
 * On success, invalidates the funds cache to trigger a refetch of all account queries.
 *
 * @returns UseMutationResult with mutate function and loading/error states
 *
 * @example
 * const { mutate: updateTargetAmount, isPending, error } = useUpdateAccountTargetAmount();
 *
 * // Set a target amount
 * const handleSetTarget = () => {
 *   updateTargetAmount(
 *     {
 *       fundId: 'account123',
 *       targetAmount: 10000.00
 *     },
 *     {
 *       onSuccess: () => {
 *         console.log('Target amount set');
 *         // Account list will automatically refresh with progress indicator
 *       },
 *       onError: (error) => {
 *         console.error('Failed to set target amount:', error);
 *         // Error might be: "Target amount must be a positive number"
 *       }
 *     }
 *   );
 * };
 *
 * // Clear a target amount
 * const handleClearTarget = () => {
 *   updateTargetAmount({
 *     fundId: 'fund123',
 *     targetAmount: null
 *   });
 * };
 */
export const useUpdateAccountTargetAmount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      fundId,
      targetAmount,
    }: {
      fundId: string;
      targetAmount: number | null | undefined;
    }) => FundService.updateFundTargetAmount(fundId, targetAmount),
    onSuccess: () => {
      // Invalidate funds queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: FUNDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FUNDS_WITH_INFO_QUERY_KEY });
    },
  });
};
