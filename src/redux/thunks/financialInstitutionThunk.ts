import type { FinancialInstitution } from "@easy-csp/shared-types";
import { createAsyncThunk } from "@reduxjs/toolkit"
import { getFunctions, httpsCallable } from "firebase/functions";
import type { RootState } from "../store";

export const fetchFinancialInstitutions = createAsyncThunk<
  FinancialInstitution[],
  void,
  { state: RootState }
>(
  'financialInstitutions/fetch',
  async () => {
    const functions = getFunctions();
    const listFinancialInstitutionsFunction = httpsCallable<unknown, FinancialInstitution[]>(functions, "listFinancialInstitutions");
    const result = await listFinancialInstitutionsFunction();
    return result.data;
  },
);
