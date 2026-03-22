import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import type { Transaction, SplitFrequency } from '@easy-csp/shared-types';
import { TRANSACTIONS_COLLECTION } from '@easy-csp/shared-types';

export interface SplitTransactionRequest {
  transactionId: string;
  splitCount: number;
  frequency: SplitFrequency;
  startDate: number;
}

interface SplitTransactionResponse {
  success: boolean;
  splitTransactionIds: string[];
}

/**
 * Mutation hook to call the splitTransaction Cloud Function.
 * Invalidates transaction queries on success.
 */
export const useSplitTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: SplitTransactionRequest): Promise<SplitTransactionResponse> => {
      const functions = getFunctions();
      const splitTransaction = httpsCallable<SplitTransactionRequest, SplitTransactionResponse>(
        functions,
        'splitTransaction'
      );
      const result = await splitTransaction(request);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

/**
 * Query hook to fetch all split transactions for a given parent ID,
 * ordered by datetime ascending.
 */
export const useSplitTransactionsByParent = (parentId: string | undefined) => {
  return useQuery({
    queryKey: ['transactions', 'splits', parentId],
    queryFn: async (): Promise<Transaction[]> => {
      if (!parentId) return [];
      const firestore = getFirestore();
      const snapshot = await getDocs(
        query(
          collection(firestore, TRANSACTIONS_COLLECTION),
          where('splitParentId', '==', parentId),
          orderBy('datetime', 'asc')
        )
      );
      return snapshot.docs.map((doc) => doc.data() as Transaction);
    },
    enabled: !!parentId,
    staleTime: 1000 * 60 * 5,
  });
};
