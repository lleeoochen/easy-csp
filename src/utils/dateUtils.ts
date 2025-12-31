/**
 * Date utility functions for timezone handling and month operations
 */

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
  // Create dates in local timezone
  const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return {
    startDate: startOfMonth.getTime(), // UTC epoch timestamp
    endDate: endOfMonth.getTime()      // UTC epoch timestamp
  };
}

/**
 * Converts a UTC epoch timestamp to a local Date object
 * @param timestamp UTC epoch timestamp in milliseconds
 * @returns Date object in local timezone
 */
export function fromUTCEpoch(timestamp: number): Date {
  return new Date(timestamp);
}

/**
 * Converts a local Date object to UTC epoch timestamp
 * @param localDate Date object in local timezone
 * @returns UTC epoch timestamp in milliseconds
 */
export function toUTCEpoch(localDate: Date): number {
  return localDate.getTime();
}

/**
 * Gets the current month and year in local timezone
 * @returns Object containing current month (0-11) and year
 */
export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return {
    month: now.getMonth(),
    year: now.getFullYear()
  };
}

/**
 * Gets an array of the last N months including the current month
 * @param monthsCount Number of months to include (default: 12)
 * @returns Array of month objects with year, month, and display name
 */
export function getRecentMonths(monthsCount: number = 12): Array<{
  year: number;
  month: number;
  displayName: string;
  key: string;
}> {
  const months = [];
  const now = new Date();

  for (let i = 0; i < monthsCount; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth();

    months.push({
      year,
      month,
      displayName: date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      }),
      key: `${year}-${month.toString().padStart(2, '0')}`
    });
  }

  return months;
}

/**
 * Formats a month and year for display
 * @param year The year
 * @param month The month (0-11)
 * @returns Formatted string like "Jan 2024"
 */
export function formatMonth(year: number, month: number): string {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  });
}
