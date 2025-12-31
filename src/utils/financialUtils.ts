/**
 * Financial utility functions for currency formatting and calculations
 */

/**
 * Formats a number as currency with dollar sign and proper rounding
 * @param amount The numeric amount to format
 * @param decimals Number of decimal places to show (default: 2)
 * @param showCents Whether to show cents even when amount is whole number (default: true)
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(
  amount: number,
  decimals: number = 0,
  showCents: boolean = false
): string {
  // Handle null, undefined, or NaN values
  if (amount == null || isNaN(amount)) {
    return '$0.00';
  }

  // Round to specified decimal places
  const roundedAmount = Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);

  // Format with commas and dollar sign
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? decimals : 0,
    maximumFractionDigits: decimals,
  });

  return formatter.format(roundedAmount);
}

/**
 * Formats a number as currency without cents for whole numbers
 * @param amount The numeric amount to format
 * @returns Formatted currency string (e.g., "$1,234" or "$1,234.50")
 */
export function formatCurrencyCompact(amount: number): string {
  if (amount == null || isNaN(amount)) {
    return '$0';
  }

  // Check if the number is a whole number
  const isWholeNumber = amount % 1 === 0;

  return formatCurrency(amount, 2, !isWholeNumber);
}

/**
 * Formats a number as currency with abbreviated large numbers
 * @param amount The numeric amount to format
 * @param decimals Number of decimal places for abbreviated amounts (default: 1)
 * @returns Formatted currency string (e.g., "$1.2K", "$1.5M", "$2.3B")
 */
export function formatCurrencyAbbreviated(
  amount: number,
  decimals: number = 1
): string {
  if (amount == null || isNaN(amount)) {
    return '$0';
  }

  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absAmount >= 1e9) {
    return `${sign}$${(absAmount / 1e9).toFixed(decimals)}B`;
  } else if (absAmount >= 1e6) {
    return `${sign}$${(absAmount / 1e6).toFixed(decimals)}M`;
  } else if (absAmount >= 1e3) {
    return `${sign}$${(absAmount / 1e3).toFixed(decimals)}K`;
  } else {
    return formatCurrency(amount);
  }
}

/**
 * Parses a currency string and returns the numeric value
 * @param currencyString The currency string to parse (e.g., "$1,234.56")
 * @returns The numeric value, or 0 if parsing fails
 */
export function parseCurrency(currencyString: string): number {
  if (!currencyString || typeof currencyString !== 'string') {
    return 0;
  }

  // Remove currency symbols, commas, and spaces
  const cleanedString = currencyString
    .replace(/[$,\s]/g, '')
    .trim();

  const parsed = parseFloat(cleanedString);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculates percentage and formats it with proper rounding
 * @param value The current value
 * @param total The total value to calculate percentage against
 * @param decimals Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "25.5%")
 */
export function formatPercentage(
  value: number,
  total: number,
  decimals: number = 1
): string {
  if (total === 0 || isNaN(value) || isNaN(total)) {
    return '0%';
  }

  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Rounds a financial amount to the nearest cent
 * @param amount The amount to round
 * @returns Rounded amount to 2 decimal places
 */
export function roundToCents(amount: number): number {
  if (isNaN(amount)) {
    return 0;
  }
  return Math.round(amount * 100) / 100;
}

/**
 * Formats a financial amount with proper sign handling
 * @param amount The amount to format
 * @param options Formatting options
 * @returns Formatted currency with appropriate positive/negative styling
 */
export function formatCurrencyWithSign(
  amount: number,
  options: {
    showPositiveSign?: boolean;
    negativeClass?: string;
    positiveClass?: string;
  } = {}
): {
  formatted: string;
  isNegative: boolean;
  isPositive: boolean;
  className?: string;
} {
  const {
    showPositiveSign = false,
    negativeClass = 'text-red-600',
    positiveClass = 'text-green-600'
  } = options;

  const isNegative = amount < 0;
  const isPositive = amount > 0;

  let formatted = formatCurrency(Math.abs(amount));

  if (isNegative) {
    formatted = `-${formatted}`;
  } else if (isPositive && showPositiveSign) {
    formatted = `+${formatted}`;
  }

  return {
    formatted,
    isNegative,
    isPositive,
    className: isNegative ? negativeClass : isPositive ? positiveClass : undefined
  };
}
