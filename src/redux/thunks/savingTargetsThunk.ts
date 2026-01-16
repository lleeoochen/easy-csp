import type { UI_SavingTargetAndBalance } from "../../types/uiTypes";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { SavingTargetsService, type SavingTargetWithBalance } from "../../services/savingTargetsService";

export type ThunkProps_AddSavingTarget = {
  name: string;
  targetAmount: number;
  selectedAccount: string
};

export type ThunkProps_UpdateSavingTarget = {
  id: string;
  savingTargetData: { name: string; targetAmount: number; selectedAccount: string };
};

export type ThunkProps_DeleteSavingTarget = string;

export type ThunkProps_UpdateSavingTargetProgress = {
  id: string;
  amount: number;
};

// Helper function to convert SavingTargetWithBalance to SavingTarget
const savingTargetToSavingTarget = (savingTarget: SavingTargetWithBalance): UI_SavingTargetAndBalance => {
  return {
    id: savingTarget.id,
    name: savingTarget.name,
    targetAmount: savingTarget.targetAmount,
    currentAmount: savingTarget.currentBalance,
    accountInfo: savingTarget.accountInfo,
  };
};

// Helper function to parse selected account string
const parseSelectedAccount = (selectedAccount: string): [string, string] => {
  const [institutionIndex, accountId] = selectedAccount.split('|');
  return [institutionIndex, accountId];
};

export const fetchSavingTargets = createAsyncThunk<
  UI_SavingTargetAndBalance[],
  void,
  { state: RootState }
>(
  'savingTargets/fetch',
  async () => {
    try {
      const response = await SavingTargetsService.listSavingTargets();

      if (response.success && response.savingTargets) {
        return response.savingTargets.map(savingTargetToSavingTarget);
      } else {
        throw new Error(response.message || 'Failed to fetch saving targets');
      }
    } catch (error) {
      console.error('Error fetching saving targets:', error);
      throw error;
    }
  },
);

export const addSavingTarget = createAsyncThunk<
  UI_SavingTargetAndBalance,
  ThunkProps_AddSavingTarget,
  { state: RootState }
>(
  'savingTargets/add',
  async (savingTargetData, { getState }) => {
    try {
      const institutions = getState().financialInstitution.fetchFinancialInstitutions.institutions;

      const [institutionIndexStr, accountId] = parseSelectedAccount(savingTargetData.selectedAccount);
      const institutionIndex = parseInt(institutionIndexStr);
      const institution = institutions[institutionIndex];

      if (!institution) {
        throw new Error('Invalid institution selected');
      }

      const response = await SavingTargetsService.addSavingTarget(
        savingTargetData.name,
        savingTargetData.targetAmount,
        institution.institutionId,
        accountId
      );

      if (response.success && response.savingTarget) {
        // Convert to SavingTarget format for the UI
        return {
          id: response.savingTarget.id,
          name: response.savingTarget.name,
          targetAmount: response.savingTarget.targetAmount,
          currentAmount: 0, // Will be updated on next fetch
          accountInfo: {
            institutionName: institution.institutionName,
            accountName: institution.accounts.find(acc => acc.accountId === accountId)?.accountName || 'Unknown',
          },
        };
      } else {
        throw new Error(response.message || 'Failed to add saving target');
      }
    } catch (error) {
      console.error('Error adding saving target:', error);
      throw error;
    }
  },
);

export const updateSavingTarget = createAsyncThunk<
  UI_SavingTargetAndBalance,
  ThunkProps_UpdateSavingTarget,
  { state: RootState }
>(
  'savingTargets/update',
  async (params: ThunkProps_UpdateSavingTarget, { getState }) => {
    const { id, savingTargetData } = params;

    try {
      const institutions = getState().financialInstitution.fetchFinancialInstitutions.institutions;

      const [institutionIndexStr, accountId] = parseSelectedAccount(savingTargetData.selectedAccount);
      const institutionIndex = parseInt(institutionIndexStr);
      const institution = institutions[institutionIndex];

      if (!institution) {
        throw new Error('Invalid institution selected');
      }

      const response = await SavingTargetsService.updateSavingTarget(id, {
        name: savingTargetData.name,
        targetAmount: savingTargetData.targetAmount,
        financialInstitutionId: institution.institutionId,
        accountId: accountId,
      });

      if (response.success && response.savingTarget) {
        return {
          id: response.savingTarget.id,
          name: response.savingTarget.name,
          targetAmount: response.savingTarget.targetAmount,
          currentAmount: 0, // Will be updated on next fetch
          accountInfo: {
            institutionName: institution.institutionName,
            accountName: institution.accounts.find(acc => acc.accountId === accountId)?.accountName || 'Unknown',
          },
        } as UI_SavingTargetAndBalance;
      } else {
        throw new Error(response.message || 'Failed to update saving target');
      }
    } catch (error) {
      console.error('Error updating saving target:', error);
      throw error;
    }
  },
);

export const deleteSavingTarget = createAsyncThunk<
  string,
  ThunkProps_DeleteSavingTarget,
  { state: RootState }
>(
  'savingTargets/delete',
  async (id: string) => {
    try {
      const response = await SavingTargetsService.removeSavingTarget(id);

      if (response.success) {
        return id; // Return the deleted saving target's ID
      } else {
        throw new Error(response.message || 'Failed to delete saving target');
      }
    } catch (error) {
      console.error('Error deleting saving target:', error);
      throw error;
    }
  },
);

export const updateSavingTargetProgress = createAsyncThunk<
  string,
  ThunkProps_UpdateSavingTargetProgress,
  { state: RootState }
>(
  'savingTargets/updateProgress',
  async (params: ThunkProps_UpdateSavingTargetProgress, { dispatch }) => {
    const { id } = params;
    // For now, just refresh the saving targets since we're tracking real account balances
    // In a complete implementation, this might update account balances or add transactions
    dispatch(fetchSavingTargets());
    return id;
  },
);
