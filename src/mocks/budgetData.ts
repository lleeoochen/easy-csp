import { CSPCategory, type ConsciousSpendingPlan } from "@easy-csp/shared-types";

export const mockBudgetData: ConsciousSpendingPlan = {
  income: [
    {
      category: CSPCategory.Income,
      amount: 5000,
    }
  ],
  fixedCost: [
    {
      category: CSPCategory.RentMortgage,
      amount: 1500,
    },
    {
      category: CSPCategory.Utilities,
      amount: 200,
    },
    {
      category: CSPCategory.Insurance,
      amount: 350,
    },
    {
      category: CSPCategory.CarPaymentTransportation,
      amount: 450,
    },
    {
      category: CSPCategory.DebtPayments,
      amount: 300,
    },
    {
      category: CSPCategory.Groceries,
      amount: 400,
    },
    {
      category: CSPCategory.Phone,
      amount: 80,
    },
    {
      category: CSPCategory.Clothes,
      amount: 100,
    },
    {
      category: CSPCategory.Subscriptions,
      amount: 75,
    },
    {
      category: CSPCategory.Miscellaneous,
      amount: 150,
    }
  ],
  savings: [
    {
      category: CSPCategory.PostTaxRetirementSavings,
      amount: 250,
    },
    {
      category: CSPCategory.LongTermEmergencyFund,
      amount: 200,
    },
    {
      category: CSPCategory.Gifts,
      amount: 100,
    },
    {
      category: CSPCategory.Vacations,
      amount: 150,
    }
  ],
  investment: [
    {
      category: CSPCategory.Stocks,
      amount: 300,
    }
  ],
  guildFreeSpending: [
    {
      category: CSPCategory.GuildFreeSpending,
      amount: 600,
    }
  ],
  ignored: [
    {
      category: CSPCategory.Transfer,
      amount: 0,
    }
  ]
};
