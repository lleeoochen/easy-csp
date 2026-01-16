import type { FinancialInstitution } from "@easy-csp/shared-types";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { fetchFinancialInstitutions, refreshFinancialInstitutions } from "../thunks/financialInstitutionThunk";

type FinancialInstitutionSlice = {
  fetchFinancialInstitutions: {
    isLoading: boolean;
    institutions: FinancialInstitution[];
    errorMessage: string;
  };
  refreshFinancialInstitutions: {
    isLoading: boolean;
    errorMessage: string;
  };
}

const initialState: FinancialInstitutionSlice = {
  fetchFinancialInstitutions: {
    isLoading: false,
    institutions: [],
    errorMessage: ""
  },
  refreshFinancialInstitutions: {
    isLoading: false,
    errorMessage: ""
  },
};

export const financialInstitutionSlice = createSlice({
  name: 'financialInstitution',
  initialState,
  reducers: {
  },
  extraReducers: (builder) => {
    builder.addCase(fetchFinancialInstitutions.fulfilled, (state, action: PayloadAction<FinancialInstitution[]>) => {
      state.fetchFinancialInstitutions.isLoading = false;
      state.fetchFinancialInstitutions.institutions = action.payload;
      state.fetchFinancialInstitutions.errorMessage = "";
    });
    builder.addCase(fetchFinancialInstitutions.pending, (state) => {
      state.fetchFinancialInstitutions.isLoading = true;
      state.fetchFinancialInstitutions.institutions = [];
      state.fetchFinancialInstitutions.errorMessage = "";
    });
    builder.addCase(fetchFinancialInstitutions.rejected, (state, action) => {
      state.fetchFinancialInstitutions.isLoading = false;
      state.fetchFinancialInstitutions.institutions = [];
      state.fetchFinancialInstitutions.errorMessage = action.error.message || "Unknown error occurred";
    });
    builder.addCase(refreshFinancialInstitutions.fulfilled, (state) => {
      state.refreshFinancialInstitutions.isLoading = false;
      state.refreshFinancialInstitutions.errorMessage = "";
    });
    builder.addCase(refreshFinancialInstitutions.pending, (state) => {
      state.refreshFinancialInstitutions.isLoading = true;
      state.refreshFinancialInstitutions.errorMessage = "";
    });
    builder.addCase(refreshFinancialInstitutions.rejected, (state, action) => {
      state.refreshFinancialInstitutions.isLoading = true;
      state.refreshFinancialInstitutions.errorMessage = action.error.message || "Unknown error occurred";
    });
  }
});
