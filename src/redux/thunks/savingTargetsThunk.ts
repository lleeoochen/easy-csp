import type { UI_SavingTargetAndBalance } from "../../types/uiTypes";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { getFunctions, httpsCallable } from "firebase/functions";
import type { SavingTarget as BackendSavingTarget } from "@easy-csp/shared-types";
import type { RootState } from "../store";

// Extended interface from backend that includes balance information
interface SavingTargetWithBalance extends BackendSavingTarget {
  id: string;
  currentBalance: number;
  accountInfo: {
    institutionName: string;
    accountName: string;
  } | null;
}

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
    const functions = getFunctions();
    const listSavingTargets = httpsCallable(functions, 'listSavingTargets');

    try {
      const result = await listSavingTargets({});
      const response = result.data as { success: boolean; savingTargets?: SavingTargetWithBalance[] };

      if (response.success && response.savingTargets) {
        return response.savingTargets.map(savingTargetToSavingTarget);
      } else {
        throw new Error('Failed to fetch saving targets');
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
    const functions = getFunctions();
    const addSavingTarget = httpsCallable(functions, 'addSavingTarget');

    try {
      const institutions = getState().financialInstitution.institutions;

      const [institutionIndexStr, accountId] = parseSelectedAccount(savingTargetData.selectedAccount);
      const institutionIndex = parseInt(institutionIndexStr);
      const institution = institutions[institutionIndex];

      if (!institution) {
        throw new Error('Invalid institution selected');
      }

      const result = await addSavingTarget({
        name: savingTargetData.name,
        targetAmount: savingTargetData.targetAmount,
        financialInstitutionId: institution.institutionId,
        accountId: accountId,
      });

      const response = result.data as { success: boolean; savingTarget?: BackendSavingTarget & { id: string } };

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
        throw new Error('Failed to add saving target');
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
    const functions = getFunctions();
    const updateSavingTarget = httpsCallable(functions, 'updateSavingTarget');

    try {
      const institutions = getState().financialInstitution.institutions;

      const [institutionIndexStr, accountId] = parseSelectedAccount(savingTargetData.selectedAccount);
      const institutionIndex = parseInt(institutionIndexStr);
      const institution = institutions[institutionIndex];

      if (!institution) {
        throw new Error('Invalid institution selected');
      }

      const result = await updateSavingTarget({
        id,
        updates: {
          name: savingTargetData.name,
          targetAmount: savingTargetData.targetAmount,
          financialInstitutionId: institution.institutionId,
          accountId: accountId,
        },
      });

      const response = result.data as { success: boolean; savingTarget?: BackendSavingTarget & { id: string } };

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
        throw new Error('Failed to update saving target');
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
    const functions = getFunctions();
    const removeSavingTarget = httpsCallable(functions, 'removeSavingTarget');

    try {
      const result = await removeSavingTarget({ id });
      const response = result.data as { success: boolean };

      if (response.success) {
        return id; // Return the deleted saving target's ID
      } else {
        throw new Error('Failed to delete saving target');
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
