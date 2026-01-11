import type { Transaction, ListTransactionsRequest } from "@easy-csp/shared-types";
import { createAsyncThunk } from "@reduxjs/toolkit"
import { getFunctions, httpsCallable } from "firebase/functions";
import type { RootState } from "../store";

export type ThunkProps_FetchTransactionsByDateRange = ListTransactionsRequest;

export const fetchTransactions = createAsyncThunk<
  Transaction[],
  void,
  { state: RootState }
>(
  'transactions/fetch',
  async () => {
    const functions = getFunctions();
    const getTransactionsFunction = httpsCallable<unknown, Transaction[]>(functions, "listTransactions");
    const result = await getTransactionsFunction();
    return result.data;
  },
);

export const fetchTransactionsByDateRange = createAsyncThunk<
  Transaction[],
  ThunkProps_FetchTransactionsByDateRange,
  { state: RootState }
>(
  'transactions/fetchByDateRange',
  async (request: ListTransactionsRequest) => {
    const functions = getFunctions();
    const getTransactionsFunction = httpsCallable<ListTransactionsRequest, Transaction[]>(
      functions, "listTransactions"
    );
    const result = await getTransactionsFunction(request);
    return result.data;
  },
);
