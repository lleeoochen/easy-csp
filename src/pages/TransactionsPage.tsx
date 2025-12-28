import { useCallback, useEffect, useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { TransactionsTab } from "../components/TransactionsTab";
import type { Transaction } from "@easy-csp/shared-types";


const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const functions = getFunctions();

  const getPlaidTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const getTransactionsFunction = httpsCallable<unknown, Transaction[]>(functions, "listTransactions");
      const result = await getTransactionsFunction();
      setTransactions(result.data);
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
        onDeleteTransaction={handleDeleteTransaction}
      />
    </div>
  );
};

export default TransactionsPage;
