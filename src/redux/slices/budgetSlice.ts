import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { fetchBudget } from "../thunks/budgetThunk";
import type { ConsciousSpendingPlan } from "@easy-csp/shared-types";

type BudgetSlice = {
  isLoading: boolean;
  consciousSpendingPlan: ConsciousSpendingPlan | null;
  errorMessage: string;
}

const initialState: BudgetSlice = {
  isLoading: false,
  consciousSpendingPlan: {
    income: [],
    fixedCost: [],
    guildFreeSpending: [],
    investment: [],
    savings: []
  },
  errorMessage: ""
};

export const budgetSlice = createSlice({
  name: 'budget',
  initialState,
  reducers: {
  },
  extraReducers: (builder) => {
    // Fetch Budget
    builder.addCase(fetchBudget.fulfilled, (state, action: PayloadAction<ConsciousSpendingPlan>) => {
      state.isLoading = false;
      state.consciousSpendingPlan = action.payload;
      state.errorMessage = "";
    });
    builder.addCase(fetchBudget.pending, (state) => {
      state.isLoading = true;
      state.errorMessage = "";
    });
    builder.addCase(fetchBudget.rejected, (state, action) => {
      state.isLoading = false;
      state.errorMessage = action.error.message || "Failed to fetch budget";
    });
  }
});
