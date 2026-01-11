import { createAsyncThunk } from "@reduxjs/toolkit";
import { mockConsciousSpendingPlanData } from "../../mocks/consciousSpendingPlanData";
import type { ConsciousSpendingPlan } from "@easy-csp/shared-types";
import type { RootState } from "../store";

export const fetchConsciousSpendingPlan = createAsyncThunk<
  ConsciousSpendingPlan,
  void,
  { state: RootState }
>(
  'consciousSpendingPlan/fetch',
  async () => {
    // For now, return mock data. This can be replaced with an API call later
    return mockConsciousSpendingPlanData;
  },
);
