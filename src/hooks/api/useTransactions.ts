import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { TransactionsService } from '../../services/transactionsService';
import type { ListTransactionsRequest, ListTransactionsResponse } from '../../types/firestoreTypes';
import { NEXT_TOKEN_END } from '../../services/transactionsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Transaction } from '@easy-csp/shared-types';
// import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

// type InfiniteTransactionsData = {
//   pages: ListTransactionsResponse[];
//   pageParams: (QueryDocumentSnapshot<DocumentData, DocumentData> | undefined)[];
// };

export const useTransaction = (transactionId: string | null) => {
  return useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: () => transactionId ? TransactionsService.getTransaction(transactionId) : null,
    enabled: !!transactionId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

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
    onSuccess: (_data, variables) => {
      // Invalidate transaction queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction'] });

      // If fund allocation was updated, invalidate fund-related queries
      if (variables.updates.allocatedFundId !== undefined) {
        queryClient.invalidateQueries({ queryKey: ['fundTransactions'] });
        queryClient.invalidateQueries({ queryKey: ['fundAllocationTotal'] });
      }
    },
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transaction: Omit<Transaction, 'id' | 'uid'>) =>
      TransactionsService.createTransaction(transaction),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });

      // If fund allocation was set, invalidate fund-related queries
      if (variables.allocatedFundId) {
        queryClient.invalidateQueries({ queryKey: ['fundTransactions'] });
        queryClient.invalidateQueries({ queryKey: ['fundAllocationTotal'] });
      }
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transactionId: string) =>
      TransactionsService.deleteTransaction(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};
