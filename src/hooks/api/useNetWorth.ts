import { useQuery } from '@tanstack/react-query';
import { NetWorthService } from '../../services/netWorthService';

export const NET_WORTH_QUERY_KEY = ['netWorth'];

export const useNetWorth = () => {
  return useQuery({
    queryKey: NET_WORTH_QUERY_KEY,
    queryFn: () => NetWorthService.getCurrentNetWorth(),
    staleTime: 1000 * 60 * 5,
  });
};
