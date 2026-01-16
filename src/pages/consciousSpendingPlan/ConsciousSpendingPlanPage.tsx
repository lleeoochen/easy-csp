import { useCallback, useEffect, useState } from "react";
import { CSPBucketCardList } from "./CSPBucketCardList";
import { fetchConsciousSpendingPlan } from "../../redux/thunks/consciousSpendingPlanThunk";
import { fetchTransactionsByDateRange } from "../../redux/thunks/transactionThunk";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { MonthSelector } from "../../components/MonthSelector";
import { getCurrentMonthYear, getMonthBoundaries } from "../../utils/dateUtils";

const ConsciousSpendingPlanPage = () => {
  const dispatch = useAppDispatch();
  const consciousSpendingPlanState = useAppSelector(state => state.consciousSpendingPlan);
  const consciousSpendingPlan = consciousSpendingPlanState.consciousSpendingPlan;
  const loading = consciousSpendingPlanState.isLoading;
  const errorMessage = consciousSpendingPlanState.errorMessage;

  // Initialize with current month
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const dispatchFetchConsciousSpendingPlan = useCallback(async () => {
    dispatch(fetchConsciousSpendingPlan());
  }, [dispatch]);

  const handleMonthSelect = useCallback((year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  }, []);

  useEffect(() => {
    // Load consciousSpendingPlan when the component mounts
    dispatchFetchConsciousSpendingPlan();
  }, [dispatchFetchConsciousSpendingPlan]);

  useEffect(() => {
    // Fetch transactions for selected month
    const { startDate, endDate } = getMonthBoundaries(selectedYear, selectedMonth);
    dispatch(fetchTransactionsByDateRange({ startDate, endDate }));
  }, [dispatch, selectedYear, selectedMonth]);

  if (loading) {
    return (
      <div className="container max-w-md mx-auto">
        <h1 className="text-2xl text-center font-bold px-4 pt-4">Conscious Spending Plan</h1>
        <div className="p-8 text-center">
          <div className="animate-pulse">Loading consciousSpendingPlan...</div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="container max-w-md mx-auto">
        <h1 className="text-2xl text-center font-bold px-4 pt-4">Conscious Spending Plan</h1>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mx-4">
          <p className="text-red-600">Error loading consciousSpendingPlan: {errorMessage}</p>
          <button
            onClick={dispatchFetchConsciousSpendingPlan}
            className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!consciousSpendingPlan) {
    return (
      <div className="container max-w-md mx-auto">
        <h1 className="text-lg text-center font-bold px-4 pt-4">Conscious Spending Plan</h1>
        <div className="p-8 text-center">
          <p className="text-gray-600">No consciousSpendingPlan data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto">
      <h1 className="text-lg text-center font-bold px-4 pt-4">Conscious Spending Plan</h1>

      {/* Month Selector */}
      <MonthSelector
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthSelect={handleMonthSelect}
        className="mb-4"
      />

      <CSPBucketCardList />
    </div>
  );
};

export default ConsciousSpendingPlanPage;
