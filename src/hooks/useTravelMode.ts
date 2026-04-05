/**
 * Travel Mode React Query Hooks
 *
 * React Query hooks for managing Travel Mode configuration and state.
 * These hooks wrap the TravelModeService and provide optimistic updates
 * and cache invalidation for a smooth user experience.
 *
 * Note: useUserRules is re-exported from useRules hook to maintain consistency
 * with the existing rules system and avoid duplicate queries.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { TravelModeService } from '../services/travelModeService';
import type { TravelModeConfig } from '../types/travelMode';
import { getAuth } from 'firebase/auth';

// Re-export useRules as useUserRules for travel mode components
export { useRules as useUserRules } from './api/useRules';
import { RULES_QUERY_KEY } from './api/useRules';

/**
 * Hook to save or update travel mode configuration
 * Creates/updates travel mode rules in Firestore and invalidates the rules cache
 *
 * @returns UseMutationResult with loading (isPending), error states, and mutate function
 *
 * @example
 * const { mutate, isPending, isError, error } = useSaveTravelMode();
 *
 * const handleSave = () => {
 *   mutate(
 *     { categories: ['diningOut'], fundId: 'fund-123' },
 *     {
 *       onSuccess: () => toast.success('Travel mode configured'),
 *       onError: (err) => toast.error(err.message)
 *     }
 *   );
 * };
 */
export const useSaveTravelMode = (): UseMutationResult<void, Error, TravelModeConfig> => {
  const queryClient = useQueryClient();
  const auth = getAuth();

  return useMutation<void, Error, TravelModeConfig>({
    mutationFn: async (config: TravelModeConfig) => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        throw new Error('User not authenticated');
      }
      await TravelModeService.createOrUpdateTravelModeRule(uid, config);
    },
    onSuccess: () => {
      // Invalidate rules cache to refetch updated rules
      queryClient.invalidateQueries({ queryKey: RULES_QUERY_KEY });
    },
    onError: (error: Error) => {
      // Log error for debugging
      console.error('Failed to save travel mode configuration:', error);
    },
  });
};

/**
 * Hook to toggle travel mode on/off
 * Updates the enabled field on all travel mode rules
 *
 * @returns UseMutationResult with loading (isPending), error states, and mutate function
 *
 * @example
 * const { mutate, isPending, isError, error } = useToggleTravelMode();
 *
 * const handleToggle = (enabled: boolean) => {
 *   mutate(enabled, {
 *     onSuccess: () => toast.success(enabled ? 'Travel mode activated' : 'Travel mode deactivated'),
 *     onError: (err) => toast.error(err.message)
 *   });
 * };
 */
export const useToggleTravelMode = (): UseMutationResult<void, Error, boolean> => {
  const queryClient = useQueryClient();
  const auth = getAuth();

  return useMutation<void, Error, boolean>({
    mutationFn: async (enabled: boolean) => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        throw new Error('User not authenticated');
      }
      await TravelModeService.toggleTravelMode(uid, enabled);
    },
    onSuccess: () => {
      // Invalidate rules cache to refetch updated rules
      queryClient.invalidateQueries({ queryKey: RULES_QUERY_KEY });
    },
    onError: (error: Error) => {
      // Log error for debugging
      console.error('Failed to toggle travel mode:', error);
    },
  });
};
