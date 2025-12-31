import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { fetchConsciousSpendingPlan } from "../thunks/consciousSpendingPlanThunk";
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
  }
});
