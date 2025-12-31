import React from 'react';
import { getRecentMonths, getCurrentMonthYear } from '../utils/dateUtils';

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
  const recentMonths = getRecentMonths(12);
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();

  return (
    <div className={`px-4 py-2 ${className}`}>
      <div className="flex flex-row-reverse overflow-x-auto space-x-2 scrollbar-hide">
        {recentMonths.map(({ year, month, displayName, key }) => {
          const isSelected = year === selectedYear && month === selectedMonth;
          const isCurrent = year === currentYear && month === currentMonth;

          return (
            <button
              key={key}
              onClick={() => onMonthSelect(year, month)}
              className={`
                shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${isSelected
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                ${isCurrent && !isSelected ? 'ring-2 ring-blue-300' : ''}
                whitespace-nowrap min-w-fit
              `}
            >
              {displayName}
            </button>
          );
        })}
      </div>

      {/* Scroll indicator for mobile */}
      <div className="flex justify-center mt-2">
        <div className="flex space-x-1">
          <div className="w-2 h-1 bg-gray-300 rounded-full opacity-60"></div>
          <div className="w-2 h-1 bg-gray-300 rounded-full opacity-60"></div>
          <div className="w-2 h-1 bg-gray-300 rounded-full opacity-60"></div>
        </div>
      </div>
    </div>
  );
};

export default MonthSelector;
