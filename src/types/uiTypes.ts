// Dedicated file for UI-specific type definitions
// All UI types should begin with UI_ prefix

import type { SavingTarget } from "@easy-csp/shared-types";

export interface UI_SavingTargetAndBalance extends SavingTarget {
  id: string;
  currentAmount: number;
  institutionName?: string;
  accountName?: string;
}
