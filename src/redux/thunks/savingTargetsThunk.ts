import type { UI_SavingTargetAndBalance } from "../../types/uiTypes";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { SavingTargetsService } from "../../services/savingTargetsService";
import { parseAccountOptionValue } from "../../utils/accountUtils";

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
        return response.savingTargets;
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
      const { institutionId, accountId } = parseAccountOptionValue(savingTargetData.selectedAccount);
      const institution = institutions.find(inst => inst.institutionId === institutionId);
      const account = institution.accounts.find(inst => inst.accountId === accountId);

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
          ...response.savingTarget,
          institutionName: institution.institutionName,
          accountName: account.accountName,
          currentAmount: account.balance
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
      const { institutionId, accountId } = parseAccountOptionValue(savingTargetData.selectedAccount);
      const institution = institutions.find(inst => inst.institutionId === institutionId);
      const account = institution.accounts.find(inst => inst.accountId === accountId);

      if (!institution || !account) {
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
          ...response.savingTarget,
          institutionName: institution.institutionName,
          accountName: account.accountName,
          currentAmount: account.balance
        };
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
