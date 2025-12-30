import type { Goal } from "../../components/GoalsTab";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import { mockGoalsData } from "../../mocks/goalsData";

export const fetchGoals = createAsyncThunk(
  'goals/fetch',
  async () => {
    // For now, return mock data. This can be replaced with an API call later
    return mockGoalsData;
  },
);

export const addGoal = createAsyncThunk(
  'goals/add',
  async (goalData: Omit<Goal, "id">, { getState }) => {
    const state = getState() as { goals: { goals: Goal[] } };
    const currentGoals = state.goals.goals;

    const newGoal: Goal = {
      ...goalData,
      id: uuidv4(),
    };

    const updatedGoals = [...currentGoals, newGoal];

    // Here you would normally make an API call to add the goal
    // For now, just return the updated goals array
    return updatedGoals;
  },
);

export const updateGoal = createAsyncThunk(
  'goals/update',
  async ({
    id,
    goalData
  }: {
    id: string;
    goalData: Omit<Goal, "id">;
  }, { getState }) => {
    const state = getState() as { goals: { goals: Goal[] } };
    const currentGoals = state.goals.goals;

    const updatedGoals = currentGoals.map((goal) =>
      goal.id === id ? { ...goalData, id } : goal
    );

    // Here you would normally make an API call to update the goal
    // For now, just return the updated goals array
    return updatedGoals;
  },
);

export const deleteGoal = createAsyncThunk(
  'goals/delete',
  async (id: string, { getState }) => {
    const state = getState() as { goals: { goals: Goal[] } };
    const currentGoals = state.goals.goals;

    const updatedGoals = currentGoals.filter((goal) => goal.id !== id);

    // Here you would normally make an API call to delete the goal
    // For now, just return the updated goals array
    return updatedGoals;
  },
);

export const updateGoalProgress = createAsyncThunk(
  'goals/updateProgress',
  async ({
    id,
    amount
  }: {
    id: string;
    amount: number;
  }, { getState }) => {
    const state = getState() as { goals: { goals: Goal[] } };
    const currentGoals = state.goals.goals;

    const updatedGoals = currentGoals.map((goal) =>
      goal.id === id
        ? {
            ...goal,
            currentAmount: goal.currentAmount + amount,
          }
        : goal
    );

    // Here you would normally make an API call to update the goal progress
    // For now, just return the updated goals array
    return updatedGoals;
  },
);
