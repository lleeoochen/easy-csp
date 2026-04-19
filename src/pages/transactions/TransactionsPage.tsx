import { TransactionsList } from "./TransactionsList";
import { Page } from "../../components/Page";
import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import type { Transaction } from "@easy-csp/shared-types";
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedYear, selectedMonth, handleMonthSelect } = useMonthFilter();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const categoryFilter = searchParams.get('category');
  const fundFilter = searchParams.get('fund');

  const baseRequest = useMemo((): Omit<ListTransactionsRequest, 'startAfter'> => {
    const request: Omit<ListTransactionsRequest, 'startAfter'> = { limit: FETCH_LIMIT };

    if (categoryFilter) request.category = categoryFilter;

    const { startDate, endDate } = getMonthBoundaries(selectedYear, selectedMonth);
    request.startDate = startDate;
    request.endDate = endDate;

    return request;
  }, [categoryFilter, selectedYear, selectedMonth]);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useTransactions(baseRequest);

  const transactions = useMemo(() => {
    let filtered = data?.pages.flatMap(page => page.transactions ?? []) ?? [];

    // Apply fund filter
    if (fundFilter && fundFilter !== 'none') {
      filtered = filtered.filter(t => t.allocatedFundId === fundFilter);
    } else if (fundFilter === 'none') {
      // Show only transactions with no fund allocated
      filtered = filtered.filter(t => !t.allocatedFundId);
    }

    // Apply search text filter
    if (searchText.trim()) {
      const lower = searchText.toLowerCase();
      filtered = filtered.filter(t => t.name?.toLowerCase().includes(lower));
    }

    return filtered;
  }, [data, searchText, fundFilter]);

  const hasActiveFilters = !!(categoryFilter || (fundFilter && fundFilter !== 'none') || searchText);

  const handleTransactionClick = (transaction: Transaction) => {
    navigate(`/transactions/${transaction.id}/edit`);
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

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
          console.log("Intersection triggered, fetching more...");
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <Page title="Transactions" maxWidth="half">
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
                    navigate('/transactions/new/edit');
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
                  navigate('/transactions/new/edit');
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

            <div className="flex flex-col gap-1">
              <TransactionsList
                hasNextPage={hasNextPage}
                transactions={transactions}
                handleTransactionClick={handleTransactionClick}
              />

              {/* Intersection observer target */}
              {hasNextPage && (
                <div ref={loadMoreRef} className="py-4 text-center">
                  {isFetchingNextPage ? (
                    <div className="animate-pulse text-gray-500">Loading more transactions...</div>
                  ) : (
                    <div className="h-4" />
                  )}
                </div>
              )}
            </div>

            {isLoading && <div className="animate-pulse mt-4">Loading transactions...</div>}
          </div>
        </div>
      </div>
    </Page>
  );
};

export default TransactionsPage;
