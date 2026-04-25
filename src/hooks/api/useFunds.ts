import { FundService } from '@/services/fundService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
 * On success, invalidates the funds cache to trigger a refetch of all fund queries.
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
 *       targetAmount: 10000.00
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

  return useMutation({
    mutationFn: ({
      name,
      type,
      accountId,
      targetAmount,
    }: {
      name: string;
      type: 'saving' | 'investment';
      accountId: string;
      targetAmount?: number;
    }) => FundService.createFund(name, type, accountId, targetAmount),
    onSuccess: () => {
      // Invalidate funds queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: FUNDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FUNDS_WITH_INFO_QUERY_KEY });
    },
  });
};

/**
 * React Query mutation hook for updating a fund
 *
 * Updates fund information including name, type, linked account, and target amount.
 * On success, invalidates the funds cache to trigger a refetch of all fund queries.
 *
 * @returns UseMutationResult with mutate function and loading/error states
 */
export const useUpdateFund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      fundId,
      updates,
    }: {
      fundId: string;
      updates: {
        name?: string;
        type?: 'saving' | 'investment';
        accountId?: string;
        targetAmount?: number | null;
      };
    }) => FundService.updateFund(fundId, updates),
    onSuccess: () => {
      // Invalidate funds queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: FUNDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FUNDS_WITH_INFO_QUERY_KEY });
    },
  });
};

/**
 * React Query mutation hook for deleting a fund
 *
 * Permanently deletes a fund from Firestore.
 * On success, invalidates the funds cache to trigger a refetch of all fund queries.
 *
 * @returns UseMutationResult with mutate function and loading/error states
 */
export const useDeleteFund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fundId: string) => FundService.deleteFund(fundId),
    onSuccess: () => {
      // Invalidate funds queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: FUNDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FUNDS_WITH_INFO_QUERY_KEY });
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
