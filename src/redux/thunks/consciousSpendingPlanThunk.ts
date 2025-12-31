import { createAsyncThunk } from "@reduxjs/toolkit";
import { mockConsciousSpendingPlanData } from "../../mocks/consciousSpendingPlanData";

export const fetchConsciousSpendingPlan = createAsyncThunk(
  'consciousSpendingPlan/fetch',
  async () => {
    // For now, return mock data. This can be replaced with an API call later
    return mockConsciousSpendingPlanData;
  },
);
