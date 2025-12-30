import { useCallback, useEffect } from "react";
import { CategorySectionList } from "./CategorySectionList";
import { fetchBudget } from "../../redux/thunks/budgetThunk";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";

const BudgetPage = () => {
  const dispatch = useAppDispatch();
  const budgetState = useAppSelector(state => state.budget);
  const budget = budgetState.consciousSpendingPlan;
  const loading = budgetState.isLoading;
  const errorMessage = budgetState.errorMessage;

  const dispatchFetchBudget = useCallback(async () => {
    dispatch(fetchBudget());
  }, [dispatch]);

  useEffect(() => {
    // Load budget when the component mounts
    dispatchFetchBudget();
  }, [dispatchFetchBudget]);

  if (loading) {
    return (
      <div className="container max-w-md mx-auto">
        <h1 className="text-2xl font-bold px-4 pt-4">Conscious Spending Plan</h1>
        <div className="p-8 text-center">
          <div className="animate-pulse">Loading budget...</div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="container max-w-md mx-auto">
        <h1 className="text-2xl font-bold px-4 pt-4">Conscious Spending Plan</h1>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mx-4">
          <p className="text-red-600">Error loading budget: {errorMessage}</p>
          <button
            onClick={dispatchFetchBudget}
            className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="container max-w-md mx-auto">
        <h1 className="text-2xl font-bold px-4 pt-4">Conscious Spending Plan</h1>
        <div className="p-8 text-center">
          <p className="text-gray-600">No budget data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto">
      <h1 className="text-2xl font-bold px-4 pt-4">Conscious Spending Plan</h1>
      <CategorySectionList
        consciousSpendingPlan={budget}
      />
    </div>
  );
};

export default BudgetPage;
