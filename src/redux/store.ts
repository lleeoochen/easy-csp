import { configureStore } from "@reduxjs/toolkit";
import { transactionSlice } from "./slices/transactionSlice";
import { financialInstitutionSlice } from "./slices/financialInstitutionSlice";
import { consciousSpendingPlanSlice } from "./slices/consciousSpendingPlanSlice";
import { savingTargetsSlice } from "./slices/savingTargetsSlice";

const store = configureStore({
  reducer: {
    transaction: transactionSlice.reducer,
    financialInstitution: financialInstitutionSlice.reducer,
    consciousSpendingPlan: consciousSpendingPlanSlice.reducer,
    savingTargets: savingTargetsSlice.reducer
  }
});

export default store;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {users: UsersState, ...}
export type AppDispatch = typeof store.dispatch;
