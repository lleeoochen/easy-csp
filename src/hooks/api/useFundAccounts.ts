import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AccountService } from '@/services/accountService';
import { TransactionsService } from '@/services/transactionsService';

/**
 * Query key for fund accounts data
 * Used for cache management and invalidation
 */
export const FUND_ACCOUNTS_QUERY_KEY = ['fundAccounts'];

/**
 * Query key factory for fund transactions
 * Used for cache management and invalidation
 */
export const fundTransactionsQueryKey = (fundAccountId: string) => [
  'fundTransactions',
  fundAccountId,
];

/**
 * Query key factory for fund allocation total
 * Used for cache management and invalidation
 */
export const fundAllocationTotalQueryKey = (
  fundAccountId: string,
  options?: { startDate?: number; endDate?: number }
) => ['fundAllocationTotal', fundAccountId, options];

/**
 * React Query hook for fetching all fund accounts
 *
 * Returns all accounts where isFundAccount === true.
 * These accounts can be used for transaction allocation in the fund tracking feature.
 *
 * @returns UseQueryResult containing array of FinancialAccount objects that are fund accounts
 *
 * @example
 * const { data: fundAccounts, isLoading, error } = useFundAccounts();
 *
 * if (isLoading) return <div>Loading fund accounts...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return (
 *   <select>
 *     {fundAccounts?.map(account => (
 *       <option key={account.id} value={account.id}>
 *         {account.nickname || account.accountName}
 *       </option>
 *     ))}
 *   </select>
 * );
 */
export const useFundAccounts = () => {
  return useQuery({
    queryKey: FUND_ACCOUNTS_QUERY_KEY,
    queryFn: async () => {
      return await AccountService.getFundAccounts();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - fund accounts don't change frequently
  });
};

/**
 * React Query mutation hook for toggling fund account status
 *
 * Updates the isFundAccount field on an account.
 * Only asset accounts (checking, savings, investment, other) can be fund accounts.
 * On success, invalidates fund accounts and general accounts caches.
 *
 * @returns UseMutationResult with mutate function and loading/error states
 *
 * @example
 * const { mutate: updateFundStatus, isPending, error } = useUpdateFundStatus();
 *
 * const handleToggleFundStatus = () => {
 *   updateFundStatus(
 *     {
 *       accountId: 'account123',
 *       isFundAccount: true
 *     },
 *     {
 *       onSuccess: (result) => {
 *         console.log(result.message);
 *         // Fund accounts list will automatically refresh
 *       },
 *       onError: (error) => {
 *         console.error('Failed to update fund status:', error);
 *         // Error might be: "Only asset accounts can be fund accounts"
 *       }
 *     }
 *   );
 * };
 */
export const useUpdateFundStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountId,
      isFundAccount,
    }: {
      accountId: string;
      isFundAccount: boolean;
    }) => AccountService.updateFundAccountStatus(accountId, isFundAccount),
    onSuccess: () => {
      // Invalidate fund accounts query to trigger refetch
      queryClient.invalidateQueries({ queryKey: FUND_ACCOUNTS_QUERY_KEY });
      // Also invalidate general accounts queries since isFundAccount changed
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

/**
 * React Query hook for fetching transactions allocated to a fund
 *
 * Returns all transactions where allocatedFundId matches the specified fund account.
 * Transactions are ordered by datetime descending (newest first).
 * Optionally filters by date range.
 *
 * @param fundAccountId - Firestore document ID of the fund account
 * @param options - Optional date range filtering
 * @returns UseQueryResult containing array of Transaction objects
 *
 * @example
 * const { data: transactions, isLoading, error } = useFundTransactions('fund123');
 *
 * if (isLoading) return <div>Loading transactions...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return (
 *   <div>
 *     {transactions?.map(transaction => (
 *       <div key={transaction.id}>
 *         {transaction.name}: ${transaction.amount}
 *       </div>
 *     ))}
 *   </div>
 * );
 *
 * @example
 * // With date range filtering
 * const { data: transactions } = useFundTransactions('fund123', {
 *   startDate: 1704067200000,
 *   endDate: 1706745600000
 * });
 */
export const useFundTransactions = (
  fundAccountId: string,
  options?: { startDate?: number; endDate?: number }
) => {
  return useQuery({
    queryKey: fundTransactionsQueryKey(fundAccountId),
    queryFn: async () => {
      return await TransactionsService.getTransactionsByFund(
        fundAccountId,
        options
      );
    },
    staleTime: 1000 * 60 * 2, // 2 minutes - transactions change more frequently
    enabled: !!fundAccountId, // Only run query if fundAccountId is provided
  });
};

/**
 * React Query mutation hook for setting/clearing transaction fund allocations
 *
 * Updates the allocatedFundId field on a transaction.
 * Pass null to clear the allocation.
 * Validates that the fund account exists and has isFundAccount === true.
 * On success, invalidates fund transactions and general transactions caches.
 *
 * @returns UseMutationResult with mutate function and loading/error states
 *
 * @example
 * const { mutate: updateAllocation, isPending, error } = useUpdateFundAllocation();
 *
 * // Allocate transaction to a fund
 * const handleAllocateToFund = () => {
 *   updateAllocation(
 *     {
 *       transactionId: 'txn123',
 *       allocatedFundId: 'fund456'
 *     },
 *     {
 *       onSuccess: (result) => {
 *         console.log(result.message);
 *         // Transaction lists will automatically refresh
 *       },
 *       onError: (error) => {
 *         console.error('Failed to allocate transaction:', error);
 *       }
 *     }
 *   );
 * };
 *
 * @example
 * // Clear fund allocation
 * const handleClearAllocation = () => {
 *   updateAllocation({
 *     transactionId: 'txn123',
 *     allocatedFundId: null
 *   });
 * };
 */
export const useUpdateFundAllocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      transactionId,
      allocatedFundId,
    }: {
      transactionId: string;
      allocatedFundId: string | null;
    }) =>
      TransactionsService.updateTransactionFundAllocation(
        transactionId,
        allocatedFundId
      ),
    onSuccess: () => {
      // Invalidate all fund transactions queries
      queryClient.invalidateQueries({ queryKey: ['fundTransactions'] });
      // Invalidate all fund allocation total queries
      queryClient.invalidateQueries({ queryKey: ['fundAllocationTotal'] });
      // Invalidate general transactions queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

/**
 * React Query hook for calculating total allocated amount for a fund
 *
 * Sums the amount field of all transactions allocated to the specified fund.
 * Optionally filters by date range.
 *
 * @param fundAccountId - Firestore document ID of the fund account
 * @param options - Optional date range filtering
 * @returns UseQueryResult containing the total amount as a number
 *
 * @example
 * const { data: total, isLoading, error } = useFundAllocationTotal('fund123');
 *
 * if (isLoading) return <div>Calculating total...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return <div>Total allocated: ${total?.toFixed(2)}</div>;
 *
 * @example
 * // With date range filtering
 * const { data: total } = useFundAllocationTotal('fund123', {
 *   startDate: 1704067200000,
 *   endDate: 1706745600000
 * });
 */
export const useFundAllocationTotal = (
  fundAccountId: string,
  options?: { startDate?: number; endDate?: number }
) => {
  return useQuery({
    queryKey: fundAllocationTotalQueryKey(fundAccountId, options),
    queryFn: async () => {
      return await TransactionsService.calculateFundAllocationTotal(
        fundAccountId,
        options
      );
    },
    staleTime: 1000 * 60 * 2, // 2 minutes - totals change when transactions change
    enabled: !!fundAccountId, // Only run query if fundAccountId is provided
  });
};
