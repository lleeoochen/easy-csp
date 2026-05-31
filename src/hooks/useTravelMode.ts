/**
 * Travel Mode React Query Hooks
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { TravelModeService } from '@/services/travelModeService';
import type { TravelModeConfig } from '@/types/travelMode';
import { getAuth } from 'firebase/auth';

export { useRules as useUserRules } from './api/useRules';
import { RULES_QUERY_KEY } from './api/useRules';

/**
 * Hook to save or update travel mode configuration (categories + fund + optional dates)
 */
export const useSaveTravelMode = (): UseMutationResult<void, Error, TravelModeConfig> => {
  const queryClient = useQueryClient();
  const auth = getAuth();

  return useMutation<void, Error, TravelModeConfig>({
    mutationFn: async (config: TravelModeConfig) => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('User not authenticated');
      await TravelModeService.createOrUpdateTravelModeRule(uid, config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RULES_QUERY_KEY });
    },
  });
};

/**
 * Hook to set trip dates on existing travel mode rules
 */
export const useSetTripDates = (): UseMutationResult<void, Error, { startDate: number; endDate: number }> => {
  const queryClient = useQueryClient();
  const auth = getAuth();

  return useMutation<void, Error, { startDate: number; endDate: number }>({
    mutationFn: async ({ startDate, endDate }) => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('User not authenticated');
      await TravelModeService.setTripDates(uid, startDate, endDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RULES_QUERY_KEY });
    },
  });
};

/**
 * Hook to cancel the current trip (clears dates, keeps config)
 */
export const useCancelTrip = (): UseMutationResult<void, Error, void> => {
  const queryClient = useQueryClient();
  const auth = getAuth();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('User not authenticated');
      await TravelModeService.cancelTrip(uid);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RULES_QUERY_KEY });
    },
  });
};
