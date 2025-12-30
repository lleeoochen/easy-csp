import type { FinancialInstitution } from "@easy-csp/shared-types";
import { createAsyncThunk } from "@reduxjs/toolkit"
import { getFunctions, httpsCallable } from "firebase/functions";

export const fetchFinancialInstitutions = createAsyncThunk(
  'financialInstitutions/fetch',
  async () => {
    const functions = getFunctions();
    const listFinancialInstitutionsFunction = httpsCallable<unknown, FinancialInstitution[]>(functions, "listFinancialInstitutions");
    const result = await listFinancialInstitutionsFunction();
    return result.data;
  },
);
