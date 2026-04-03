import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { getCurrentMonthYear } from "../utils/dateUtils";

export const useMonthFilter = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();

  const monthFilter = searchParams.get('month');

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

  const handleMonthSelect = useCallback((year: number, month: number) => {
    const value = `${year}-${String(month + 1).padStart(2, '0')}`;
    const newParams = new URLSearchParams(searchParams);
    newParams.set('month', value);
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  return {
    selectedYear,
    selectedMonth,
    handleMonthSelect
  };
};
