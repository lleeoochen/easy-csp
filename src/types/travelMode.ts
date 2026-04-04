/**
 * Travel Mode Configuration
 *
 * Defines the configuration for Travel Mode, which automatically marks
 * transactions from selected categories to a designated saving fund.
 */

/**
 * System-managed rule identifier for Travel Mode
 * The __system: prefix is reserved for system-managed rules
 */
export const TRAVEL_MODE_RULE_NAME = '__system:travel-mode';

/**
 * Travel Mode configuration interface
 */
export interface TravelModeConfig {
  /** Array of CSP category values to match for travel mode */
  categories: string[];
  /** ID of the saving fund to mark transactions to */
  savingTargetId: string;
}
