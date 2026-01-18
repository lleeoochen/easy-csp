import type { FinancialInstitution } from "@easy-csp/shared-types";
import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState } from "../store";
import { FinancialInstitutionsService } from "../../services/financialInstitutionsService";

const sleep = (ms: number) => {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
};

export const fetchFinancialInstitutions = createAsyncThunk<
  FinancialInstitution[],
  void,
  { state: RootState }
>(
  'financialInstitutions/fetch',
  async () => {
    try {
      return await FinancialInstitutionsService.listFinancialInstitutions();
    } catch (error) {
      console.error('Error fetching financial institutions:', error);
      throw error;
    }
  },
);

export const refreshFinancialInstitutions = createAsyncThunk<
  void,
  void,
  { state: RootState }
>(
  'financialInstitutions/refresh',
  async (_, thunkApi) => {
    try {
      await FinancialInstitutionsService.refreshFinancialInstitutions();

      // Refresh status
      for (let i = 0; i < 3; i++) {
        thunkApi.dispatch(fetchFinancialInstitutions());
        await sleep(10000);
      }
    } catch (error) {
      console.error('Error fetching financial institutions:', error);
      throw error;
    }
  },
);
