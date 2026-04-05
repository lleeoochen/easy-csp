// Dedicated file for UI-specific type definitions
// All UI types should begin with UI_ prefix

import type { Fund } from "@easy-csp/shared-types";

export interface UI_FundAndBalance extends Fund {
  id: string;
  currentAmount: number;
  institutionName?: string;
  accountName?: string;
}
