import type { Transaction } from "../components/TransactionsTab";

export const mockTransactionsData: Transaction[] = [
  {
    id: "tx1",
    date: "2023-08-15",
    description: "Grocery Store",
    amount: 125.47,
    category: "fixedCosts",
    subCategory: "groceries"
  },
  {
    id: "tx2",
    date: "2023-08-14",
    description: "Movie Tickets",
    amount: 32.99,
    category: "guiltFree",
    subCategory: "entertainment"
  },
  {
    id: "tx3",
    date: "2023-08-12",
    description: "Monthly Rent",
    amount: 1500,
    category: "fixedCosts",
    subCategory: "rent"
  },
  {
    id: "tx4",
    date: "2023-08-10",
    description: "Restaurant Dinner",
    amount: 78.25,
    category: "guiltFree",
    subCategory: "dining"
  },
  {
    id: "tx5",
    date: "2023-08-08",
    description: "401k Contribution",
    amount: 250,
    category: "investments",
    subCategory: "retirement"
  },
  {
    id: "tx6",
    date: "2023-08-05",
    description: "Electric Bill",
    amount: 95.42,
    category: "fixedCosts",
    subCategory: "utilities"
  },
  {
    id: "tx7",
    date: "2023-08-03",
    description: "Vacation Fund Transfer",
    amount: 200,
    category: "savings",
    subCategory: "vacation"
  },
  {
    id: "tx8",
    date: "2023-08-01",
    description: "New Shoes",
    amount: 89.99,
    category: "guiltFree",
    subCategory: "shopping"
  }
];
