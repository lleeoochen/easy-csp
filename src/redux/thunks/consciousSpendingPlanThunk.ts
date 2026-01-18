import { createAsyncThunk } from "@reduxjs/toolkit";
import { ConsciousSpendingPlanService } from "../../services/consciousSpendingPlanService";
import type { ConsciousSpendingPlan, CSPBucket } from "@easy-csp/shared-types";
import type { RootState } from "../store";

export const fetchConsciousSpendingPlan = createAsyncThunk<
  ConsciousSpendingPlan,
  void,
  { state: RootState }
>(
  'consciousSpendingPlan/fetch',
  async (_, { rejectWithValue }) => {
    const result = await ConsciousSpendingPlanService.getCSP();

    if (!result.success) {
      return rejectWithValue(result.message || "Failed to fetch CSP");
    }

    return result.csp!;
  },
);

export const updateCSPItem = createAsyncThunk<
  ConsciousSpendingPlan,
  { bucket: CSPBucket; category: string; amount: number },
  { state: RootState }
>(
  'consciousSpendingPlan/updateItem',
  async ({ bucket, category, amount }, { rejectWithValue }) => {
    const result = await ConsciousSpendingPlanService.updateCSPItem(bucket, category, amount);
    if (!result.success) {
      return rejectWithValue(result.message || "Failed to update CSP item");
    }
    return result.csp!;
  },
);

export const addCSPItem = createAsyncThunk<
  ConsciousSpendingPlan,
  { bucket: CSPBucket; category: string; amount: number },
  { state: RootState }
>(
  'consciousSpendingPlan/addItem',
  async ({ bucket, category, amount }, { rejectWithValue }) => {
    const result = await ConsciousSpendingPlanService.addCSPItem(bucket, category, amount);

    if (!result.success) {
      return rejectWithValue(result.message || "Failed to add CSP item");
    }

    return result.csp!;
  },
);

export const deleteCSPItem = createAsyncThunk<
  ConsciousSpendingPlan,
  { bucket: CSPBucket; category: string },
  { state: RootState }
>(
  'consciousSpendingPlan/deleteItem',
  async ({ bucket, category }, { rejectWithValue }) => {
    const result = await ConsciousSpendingPlanService.deleteCSPItem(bucket, category);

    if (!result.success) {
      return rejectWithValue(result.message || "Failed to delete CSP item");
    }

    return result.csp!;
  },
);
