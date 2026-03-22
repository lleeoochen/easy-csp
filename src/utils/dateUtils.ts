/**
 * Date utility functions for timezone handling and month operations
 */

export type MonthOption = {
  year: number;
  month: number;
  displayName: string;
  key: string;
};

/**
 * Gets the start and end of a month in the user's local timezone
 * @param year The year (e.g., 2024)
 * @param month The month (0-11, where 0 is January)
 * @returns Object containing start and end dates as UTC epoch timestamps
 */
export function getMonthBoundaries(year: number, month: number): {
  startDate: number;
  endDate: number;
} {
  const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return {
    startDate: startOfMonth.getTime(),
    endDate: endOfMonth.getTime()
  };
}

export function fromUTCEpoch(timestamp: number): Date {
  return new Date(timestamp);
}

export function toUTCEpoch(localDate: Date): number {
  return localDate.getTime();
}

export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return {
    month: now.getMonth(),
    year: now.getFullYear()
  };
}

export function getRecentMonths(monthsCount: number = 12): MonthOption[] {
  const months: MonthOption[] = [];
  const now = new Date();

  for (let i = 0; i < monthsCount; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth();

    months.push({
      year,
      month,
      displayName: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      key: `${year}-${month.toString().padStart(2, '0')}`
    });
  }

  return months;
}

/**
 * Gets an array of months spanning pastCount past months, current month, and futureCount future months.
 * Ordered chronologically (oldest first).
 */
export function getMonthRange(pastCount: number = 12, futureCount: number = 12): MonthOption[] {
  const months: MonthOption[] = [];
  const now = new Date();

  for (let i = -futureCount; i <= pastCount; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth();

    months.push({
      year,
      month,
      displayName: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      key: `${year}-${month.toString().padStart(2, '0')}`
    });
  }

  return months;
}

export function formatMonth(year: number, month: number): string {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
