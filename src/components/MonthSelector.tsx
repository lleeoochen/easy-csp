import React, { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthRange, getCurrentMonthYear } from '../utils/dateUtils';
import { Button } from './common/button';

interface MonthSelectorProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthSelect: (year: number, month: number) => void;
  className?: string;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  selectedMonth,
  selectedYear,
  onMonthSelect,
  className = ""
}) => {
  const months = getMonthRange(12, 12);
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const btnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const isCurrentMonth = selectedYear === currentYear && selectedMonth === currentMonth;
  const isPast = selectedYear < currentYear || (selectedYear === currentYear && selectedMonth < currentMonth);
  const isFutureSelected = !isCurrentMonth && !isPast;

  const scrollToKey = (key: string, behavior: ScrollBehavior = 'smooth') => {
    const btn = btnRefs.current.get(key);
    if (btn) btn.scrollIntoView({ behavior, inline: 'center', block: 'nearest' });
  };

  const goToCurrentMonth = () => {
    const key = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    onMonthSelect(currentYear, currentMonth);
    scrollToKey(key);
  };

  useEffect(() => {
    const key = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    scrollToKey(key, 'instant');
  }, [currentMonth, currentYear]);

  useEffect(() => {
    const key = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
    scrollToKey(key);
  }, [selectedMonth, selectedYear]);

  return (
    <div className={`relative ${className}`}>
      {/* Left arrow — selected is in the future (future is on the left due to flex-row-reverse) */}
      {isFutureSelected && (
        <Button
          variant="icon"
          onClick={goToCurrentMonth}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full hover:shadow-2xl transition-all shadow-2xl p-0! bg-gray-600! text-white!"
          aria-label="Go to current month"
        >
          <ChevronLeft size={18} />
        </Button>
      )}

      {/* Right arrow — selected is in the past (past is on the right due to flex-row-reverse) */}
      {isPast && (
        <Button
          variant="icon"
          onClick={goToCurrentMonth}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full hover:shadow-2xl transition-all shadow-2xl p-0! bg-gray-600! text-white!"
          aria-label="Go to current month"
        >
          <ChevronRight size={18} />
        </Button>
      )}

      <div className="flex flex-row-reverse gap-2 overflow-x-auto py-1.5 scrollbar-hide rounded-full snap-x snap-mandatory">
        {months.map(({ year, month, displayName, key }) => {
          const isSelected = year === selectedYear && month === selectedMonth;

          return (
            <button
              key={key}
              ref={(el) => { if (el) btnRefs.current.set(key, el); else btnRefs.current.delete(key); }}
              onClick={() => onMonthSelect(year, month)}
              className={`
                shrink-0 snap-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${isSelected
                  ? 'bg-gray-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                whitespace-nowrap min-w-fit
              `}
            >
              {displayName}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MonthSelector;
