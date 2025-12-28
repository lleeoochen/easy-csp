import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { getFunctions, httpsCallable } from "firebase/functions";
import { TransactionsTab } from "../components/TransactionsTab";
import type { Transaction } from "../components/TransactionsTab";
import { mockBudgetData } from "../mocks/budgetData";

// Define interface for API transaction data
interface APITransaction {
  id?: string;
  date?: string;
  name?: string;
  amount?: number | string;
  category?: string;
  [key: string]: unknown;
}

// Create a budgetCategories object from the mock budget data
const createBudgetCategoriesFromMock = () => {
  const result: {
    fixedCosts: { name: string; subCategories: Array<{ id: string; name: string }> };
    investments: { name: string; subCategories: Array<{ id: string; name: string }> };
    savings: { name: string; subCategories: Array<{ id: string; name: string }> };
    guiltFree: { name: string; subCategories: Array<{ id: string; name: string }> };
  } = {
    fixedCosts: { name: "", subCategories: [] },
    investments: { name: "", subCategories: [] },
    savings: { name: "", subCategories: [] },
    guiltFree: { name: "", subCategories: [] }
  };

  // Use categories from mock budget data
  Object.keys(mockBudgetData).forEach((key) => {
    const categoryKey = key as keyof typeof mockBudgetData;
    const category = mockBudgetData[categoryKey];

    result[categoryKey] = {
      name: category.name,
      subCategories: category.subCategories.map(sub => ({
        id: sub.id,
        name: sub.name
      }))
    };
  });

  return result;
};

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const functions = getFunctions();
  const budgetCategories = createBudgetCategoriesFromMock();

  const getPlaidTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const getTransactionsFunction = httpsCallable<unknown, APITransaction[]>(functions, "listTransactions");
      const result = await getTransactionsFunction();

      // Convert the API response to our Transaction type
      const convertedTransactions: Transaction[] = result.data.map((item: APITransaction) => ({
        id: item.id || uuidv4(),
        date: item.date || new Date().toISOString().split("T")[0],
        description: item.name || "Unknown",
        amount: typeof item.amount === "number" ? item.amount : parseFloat(String(item.amount)) || 0,
        // Default to fixedCosts and first subcategory, will need proper categorization
        category: "fixedCosts",
        subCategory: budgetCategories.fixedCosts.subCategories[0]?.id || ""
      }));

      setTransactions(convertedTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError(error instanceof Error ? error : new Error("Unknown error occurred"));
    } finally {
      setLoading(false);
    }
  }, [functions]);

  useEffect(() => {
    // Load transactions when the component mounts
    getPlaidTransactions();
  }, [getPlaidTransactions]);

  const handleAddTransaction = useCallback((transaction: Omit<Transaction, "id">) => {
    setTransactions(prev => [
      {
        ...transaction,
        id: uuidv4()
      },
      ...prev
    ]);
  }, []);

  const handleDeleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(transaction => transaction.id !== id));
  }, []);

  if (loading) {
    return (
      <div className="container max-w-md mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Transactions</h1>
        <div className="p-8 text-center">
          <div className="animate-pulse">Loading transactions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-md mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Transactions</h1>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">Error loading transactions: {error.message}</p>
          <button
            onClick={getPlaidTransactions}
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
      <h1 className="text-2xl font-bold px-4 pt-4 pb-2">Transactions</h1>
      <button
        onClick={getPlaidTransactions}
        className="mx-4 mb-2 px-3 py-1 bg-primary-100 text-primary-700 rounded text-sm"
      >
        Refresh
      </button>
      <TransactionsTab
        transactions={transactions}
        onAddTransaction={handleAddTransaction}
        onDeleteTransaction={handleDeleteTransaction}
        budgetCategories={budgetCategories}
      />
    </div>
  );
};

export default TransactionsPage;
