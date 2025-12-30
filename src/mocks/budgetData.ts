import type { ConsciousSpendingPlan } from "@easy-csp/shared-types";

export const mockBudgetData: ConsciousSpendingPlan = {
  fixedCost: [
    {
      category: "Rent",
      amount: 1500,
    },
    {
      category: "Utilities",
      amount: 1500,
    },
  ],
  investment: [
    {
      category: "Retirement",
      amount: 300,
    }
  ],
  savings: [
    {
      category: "Emergency Fund",
      amount: 400,
    },
    {
      category: "Vacation",
      amount: 400,
    }
  ],
  guildFreeSpending: [
    {
      category: "Dining",
      amount: 300,
    }
  ],
  income: [
    {
      category: "Salary",
      amount: 3000
    }
  ]
};
