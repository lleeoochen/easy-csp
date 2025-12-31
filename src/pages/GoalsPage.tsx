import { useCallback, useEffect } from "react";
import { GoalsTab } from "../components/GoalsTab";
import type { Goal } from "../components/GoalsTab";
import {
  fetchGoals,
  addGoal,
  updateGoal,
  deleteGoal,
  updateGoalProgress
} from "../redux/thunks/goalsThunk";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";

const GoalsPage = () => {
  const dispatch = useAppDispatch();
  const goalsState = useAppSelector(state => state.goals);
  const goals = goalsState.goals;
  const loading = goalsState.isLoading;
  const errorMessage = goalsState.errorMessage;

  const dispatchFetchGoals = useCallback(async () => {
    dispatch(fetchGoals());
  }, [dispatch]);

  const handleAddGoal = useCallback((goalData: Omit<Goal, "id">) => {
    dispatch(addGoal(goalData));
  }, [dispatch]);

  const handleUpdateGoal = useCallback((id: string, goalData: Omit<Goal, "id">) => {
    dispatch(updateGoal({ id, goalData }));
  }, [dispatch]);

  const handleDeleteGoal = useCallback((id: string) => {
    dispatch(deleteGoal(id));
  }, [dispatch]);

  const handleUpdateProgress = useCallback((id: string, amount: number) => {
    dispatch(updateGoalProgress({ id, amount }));
  }, [dispatch]);

  useEffect(() => {
    // Load goals when the component mounts
    dispatchFetchGoals();
  }, [dispatchFetchGoals]);

  if (loading) {
    return (
      <div className="container max-w-md mx-auto">
        <h1 className="text-2xl text-center font-bold px-4 pt-4">Savings Goals</h1>
        <div className="p-8 text-center">
          <div className="animate-pulse">Loading goals...</div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="container max-w-md mx-auto">
        <h1 className="text-2xl text-center font-bold px-4 pt-4">Savings Goals</h1>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mx-4">
          <p className="text-red-600">Error loading goals: {errorMessage}</p>
          <button
            onClick={dispatchFetchGoals}
            className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto">
      <h1 className="text-2xl text-center font-bold px-4 pt-4">Savings Goals</h1>
      <GoalsTab
        goals={goals}
        onAddGoal={handleAddGoal}
        onUpdateGoal={handleUpdateGoal}
        onDeleteGoal={handleDeleteGoal}
        onUpdateProgress={handleUpdateProgress}
      />
    </div>
  );
};

export default GoalsPage;
