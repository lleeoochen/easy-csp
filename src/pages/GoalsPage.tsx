import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { GoalsTab } from "../components/GoalsTab";
import type { Goal } from "../components/GoalsTab";
import { mockGoalsData } from "../mocks/goalsData";

const GoalsPage = () => {
  const [goals, setGoals] = useState<Goal[]>(mockGoalsData);

  const handleAddGoal = useCallback((goalData: Omit<Goal, "id">) => {
    setGoals((prevGoals) => [
      ...prevGoals,
      {
        ...goalData,
        id: uuidv4(),
      },
    ]);
  }, []);

  const handleUpdateGoal = useCallback((id: string, goalData: Omit<Goal, "id">) => {
    setGoals((prevGoals) =>
      prevGoals.map((goal) => (goal.id === id ? { ...goalData, id } : goal))
    );
  }, []);

  const handleDeleteGoal = useCallback((id: string) => {
    setGoals((prevGoals) => prevGoals.filter((goal) => goal.id !== id));
  }, []);

  const handleUpdateProgress = useCallback((id: string, amount: number) => {
    setGoals((prevGoals) =>
      prevGoals.map((goal) =>
        goal.id === id
          ? {
              ...goal,
              currentAmount: goal.currentAmount + amount,
            }
          : goal
      )
    );
  }, []);

  return (
    <div className="container max-w-md mx-auto">
      <h1 className="text-2xl font-bold px-4 pt-4">Savings Goals</h1>
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
