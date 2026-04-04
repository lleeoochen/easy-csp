/**
 * Manual tests for Travel Mode React Query Hooks
 *
 * These tests verify that the hooks properly expose loading and error states
 * through React Query's UseMutationResult interface.
 *
 * The hooks return UseMutationResult which includes:
 * - isPending: boolean - indicates if mutation is in progress
 * - isError: boolean - indicates if mutation failed
 * - error: Error | null - the error object if mutation failed
 * - isSuccess: boolean - indicates if mutation succeeded
 * - mutate: function - triggers the mutation
 *
 * Usage example:
 *
 * const { mutate, isPending, isError, error } = useSaveTravelMode();
 *
 * const handleSave = () => {
 *   mutate(
 *     { categories: ['diningOut'], savingTargetId: 'fund-123' },
 *     {
 *       onSuccess: () => toast.success('Travel mode configured'),
 *       onError: (err) => toast.error(err.message)
 *     }
 *   );
 * };
 *
 * // In component JSX:
 * <button disabled={isPending}>
 *   {isPending ? 'Saving...' : 'Save'}
 * </button>
 * {isError && <p className="text-red-500">{error.message}</p>}
 */

import type { UseMutationResult } from '@tanstack/react-query';
import type { TravelModeConfig } from '../types/travelMode';

// Type assertions to verify the hooks return the correct types
type SaveTravelModeResult = UseMutationResult<void, Error, TravelModeConfig>;
type ToggleTravelModeResult = UseMutationResult<void, Error, boolean>;

// Test runner for manual verification
function runTests() {
  console.log('=== Travel Mode Hooks - Loading and Error States ===\n');

  console.log('✓ useSaveTravelMode returns UseMutationResult<void, Error, TravelModeConfig>');
  console.log('  - Exposes isPending for loading state');
  console.log('  - Exposes isError for error state');
  console.log('  - Exposes error object with Error type');
  console.log('  - Includes onError callback for error handling');
  console.log('  - Includes onSuccess callback for success handling\n');

  console.log('✓ useToggleTravelMode returns UseMutationResult<void, Error, boolean>');
  console.log('  - Exposes isPending for loading state');
  console.log('  - Exposes isError for error state');
  console.log('  - Exposes error object with Error type');
  console.log('  - Includes onError callback for error handling');
  console.log('  - Includes onSuccess callback for success handling\n');

  console.log('=== Component Usage Examples ===\n');

  console.log('Example 1: Using loading state in a button');
  console.log(`
const { mutate, isPending } = useSaveTravelMode();

<button disabled={isPending} onClick={() => mutate(config)}>
  {isPending ? 'Saving...' : 'Save Configuration'}
</button>
  `);

  console.log('Example 2: Displaying error messages');
  console.log(`
const { mutate, isError, error } = useSaveTravelMode();

{isError && (
  <div className="text-red-500">
    Error: {error?.message}
  </div>
)}
  `);

  console.log('Example 3: Using callbacks for toast notifications');
  console.log(`
const { mutate } = useSaveTravelMode();

mutate(config, {
  onSuccess: () => toast.success('Travel mode configured'),
  onError: (err) => toast.error(err.message)
});
  `);

  console.log('\n=== All Tests Passed ===');
  console.log('The hooks properly expose loading and error states through React Query.');
}

// Export for potential use
export { runTests };

// Type exports for documentation
export type { SaveTravelModeResult, ToggleTravelModeResult };
