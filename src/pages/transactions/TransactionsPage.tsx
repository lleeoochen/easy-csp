import { TransactionsList } from "./TransactionsList";
import { Page } from "../../components/Page";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Transaction } from "@easy-csp/shared-types";
import { TransactionEditDialog } from "./TransactionEditDialog";
import InfiniteScroll from "react-infinite-scroll-component";
import { useTransactions } from "../../hooks/api/useTransactions";
import type { ListTransactionsRequest } from "../../types/firestoreTypes";
import { ChevronDown, ChevronUp, SlidersHorizontal, X, Plus } from "lucide-react";
import { CategorySelector } from "../../components/common/CategorySelector";
import { FundFilter } from "../../components/common/FundFilter";
import { MonthSelector } from "../../components/MonthSelector";
import { getMonthBoundaries } from "../../utils/dateUtils";
import { Button } from "../../components/common/button";
import { Input } from "../../components/common/input";
import { Card } from "../../components/common/card";
import { useMonthFilter } from "../../hooks/useMonthFilter";

const FETCH_LIMIT = 20;

const TransactionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedYear, selectedMonth, handleMonthSelect } = useMonthFilter();

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const categoryFilter = searchParams.get('category');
  const fundFilter = searchParams.get('fund');

  const baseRequest = useMemo((): Omit<ListTransactionsRequest, 'startAfter'> => {
    const request: Omit<ListTransactionsRequest, 'startAfter'> = { limit: FETCH_LIMIT };

    if (categoryFilter) request.category = categoryFilter;
    if (fundFilter && fundFilter !== 'none') request.fundId = fundFilter;

    const { startDate, endDate } = getMonthBoundaries(selectedYear, selectedMonth);
    request.startDate = startDate;
    request.endDate = endDate;

    return request;
  }, [categoryFilter, fundFilter, selectedYear, selectedMonth]);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useTransactions(baseRequest);

  const transactions = useMemo(() => {
    let all = data?.pages.flatMap(page => page.transactions ?? []) ?? [];

    // Filter out transactions with funds when fund=none is specified
    if (fundFilter === 'none') {
      all = all.filter(t => !t.fundId);
    }

    // Apply search text filter
    if (!searchText.trim()) return all;
    const lower = searchText.toLowerCase();
    return all.filter(t => t.name?.toLowerCase().includes(lower));
  }, [data, searchText, fundFilter]);

  const hasActiveFilters = !!(categoryFilter || (fundFilter && fundFilter !== 'none') || searchText);

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  const handleSetFilter = useCallback((filterType: 'category' | 'fund' | 'month', value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(filterType, value);
    else newParams.delete(filterType);
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const handleReset = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('category');
    newParams.delete('fund');
    setSearchParams(newParams);
    setSearchText('');
  }, [searchParams, setSearchParams]);

  const handleFetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <Page title="Transactions" maxWidth="half-xl">
      <div className="space-y-4">
        {/* Month Selector - Always at top */}
        <MonthSelector
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthSelect={handleMonthSelect}
        />

        {/* Desktop: Two-column layout, Mobile: Stacked */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left Column: Filters (Desktop) / Collapsible (Mobile) */}
          <div className="lg:w-80 lg:shrink-0">
            {/* Mobile: Filter toggle */}
            <div className="lg:hidden flex flex-col gap-2">
              <div className="flex justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="icon"
                    onClick={() => setFiltersOpen(o => !o)}
                    className="flex items-center gap-1.5"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                    {hasActiveFilters && (
                      <span className="bg-primary-bg text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                        •
                      </span>
                    )}
                    {filtersOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </Button>
                  {hasActiveFilters && (
                    <Button variant="icon" onClick={handleReset} className="flex items-center gap-1 text-sm">
                      <X className="w-3 h-3" />
                      Reset
                    </Button>
                  )}
                </div>
                <Button
                  variant="primary"
                  onClick={() => {
                    setSelectedTransaction(null);
                    setIsEditDialogOpen(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>

              {/* Expandable filter panel (mobile) */}
              {filtersOpen && (
                <Card className="flex flex-col gap-2 p-3 bg-card">
                  <Input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    className="w-full px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <div className="flex-1 min-w-0">
                      <CategorySelector
                        value={categoryFilter ?? ''}
                        onValueChange={(v) => handleSetFilter('category', v)}
                        placeholder="Filter by category"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <FundFilter
                        value={fundFilter ?? ''}
                        onValueChange={(v) => handleSetFilter('fund', v)}
                        placeholder="Filter by fund"
                        includeAllOption
                        includeNoneOption
                      />
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Desktop: Always visible filter panel */}
            <Card className="hidden lg:flex flex-col gap-3 p-4 bg-card sticky top-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Filters</h3>
                {hasActiveFilters && (
                  <Button variant="icon" onClick={handleReset} className="flex items-center gap-1 text-sm">
                    <X className="w-3 h-3" />
                    Reset
                  </Button>
                )}
              </div>
              <Input
                type="text"
                placeholder="Search transactions..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className="w-full px-3 py-2 text-sm"
              />
              <div className="flex flex-col gap-2">
                <CategorySelector
                  value={categoryFilter ?? ''}
                  onValueChange={(v) => handleSetFilter('category', v)}
                  placeholder="Filter by category"
                />
                <FundFilter
                  value={fundFilter ?? ''}
                  onValueChange={(v) => handleSetFilter('fund', v)}
                  placeholder="Filter by fund"
                  includeAllOption
                  includeNoneOption
                />
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  setSelectedTransaction(null);
                  setIsEditDialogOpen(true);
                }}
                className="flex items-center justify-center gap-2 w-full"
              >
                <Plus className="w-4 h-4" />
                Add Transaction
              </Button>
            </Card>
          </div>

          {/* Right Column: Transactions List */}
          <div className="flex-1 min-w-0">
            {error && <p className="text-red-600 mb-4">Error loading transactions: {error.message}</p>}

            <InfiniteScroll
              className="flex flex-col gap-1"
              dataLength={transactions.length}
              next={handleFetchMore}
              hasMore={!!hasNextPage}
              loader=""
            >
              <TransactionsList
                hasNextPage={hasNextPage}
                transactions={transactions}
                handleTransactionClick={handleTransactionClick}
              />
            </InfiniteScroll>

            {isLoading && <div className="animate-pulse mt-4">Loading transactions...</div>}
          </div>
        </div>

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
