import { createAsyncThunk } from "@reduxjs/toolkit";
import { mockBudgetData } from "../../mocks/budgetData";

export const fetchBudget = createAsyncThunk(
  'budget/fetch',
  async () => {
    // For now, return mock data. This can be replaced with an API call later
    return mockBudgetData;
  },
);
