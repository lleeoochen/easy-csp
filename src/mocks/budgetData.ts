import type { Budget } from "../components/BudgetTab";

export const mockBudgetData: Budget = {
  fixedCosts: {
    name: "Fixed Costs",
    color: "bg-blue-500",
    description: "Essential monthly expenses",
    recommended: "50-60% of your monthly income",
    subCategories: [
      {
        id: "rent",
        name: "Rent/Mortgage",
        budgeted: 1500,
        spent: 1500,
      },
      {
        id: "utilities",
        name: "Utilities",
        budgeted: 200,
        spent: 175,
      },
      {
        id: "groceries",
        name: "Groceries",
        budgeted: 400,
        spent: 385,
      },
      {
        id: "transportation",
        name: "Transportation",
        budgeted: 150,
        spent: 120,
      },
      {
        id: "insurance",
        name: "Insurance",
        budgeted: 200,
        spent: 200,
      }
    ],
  },
  investments: {
    name: "Investments",
    color: "bg-green-500",
    description: "Investments for your future",
    recommended: "10-15% of your monthly income",
    subCategories: [
      {
        id: "retirement",
        name: "Retirement Accounts",
        budgeted: 500,
        spent: 500,
      },
      {
        id: "stocks",
        name: "Stocks/ETFs",
        budgeted: 300,
        spent: 300,
      },
      {
        id: "education",
        name: "Education/Skills",
        budgeted: 100,
        spent: 0,
      }
    ],
  },
  savings: {
    name: "Savings",
    color: "bg-purple-500",
    description: "Saving for your goals",
    recommended: "10-15% of your monthly income",
    subCategories: [
      {
        id: "emergency",
        name: "Emergency Fund",
        budgeted: 400,
        spent: 400,
      },
      {
        id: "vacation",
        name: "Vacation",
        budgeted: 200,
        spent: 200,
      },
      {
        id: "down-payment",
        name: "House Down Payment",
        budgeted: 300,
        spent: 300,
      }
    ],
  },
  guiltFree: {
    name: "Guilt-Free Spending",
    color: "bg-orange-500",
    description: "Discretionary spending for enjoyment",
    recommended: "20-30% of your monthly income",
    subCategories: [
      {
        id: "dining",
        name: "Dining Out",
        budgeted: 300,
        spent: 345,
      },
      {
        id: "entertainment",
        name: "Entertainment",
        budgeted: 200,
        spent: 190,
      },
      {
        id: "shopping",
        name: "Shopping",
        budgeted: 200,
        spent: 250,
      },
      {
        id: "subscription",
        name: "Subscriptions",
        budgeted: 100,
        spent: 95,
      }
    ],
  },
};
