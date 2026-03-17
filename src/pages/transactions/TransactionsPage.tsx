import { TransactionsList } from "./TransactionsList";
import { Page } from "../../components/Page";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import type { Transaction } from "@easy-csp/shared-types";
import { TransactionEditDialog } from "./TransactionEditDialog";
import InfiniteScroll from "react-infinite-scroll-component";
import { useTransactions } from "../../hooks/api/useTransactions";
import type { ListTransactionsRequest } from "../../types/firestoreTypes";
import { ArrowDown, ArrowUp } from "lucide-react";
import { FilterBadge } from "../../components/common/FilterBadge";
import { camelCaseToSentence } from "../../utils/stringUtils";

const FETCH_LIMIT = 20;

const TransactionsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Read filters from URL parameters
  const categoryFilter = searchParams.get('category');
  const monthFilter = searchParams.get('month');

  // Build filter request object
  const baseRequest = useMemo((): Omit<ListTransactionsRequest, 'startAfter'> => {
    const request: Omit<ListTransactionsRequest, 'startAfter'> = { limit: FETCH_LIMIT };

    if (categoryFilter) {
      request.category = categoryFilter;
    }

    if (monthFilter) {
      const [year, month] = monthFilter.split('-').map(Number);
      if (year && month) {
        // Calculate start and end dates for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        request.startDate = startDate.getTime();
        request.endDate = endDate.getTime();
      }
    }

    return request;
  }, [categoryFilter, monthFilter]);

  // Use React Query for transactions
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isLoading
  } = useTransactions(baseRequest);

  // Flatten the paginated data into a single array
  const transactions = useMemo(() => {
    return data?.pages.flatMap(page => page.transactions ?? []) ?? [];
  }, [data]);

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  const handleRemoveFilter = useCallback((filterType: 'category' | 'month') => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(filterType);
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const handleRemoveAllFilters = useCallback(() => {
    navigate('/transactions');
  }, [navigate]);

  const handleFetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Format month for display
  const formatMonthDisplay = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const hasFilters = categoryFilter || monthFilter;

  return (
    <Page title="Transactions">
      <div className="space-y-4">
        {/* Filter badges */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 items-center">
            {categoryFilter && (
              <FilterBadge
                label={camelCaseToSentence(categoryFilter)}
                onRemove={() => handleRemoveFilter('category')}
                variant="category"
              />
            )}
            {monthFilter && (
              <FilterBadge
                label={formatMonthDisplay(monthFilter)}
                onRemove={() => handleRemoveFilter('month')}
                variant="month"
              />
            )}
            {(categoryFilter && monthFilter) && (
              <button
                onClick={handleRemoveAllFilters}
                className="text-sm underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {error ? <p className="text-red-600">Error loading transactions: {error.message}</p> : ""}

        <InfiniteScroll
          className="flex flex-col gap-1"
          dataLength={transactions.length}
          next={handleFetchMore}
          hasMore={!!hasNextPage}
          loader=""
          refreshFunction={handleRefresh}
          pullDownToRefresh
          pullDownToRefreshThreshold={50}
          pullDownToRefreshContent={
            <div className="flex items-center gap-3 justify-center">
              <ArrowDown className="w-3 h-3" />
              <div>Pull down to refresh</div>
            </div>
          }
          releaseToRefreshContent={
            <div className="flex items-center gap-3 justify-center">
              <ArrowUp className="w-3 h-3" />
              <div>Release to refresh</div>
            </div>
          }
        >
          <TransactionsList
            transactions={transactions}
            handleTransactionClick={handleTransactionClick}/>
        </InfiniteScroll>

        {isLoading ? <div className="animate-pulse">Loading transactions...</div> : ""}

        <TransactionEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          transaction={selectedTransaction}
        />
      </div>
    </Page>
  );
};

export default TransactionsPage;
