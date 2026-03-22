import { useInfiniteQuery } from '@tanstack/react-query';
import { TransactionsService } from '../../services/transactionsService';
import type { ListTransactionsRequest, ListTransactionsResponse } from '../../types/firestoreTypes';
import { NEXT_TOKEN_END } from '../../services/transactionsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Transaction } from '@easy-csp/shared-types';

export const useTransactions = (baseRequest: Omit<ListTransactionsRequest, 'startAfter'>) => {
  return useInfiniteQuery({
    queryKey: ['transactions', baseRequest],
    queryFn: async ({ pageParam }) => {
      const request: ListTransactionsRequest = {
        ...baseRequest,
        startAfter: pageParam
      };
      return await TransactionsService.listTransactions(request);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage: ListTransactionsResponse) => {
      return lastPage.lastFetchSnapshot !== NEXT_TOKEN_END
        ? lastPage.lastFetchSnapshot
        : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ transactionId, updates }: { transactionId: string; updates: Partial<Transaction> }) =>
      TransactionsService.updateTransaction(transactionId, updates),
    onSuccess: (_data, { transactionId, updates }) => {
      // Update the transaction in cache after successful API call
      queryClient.setQueriesData<{ pages: ListTransactionsResponse[]; pageParams: unknown[] }>(
        { queryKey: ['transactions'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              transactions: (page.transactions ?? []).map((t) =>
                t.id === transactionId ? { ...t, ...updates } : t
              ),
            })),
          };
        }
      );
    },
  });
};
