import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  fetchConsciousSpendingPlan,
  updateCSPItem,
  addCSPItem,
  deleteCSPItem
} from "../thunks/consciousSpendingPlanThunk";
import type { ConsciousSpendingPlan } from "@easy-csp/shared-types";

type ConsciousSpendingPlanSlice = {
  isLoading: boolean;
  consciousSpendingPlan: ConsciousSpendingPlan | null;
  errorMessage: string;
}

const initialState: ConsciousSpendingPlanSlice = {
  isLoading: false,
  consciousSpendingPlan: {
    income: [],
    fixedCost: [],
    guildFreeSpending: [],
    investment: [],
    savings: [],
    ignored: []
  },
  errorMessage: ""
};

export const consciousSpendingPlanSlice = createSlice({
  name: 'consciousSpendingPlan',
  initialState,
  reducers: {
  },
  extraReducers: (builder) => {
    // Fetch CSP
    builder.addCase(fetchConsciousSpendingPlan.fulfilled, (state, action: PayloadAction<ConsciousSpendingPlan>) => {
      state.isLoading = false;
      state.consciousSpendingPlan = action.payload;
      state.errorMessage = "";
    });
    builder.addCase(fetchConsciousSpendingPlan.pending, (state) => {
      state.isLoading = true;
      state.errorMessage = "";
    });
    builder.addCase(fetchConsciousSpendingPlan.rejected, (state, action) => {
      state.isLoading = false;
      state.errorMessage = action.error.message || "Failed to fetch budget";
    });

    // Update CSP Item
    builder.addCase(updateCSPItem.fulfilled, (state, action: PayloadAction<ConsciousSpendingPlan>) => {
      state.isLoading = false;
      state.consciousSpendingPlan = action.payload;
      state.errorMessage = "";
    });
    builder.addCase(updateCSPItem.pending, (state) => {
      // state.isLoading = true;
      state.errorMessage = "";
    });
    builder.addCase(updateCSPItem.rejected, (state, action) => {
      state.isLoading = false;
      state.errorMessage = action.error.message || "Failed to update CSP item";
    });

    // Add CSP Item
    builder.addCase(addCSPItem.fulfilled, (state, action: PayloadAction<ConsciousSpendingPlan>) => {
      state.isLoading = false;
      state.consciousSpendingPlan = action.payload;
      state.errorMessage = "";
    });
    builder.addCase(addCSPItem.pending, (state) => {
      // state.isLoading = true;
      state.errorMessage = "";
    });
    builder.addCase(addCSPItem.rejected, (state, action) => {
      state.isLoading = false;
      state.errorMessage = action.error.message || "Failed to add CSP item";
    });

    // Delete CSP Item
    builder.addCase(deleteCSPItem.fulfilled, (state, action: PayloadAction<ConsciousSpendingPlan>) => {
      state.isLoading = false;
      state.consciousSpendingPlan = action.payload;
      state.errorMessage = "";
    });
    builder.addCase(deleteCSPItem.pending, (state) => {
      // state.isLoading = true;
      state.errorMessage = "";
    });
    builder.addCase(deleteCSPItem.rejected, (state, action) => {
      state.isLoading = false;
      state.errorMessage = action.error.message || "Failed to delete CSP item";
    });
  }
});
