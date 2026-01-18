import { useCallback, useEffect } from "react";
import { TransactionsList } from "./TransactionsList";
import { fetchTransactions } from "../../redux/thunks/transactionThunk";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { Page } from "../../components/Page";

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
      <Page title="Transactions">
        <div className="p-8 text-center">
          <div className="animate-pulse">Loading transactions...</div>
        </div>
      </Page>
    );
  }

  if (errorMessage) {
    return (
      <Page title="Transactions">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">Error loading transactions: {errorMessage}</p>
          <button
            onClick={dispatchFetchTransactions}
            className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Transactions">
      <TransactionsList
        transactions={transactions}
      />
    </Page>
  );
};

export default TransactionsPage;
