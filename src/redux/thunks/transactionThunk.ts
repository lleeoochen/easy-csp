import type { Transaction, ListTransactionsRequest } from "@easy-csp/shared-types";
import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState } from "../store";
import { TransactionsService } from "../../services/transactionsService";

export type ThunkProps_FetchTransactionsByDateRange = ListTransactionsRequest;

export const fetchTransactions = createAsyncThunk<
  Transaction[],
  void,
  { state: RootState }
>(
  'transactions/fetch',
  async () => {
    try {
      return await TransactionsService.listTransactions();
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },
);

export const fetchTransactionsByDateRange = createAsyncThunk<
  Transaction[],
  ThunkProps_FetchTransactionsByDateRange,
  { state: RootState }
>(
  'transactions/fetchByDateRange',
  async (request: ListTransactionsRequest) => {
    try {
      return await TransactionsService.listTransactions(request);
    } catch (error) {
      console.error('Error fetching transactions by date range:', error);
      throw error;
    }
  },
);
