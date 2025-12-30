import type { Transaction } from "@easy-csp/shared-types";
import { createAsyncThunk } from "@reduxjs/toolkit"
import { getFunctions, httpsCallable } from "firebase/functions";

export const fetchTransactions = createAsyncThunk(
  'transactions/fetch',
  async () => {
    const functions = getFunctions();
    const getTransactionsFunction = httpsCallable<unknown, Transaction[]>(functions, "listTransactions");
    const result = await getTransactionsFunction();
    return result.data;
  },
);
