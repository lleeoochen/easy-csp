import type { Transaction } from "@easy-csp/shared-types";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { fetchTransactions } from "../thunks/transactionThunk";

type TransactionSlice = {
  isLoading: boolean;
  transactions: Transaction[],
  errorMessage: string;
}

const initialState: TransactionSlice = {
  isLoading: false,
  transactions: [],
  errorMessage: ""
};

export const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
  },
  extraReducers: (builder) => {
    builder.addCase(fetchTransactions.fulfilled, (state, action: PayloadAction<Transaction[]>) => {
      state.isLoading = false;
      state.transactions = action.payload;
      state.errorMessage = "";
    });
    builder.addCase(fetchTransactions.pending, (state) => {
      state.isLoading = true;
      state.transactions = [];
      state.errorMessage = "";
    });
    builder.addCase(fetchTransactions.rejected, (state, action) => {
      state.isLoading = false;
      state.transactions = [];
      state.errorMessage = action.error.message;
    });
  }
});
