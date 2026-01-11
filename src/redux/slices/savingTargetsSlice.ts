import type { UI_SavingTargetAndBalance } from "../../types/uiTypes";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  fetchSavingTargets,
  addSavingTarget,
  updateSavingTarget,
  deleteSavingTarget,
  updateSavingTargetProgress
} from "../thunks/savingTargetsThunk";

type SavingTargetsSlice = {
  isLoading: boolean;
  savingTargets: UI_SavingTargetAndBalance[];
  errorMessage: string;
}

const initialState: SavingTargetsSlice = {
  isLoading: false,
  savingTargets: [],
  errorMessage: ""
};

export const savingTargetsSlice = createSlice({
  name: 'savingTargets',
  initialState,
  reducers: {
  },
  extraReducers: (builder) => {
    // Fetch Saving Targets
    builder.addCase(fetchSavingTargets.fulfilled, (state, action: PayloadAction<UI_SavingTargetAndBalance[]>) => {
      state.isLoading = false;
      state.savingTargets = action.payload;
      state.errorMessage = "";
    });
    builder.addCase(fetchSavingTargets.pending, (state) => {
      state.isLoading = true;
      state.errorMessage = "";
    });
    builder.addCase(fetchSavingTargets.rejected, (state, action) => {
      state.isLoading = false;
      state.errorMessage = action.error.message || "Failed to fetch saving targets";
    });

    // Add Saving Target
    builder.addCase(addSavingTarget.fulfilled, (state, action: PayloadAction<UI_SavingTargetAndBalance>) => {
      state.savingTargets.push(action.payload);
      state.errorMessage = "";
    });
    builder.addCase(addSavingTarget.rejected, (state, action) => {
      state.errorMessage = action.error.message || "Failed to add saving target";
    });

    // Update Saving Target
    builder.addCase(updateSavingTarget.fulfilled, (state, action: PayloadAction<UI_SavingTargetAndBalance>) => {
      const index = state.savingTargets.findIndex(savingTarget => savingTarget.id === action.payload.id);
      if (index !== -1) {
        state.savingTargets[index] = action.payload;
      }
      state.errorMessage = "";
    });
    builder.addCase(updateSavingTarget.rejected, (state, action) => {
      state.errorMessage = action.error.message || "Failed to update saving target";
    });

    // Delete Saving Target
    builder.addCase(deleteSavingTarget.fulfilled, (state, action: PayloadAction<string>) => {
      state.savingTargets = state.savingTargets.filter(savingTarget => savingTarget.id !== action.payload);
      state.errorMessage = "";
    });
    builder.addCase(deleteSavingTarget.rejected, (state, action) => {
      state.errorMessage = action.error.message || "Failed to delete saving target";
    });

    // Update Saving Target Progress
    builder.addCase(updateSavingTargetProgress.fulfilled, (state) => {
      // Just clear error message - the fetchSavingTargets will update the data
      state.errorMessage = "";
    });
    builder.addCase(updateSavingTargetProgress.rejected, (state, action) => {
      state.errorMessage = action.error.message || "Failed to update saving target progress";
    });
  }
});
