import type { Goal } from "../components/GoalsTab";

export const mockGoalsData: Goal[] = [
  {
    id: "emergency",
    name: "Emergency Fund",
    description: "3-6 months of essential expenses",
    targetAmount: 10000,
    currentAmount: 5500,
    deadline: "2023-12-31",
    color: "bg-blue-500"
  },
  {
    id: "vacation",
    name: "Summer Vacation",
    description: "Trip to Europe",
    targetAmount: 3000,
    currentAmount: 1200,
    deadline: "2023-07-15",
    color: "bg-purple-500"
  },
  {
    id: "car",
    name: "New Car Down Payment",
    description: "20% down payment for a new car",
    targetAmount: 6000,
    currentAmount: 2500,
    deadline: "2024-03-01",
    color: "bg-green-500"
  }
];
