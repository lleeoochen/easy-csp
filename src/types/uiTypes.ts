// Dedicated file for UI-specific type definitions
// All UI types should begin with UI_ prefix

export interface UI_SavingTargetAndBalance {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  accountInfo?: {
    institutionName: string;
    accountName: string;
  } | null;
}
