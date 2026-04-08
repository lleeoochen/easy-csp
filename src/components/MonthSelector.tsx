import React, { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthRange, getCurrentMonthYear } from '../utils/dateUtils';
import { Button } from './common/button';
import { cn } from './common/utils';

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
          variant="primary"
          onClick={goToCurrentMonth}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center size-10 px-2 rounded-full hover:shadow-2xl transition-all shadow-2xl"
          aria-label="Go to current month"
        >
          <ChevronLeft size={18} />
        </Button>
      )}

      {/* Right arrow — selected is in the past (past is on the right due to flex-row-reverse) */}
      {isPast && (
        <Button
          variant="primary"
          onClick={goToCurrentMonth}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center size-10 px-2 rounded-full hover:shadow-2xl transition-all shadow-2xl"
          aria-label="Go to current month"
        >
          <ChevronRight size={18} />
        </Button>
      )}

      <div className="flex flex-row-reverse gap-2 overflow-x-auto py-1.5 scrollbar-hide rounded-2xl snap-x snap-mandatory">
        {months.map(({ year, month, displayName, key }) => {
          const isSelected = year === selectedYear && month === selectedMonth;
          const isCurrent = year === currentYear && month === currentMonth;

          return (
            <Button
              key={key}
              ref={(el) => { if (el) btnRefs.current.set(key, el); else btnRefs.current.delete(key); }}
              onClick={() => onMonthSelect(year, month)}
              className={cn(
                'shrink-0 snap-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap min-w-fit',
                'bg-gray-100 text-gray-700 hover:bg-gray-200',
                {
                  'bg-primary-bg text-white shadow-md': isSelected,
                  'ring-white ring-2': isCurrent && isSelected,
                  'ring-primary-bg ring-2': isCurrent && !isSelected,
                }
              )}
            >
              {displayName}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default MonthSelector;
