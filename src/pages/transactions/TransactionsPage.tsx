import { TransactionsList } from "./TransactionsList";
import { Page } from "../../components/Page";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Transaction } from "@easy-csp/shared-types";
import { TransactionEditDialog } from "./TransactionEditDialog";
import InfiniteScroll from "react-infinite-scroll-component";
import { useTransactions } from "../../hooks/api/useTransactions";
import type { ListTransactionsRequest } from "../../types/firestoreTypes";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, SlidersHorizontal, X } from "lucide-react";
import { CategorySelector } from "../../components/common/CategorySelector";
import { SavingTargetSelector } from "../../components/common/SavingTargetSelector";
import { MonthSelector } from "../../components/MonthSelector";
import { getCurrentMonthYear, getMonthBoundaries } from "../../utils/dateUtils";
import { Button } from "../../components/common/button";
import { Input } from "../../components/common/input";
import { Card } from "../../components/common/card";

const FETCH_LIMIT = 20;

const TransactionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const categoryFilter = searchParams.get('category');
  const savingTargetFilter = searchParams.get('fund');
  const monthFilter = searchParams.get('month');

  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();

  useEffect(() => {
    if (!monthFilter) {
      const value = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      setSearchParams(p => { p.set('month', value); return p; }, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const parsedMonth = useMemo(() => {
    if (!monthFilter) return null;
    const [y, m] = monthFilter.split('-').map(Number);
    return (y && m) ? { year: y, month: m - 1 } : null;
  }, [monthFilter]);

  const selectedYear = parsedMonth?.year ?? currentYear;
  const selectedMonth = parsedMonth?.month ?? currentMonth;

  const baseRequest = useMemo((): Omit<ListTransactionsRequest, 'startAfter'> => {
    const request: Omit<ListTransactionsRequest, 'startAfter'> = { limit: FETCH_LIMIT };

    if (categoryFilter) request.category = categoryFilter;
    if (savingTargetFilter && savingTargetFilter !== 'none') request.savingTargetId = savingTargetFilter;

    const { startDate, endDate } = getMonthBoundaries(selectedYear, selectedMonth);
    request.startDate = startDate;
    request.endDate = endDate;

    return request;
  }, [categoryFilter, savingTargetFilter, selectedYear, selectedMonth]);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isLoading
  } = useTransactions(baseRequest);

  const transactions = useMemo(() => {
    let all = data?.pages.flatMap(page => page.transactions ?? []) ?? [];

    // Filter out transactions with funds when fund=none is specified
    if (savingTargetFilter === 'none') {
      all = all.filter(t => !t.savingTargetId);
    }

    // Apply search text filter
    if (!searchText.trim()) return all;
    const lower = searchText.toLowerCase();
    return all.filter(t => t.name?.toLowerCase().includes(lower));
  }, [data, searchText, savingTargetFilter]);

  const hasActiveFilters = !!(categoryFilter || (savingTargetFilter && savingTargetFilter !== 'none') || searchText);

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

  const handleMonthSelect = useCallback((year: number, month: number) => {
    const value = `${year}-${String(month + 1).padStart(2, '0')}`;
    const newParams = new URLSearchParams(searchParams);
    newParams.set('month', value);
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

  const handleRefresh = useCallback(() => { refetch(); }, [refetch]);

  return (
    <Page title="Transactions">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 mb-2">
          <MonthSelector
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthSelect={handleMonthSelect}
          />

          {/* Filter toggle row */}
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2 w-fit">
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
                <div className="flex">
                  <Button variant="icon" onClick={handleReset} className="flex items-center gap-1 text-sm">
                    <X className="w-3 h-3" />
                    Reset
                  </Button>
                </div>
              )}
            </div>

            {/* Expandable filter panel */}
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
                    <SavingTargetSelector
                      value={savingTargetFilter ?? ''}
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
        </div>

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
