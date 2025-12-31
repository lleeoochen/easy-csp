/**
 * Test file for financial utility functions
 */

import {
  formatCurrency,
  formatCurrencyCompact,
  formatCurrencyAbbreviated,
  parseCurrency,
  formatPercentage,
  roundToCents,
  formatCurrencyWithSign
} from './financialUtils';

// Quick test function to verify our utilities work correctly
function testFinancialUtils() {
  console.log('=== Testing Financial Utilities ===');

  // Test formatCurrency
  console.log('formatCurrency(1234.5678):', formatCurrency(1234.5678)); // Should be "$1,234.57"
  console.log('formatCurrency(1000):', formatCurrency(1000)); // Should be "$1,000.00"
  console.log('formatCurrency(0):', formatCurrency(0)); // Should be "$0.00"
  console.log('formatCurrency(-500.75):', formatCurrency(-500.75)); // Should be "-$500.75"

  // Test formatCurrencyCompact
  console.log('formatCurrencyCompact(1000):', formatCurrencyCompact(1000)); // Should be "$1,000"
  console.log('formatCurrencyCompact(1000.50):', formatCurrencyCompact(1000.50)); // Should be "$1,000.50"

  // Test formatCurrencyAbbreviated
  console.log('formatCurrencyAbbreviated(1500):', formatCurrencyAbbreviated(1500)); // Should be "$1.5K"
  console.log('formatCurrencyAbbreviated(2500000):', formatCurrencyAbbreviated(2500000)); // Should be "$2.5M"
  console.log('formatCurrencyAbbreviated(1200000000):', formatCurrencyAbbreviated(1200000000)); // Should be "$1.2B"

  // Test parseCurrency
  console.log('parseCurrency("$1,234.56"):', parseCurrency("$1,234.56")); // Should be 1234.56
  console.log('parseCurrency("$1,000"):', parseCurrency("$1,000")); // Should be 1000

  // Test formatPercentage
  console.log('formatPercentage(250, 1000):', formatPercentage(250, 1000)); // Should be "25.0%"
  console.log('formatPercentage(333, 1000):', formatPercentage(333, 1000)); // Should be "33.3%"

  // Test roundToCents
  console.log('roundToCents(1234.5678):', roundToCents(1234.5678)); // Should be 1234.57
  console.log('roundToCents(999.999):', roundToCents(999.999)); // Should be 1000

  // Test formatCurrencyWithSign
  console.log('formatCurrencyWithSign(1000):', formatCurrencyWithSign(1000));
  console.log('formatCurrencyWithSign(-500):', formatCurrencyWithSign(-500));
  console.log('formatCurrencyWithSign(250, { showPositiveSign: true }):', formatCurrencyWithSign(250, { showPositiveSign: true }));

  console.log('=== Tests Complete ===');
}

// Only run tests if this file is executed directly (for development)
if (typeof window === 'undefined') {
  testFinancialUtils();
}

export { testFinancialUtils };
