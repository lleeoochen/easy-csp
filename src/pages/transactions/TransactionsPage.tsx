import { useCallback, useEffect } from "react";
import { TransactionsList } from "./TransactionsList";
import { fetchTransactions } from "../../redux/thunks/transactionThunk";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";

const TransactionsPage = () => {
  const dispatch = useAppDispatch();
  const transactionState = useAppSelector(state => state.transaction);
  const transactions = transactionState.transactions;
  const loading = transactionState.isLoading;
  const errorMessage = transactionState.errorMessage;

  const dispatchFetchTransactions = useCallback(async () => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  useEffect(() => {
    // Load transactions when the component mounts
    dispatchFetchTransactions();
  }, [dispatchFetchTransactions]);

  if (loading) {
    return (
      <div className="container max-w-md mx-auto p-4">
        <h1 className="text-2xl text-center font-bold mb-4">Transactions</h1>
        <div className="p-8 text-center">
          <div className="animate-pulse">Loading transactions...</div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="container max-w-md mx-auto p-4">
        <h1 className="text-2xl text-center font-bold mb-4">Transactions</h1>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">Error loading transactions: {errorMessage}</p>
          <button
            onClick={dispatchFetchTransactions}
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
      <h1 className="text-2xl text-center font-bold px-4 pt-4 pb-2">Transactions</h1>
      <TransactionsList
        transactions={transactions}
      />
    </div>
  );
};

export default TransactionsPage;
