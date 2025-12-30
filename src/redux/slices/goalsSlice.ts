import type { Goal } from "../../components/GoalsTab";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  fetchGoals,
  addGoal,
  updateGoal,
  deleteGoal,
  updateGoalProgress
} from "../thunks/goalsThunk";

type GoalsSlice = {
  isLoading: boolean;
  goals: Goal[];
  errorMessage: string;
}

const initialState: GoalsSlice = {
  isLoading: false,
  goals: [],
  errorMessage: ""
};

export const goalsSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
  },
  extraReducers: (builder) => {
    // Fetch Goals
    builder.addCase(fetchGoals.fulfilled, (state, action: PayloadAction<Goal[]>) => {
      state.isLoading = false;
      state.goals = action.payload;
      state.errorMessage = "";
    });
    builder.addCase(fetchGoals.pending, (state) => {
      state.isLoading = true;
      state.errorMessage = "";
    });
    builder.addCase(fetchGoals.rejected, (state, action) => {
      state.isLoading = false;
      state.errorMessage = action.error.message || "Failed to fetch goals";
    });

    // Add Goal
    builder.addCase(addGoal.fulfilled, (state, action: PayloadAction<Goal[]>) => {
      state.goals = action.payload;
      state.errorMessage = "";
    });
    builder.addCase(addGoal.rejected, (state, action) => {
      state.errorMessage = action.error.message || "Failed to add goal";
    });

    // Update Goal
    builder.addCase(updateGoal.fulfilled, (state, action: PayloadAction<Goal[]>) => {
      state.goals = action.payload;
      state.errorMessage = "";
    });
    builder.addCase(updateGoal.rejected, (state, action) => {
      state.errorMessage = action.error.message || "Failed to update goal";
    });

    // Delete Goal
    builder.addCase(deleteGoal.fulfilled, (state, action: PayloadAction<Goal[]>) => {
      state.goals = action.payload;
      state.errorMessage = "";
    });
    builder.addCase(deleteGoal.rejected, (state, action) => {
      state.errorMessage = action.error.message || "Failed to delete goal";
    });

    // Update Goal Progress
    builder.addCase(updateGoalProgress.fulfilled, (state, action: PayloadAction<Goal[]>) => {
      state.goals = action.payload;
      state.errorMessage = "";
    });
    builder.addCase(updateGoalProgress.rejected, (state, action) => {
      state.errorMessage = action.error.message || "Failed to update goal progress";
    });
  }
});
