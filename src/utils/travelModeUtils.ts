/**
 * Travel Mode Utility Functions
 *
 * Helper functions for working with Travel Mode configuration and rules.
 * These utilities work directly with the Rule type from Firestore.
 */

import { type Rule, type RuleTransformation, CSPBucket, type ConsciousSpendingPlan } from '@easy-csp/shared-types';
import { TRAVEL_MODE_RULE_NAME, type TravelModeConfig } from '../types/travelMode';

/**
 * Get default travel categories from user's guilt-free spending bucket
 * @param csp User's Conscious Spending Plan data
 * @returns Array of category IDs from GuildFreeSpending bucket
 */
export function getDefaultTravelCategories(csp: ConsciousSpendingPlan | null | undefined): string[] {
  if (!csp) return [];

  const guildFreeSpendingBudgets = csp[CSPBucket.GuildFreeSpending] || [];
  return guildFreeSpendingBudgets
    .filter(budget => !budget.isTrackingSavingTarget) // Exclude saving target categories
    .map(budget => budget.category);
}

/**
 * Filter rules by travel mode rule name
 * @param rule User's Rule document from Firestore
 * @returns Array of travel mode rule transformations
 */
export function getTravelModeRules(rule: Rule | null): RuleTransformation[] {
  if (!rule?.transformations) return [];
  return rule.transformations.filter(t => t.name === TRAVEL_MODE_RULE_NAME);
}

/**
 * Check if travel mode is configured for the user
 * @param rule User's Rule document from Firestore
 * @returns True if travel mode rules exist
 */
export function isTravelModeConfigured(rule: Rule | null): boolean {
  return getTravelModeRules(rule).length > 0;
}

/**
 * Check if travel mode is currently enabled
 * @param rule User's Rule document from Firestore
 * @returns True if travel mode rules exist and all are enabled
 */
export function isTravelModeEnabled(rule: Rule | null): boolean {
  const travelRules = getTravelModeRules(rule);
  return travelRules.length > 0 && travelRules.every(t => t.enabled);
}

/**
 * Extract travel mode configuration from rules
 * @param rule User's Rule document from Firestore
 * @returns TravelModeConfig if configured, null otherwise
 */
export function getTravelModeConfig(rule: Rule | null): TravelModeConfig | null {
  const travelRules = getTravelModeRules(rule);
  if (travelRules.length === 0) return null;

  const categories = travelRules
    .map(t => t.matchingCriteria.category?.value)
    .filter(Boolean) as string[];

  const savingTargetId = travelRules[0].action.assignSavingTargetId;
  if (!savingTargetId) return null;

  return { categories, savingTargetId };
}
