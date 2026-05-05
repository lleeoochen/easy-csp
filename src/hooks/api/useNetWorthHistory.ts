import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { NetWorthHistoryService } from '@/services/netWorthHistoryService';
import type { NetWorthDataPoint } from '@easy-csp/shared-types';

export const NET_WORTH_HISTORY_QUERY_KEY = ['netWorthHistory'];

export interface NetWorthHistoryChartPoint {
  date: string;
  netWorth: number;
  assets: number;
  liabilities: number;
}

/**
 * Fetches net worth history and returns sorted chart-ready data.
 */
export const useNetWorthHistory = () => {
  return useQuery({
    queryKey: NET_WORTH_HISTORY_QUERY_KEY,
    queryFn: async (): Promise<NetWorthHistoryChartPoint[]> => {
      const history = await NetWorthHistoryService.getHistory();
      console.log('📊 NetWorthHistory fetched:', history);
      if (!history?.dataPoints) return [];

      return Object.entries(history.dataPoints)
        .map(([date, dp]) => ({ date, netWorth: dp.assets - dp.liabilities, assets: dp.assets, liabilities: dp.liabilities }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    staleTime: 1000 * 60 * 10,
  });
};

/**
 * Mutation to trigger a manual net worth snapshot via callable Cloud Function.
 */
export const useRecordNetWorthSnapshot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('📸 Calling recordNetWorthSnapshot...');
      const fn = httpsCallable<void, { success: boolean; dataPoint: NetWorthDataPoint }>(
        getFunctions(),
        'recordNetWorthSnapshot'
      );
      const result = await fn();
      console.log('📸 Snapshot result:', result.data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NET_WORTH_HISTORY_QUERY_KEY });
    },
    onError: (error) => {
      console.error('📸 Snapshot error:', error);
    },
  });
};
