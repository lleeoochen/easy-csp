import type { FinancialInstitution } from "@easy-csp/shared-types";
import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState } from "../store";
import { FinancialInstitutionsService } from "../../services/financialInstitutionsService";

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
  async () => {
    try {
      await FinancialInstitutionsService.refreshFinancialInstitutions();
    } catch (error) {
      console.error('Error fetching financial institutions:', error);
      throw error;
    }
  },
);
