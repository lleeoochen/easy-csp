import type { FinancialInstitution } from "@easy-csp/shared-types";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { fetchFinancialInstitutions } from "../thunks/financialInstitutionThunk";

type FinancialInstitutionSlice = {
  isLoading: boolean;
  institutions: FinancialInstitution[],
  errorMessage: string;
}

const initialState: FinancialInstitutionSlice = {
  isLoading: false,
  institutions: [],
  errorMessage: ""
};

export const financialInstitutionSlice = createSlice({
  name: 'financialInstitution',
  initialState,
  reducers: {
  },
  extraReducers: (builder) => {
    builder.addCase(fetchFinancialInstitutions.fulfilled, (state, action: PayloadAction<FinancialInstitution[]>) => {
      state.isLoading = false;
      state.institutions = action.payload;
      state.errorMessage = "";
    });
    builder.addCase(fetchFinancialInstitutions.pending, (state) => {
      state.isLoading = true;
      state.institutions = [];
      state.errorMessage = "";
    });
    builder.addCase(fetchFinancialInstitutions.rejected, (state, action) => {
      state.isLoading = false;
      state.institutions = [];
      state.errorMessage = action.error.message || "Unknown error occurred";
    });
  }
});
