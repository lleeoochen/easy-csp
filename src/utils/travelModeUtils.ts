/**
 * Travel Mode Utility Functions
 *
 * Helper functions for working with Travel Mode configuration and rules.
 * These utilities work directly with the Rule type from Firestore.
 */

import { TRAVEL_MODE_RULE_NAME, type TravelModeConfig } from '@/types/travelMode';
import { type Rule, type RuleTransformation, CSPBucket, type ConsciousSpendingPlan } from '@easy-csp/shared-types';

export type TravelModeStatus = 'not-configured' | 'no-dates' | 'upcoming' | 'active' | 'ended';

/**
 * Get default travel categories from user's guilt-free spending bucket
 */
export function getDefaultTravelCategories(csp: ConsciousSpendingPlan | null | undefined): string[] {
  if (!csp) return [];

  const guildFreeSpendingBudgets = csp[CSPBucket.GuildFreeSpending] || [];
  return guildFreeSpendingBudgets
    .filter(budget => !budget.isTrackingFund)
    .map(budget => budget.category);
}

/**
 * Filter rules by travel mode rule name
 */
export function getTravelModeRules(rule: Rule | null): RuleTransformation[] {
  if (!rule?.transformations) return [];
  return rule.transformations.filter(t => t.name === TRAVEL_MODE_RULE_NAME);
}

/**
 * Check if travel mode is configured for the user
 */
export function isTravelModeConfigured(rule: Rule | null): boolean {
  return getTravelModeRules(rule).length > 0;
}

/**
 * Get the travel mode status based on date range
 */
export function getTravelModeStatus(rule: Rule | null): TravelModeStatus {
  const travelRules = getTravelModeRules(rule);
  if (travelRules.length === 0) return 'not-configured';

  const dateRange = travelRules[0].activeDateRange;
  if (!dateRange) return 'no-dates';

  const now = Date.now();
  if (now < dateRange.startDate) return 'upcoming';
  if (now <= dateRange.endDate) return 'active';
  return 'ended';
}

/**
 * Get the date range from travel mode rules
 */
export function getTravelModeDates(rule: Rule | null): { startDate: number; endDate: number } | null {
  const travelRules = getTravelModeRules(rule);
  if (travelRules.length === 0) return null;
  return travelRules[0].activeDateRange ?? null;
}

/**
 * Extract travel mode configuration from rules
 */
export function getTravelModeConfig(rule: Rule | null): TravelModeConfig | null {
  const travelRules = getTravelModeRules(rule);
  if (travelRules.length === 0) return null;

  const categories = travelRules
    .map(t => t.matchingCriteria.category?.value)
    .filter(Boolean) as string[];

  const accountId = travelRules[0].action.assignFund;
  if (!accountId) return null;

  const dateRange = travelRules[0].activeDateRange;

  return {
    categories,
    fundId: accountId,
    startDate: dateRange?.startDate,
    endDate: dateRange?.endDate,
  };
}
