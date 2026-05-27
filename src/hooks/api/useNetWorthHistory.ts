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
  checking: number;
  savings: number;
  investment: number;
  credit: number;
  loan: number;
  other: number;
}

/**
 * Fetches net worth history and returns sorted chart-ready data.
 */
export const useNetWorthHistory = () => {
  return useQuery({
    queryKey: NET_WORTH_HISTORY_QUERY_KEY,
    queryFn: async (): Promise<NetWorthHistoryChartPoint[]> => {
      const history = await NetWorthHistoryService.getHistory();
      if (!history?.dataPoints) return [];

      return Object.entries(history.dataPoints)
        .map(([date, dp]) => {
          // Backward compat: old data may have assets/liabilities but no per-type fields
          const raw = dp as unknown as Record<string, number | undefined>;
          const checking = dp.checking ?? 0;
          const savings = dp.savings ?? 0;
          const investment = dp.investment ?? 0;
          const credit = dp.credit ?? 0;
          const loan = dp.loan ?? 0;
          const other = dp.other ?? 0;
          const assets = checking + savings + investment + other || raw.assets || 0;
          const liabilities = credit + loan || raw.liabilities || 0;
          return { date, netWorth: assets - liabilities, assets, liabilities, checking, savings, investment, credit, loan, other };
        })
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
