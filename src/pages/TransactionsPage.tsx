import { useCallback, useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { Transaction } from 'plaid';

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const functions = getFunctions();

  const getPlaidTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const getTransactionsFunction = httpsCallable<undefined, { added: Transaction[], modified: Transaction[], removed: Transaction[], hasMore: boolean }>(functions, 'listTransactions');
      const result = await getTransactionsFunction();

      // Assuming the result data contains transactions
      // You may need to adjust this based on your actual data structure
      setTransactions(result.data.added);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError(error instanceof Error ? error : new Error('Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, [functions]);

  useEffect(() => {
    // Load transactions when the component mounts
    getPlaidTransactions();
  }, [getPlaidTransactions]);

  if (loading) {
    return <div>Loading transactions...</div>;
  }

  if (error) {
    return <div>Error loading transactions: {error.message}</div>;
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div>
        <h2>Transactions</h2>
        <p>No transactions found. Link your financial institution to see transactions.</p>
        <button onClick={getPlaidTransactions}>Refresh Transactions</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Transactions</h2>
      <button onClick={getPlaidTransactions}>Refresh Transactions</button>

      <div className="transactions-list">
        {transactions.map((transaction) => (
          <div key={transaction.transaction_id} className="transaction-item">
            <div className="transaction-date">{transaction.date}</div>
            <div className="transaction-name">{transaction.name}</div>
            <div className="transaction-amount">
              ${Math.abs(parseFloat(String(transaction.amount))).toFixed(2)}
            </div>
            <div className="transaction-category">
              {transaction.category?.join(', ') || 'Uncategorized'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionsPage;
