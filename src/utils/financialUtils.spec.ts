import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatCurrencyAbbreviated,
  parseCurrency,
  formatPercentage,
  roundToCents,
  formatCurrencyWithSign,
  getTransactionSignPrefix,
} from './financialUtils';

describe('financialUtils', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers correctly', () => {
      expect(formatCurrency(1234.5678, 2, true)).toBe('$1,234.57');
      expect(formatCurrency(1000, 2, true)).toBe('$1,000.00');
    });

    it('should format zero correctly', () => {
      expect(formatCurrency(0, 2, true)).toBe('$0.00');
    });

    it('should format negative numbers as positive', () => {
      expect(formatCurrency(-500.75, 2, true)).toBe('$500.75');
    });

    it('should handle null and undefined', () => {
      expect(formatCurrency(null as any, 2, true)).toBe('$0.00');
      expect(formatCurrency(undefined as any, 2, true)).toBe('$0.00');
    });

    it('should handle NaN', () => {
      expect(formatCurrency(NaN, 2, true)).toBe('$0.00');
    });

    it('should respect decimal places', () => {
      expect(formatCurrency(1234.5678, 0, false)).toBe('$1,235');
      expect(formatCurrency(1234.5678, 1, true)).toBe('$1,234.6');
    });
  });

  describe('formatCurrencyCompact', () => {
    it('should format whole numbers without cents', () => {
      expect(formatCurrencyCompact(1000)).toBe('$1,000');
    });

    it('should format decimal numbers with cents', () => {
      expect(formatCurrencyCompact(1000.50)).toBe('$1,000.50');
    });

    it('should handle null and undefined', () => {
      expect(formatCurrencyCompact(null as any)).toBe('$0');
      expect(formatCurrencyCompact(undefined as any)).toBe('$0');
    });
  });

  describe('formatCurrencyAbbreviated', () => {
    it('should abbreviate thousands', () => {
      expect(formatCurrencyAbbreviated(1500)).toBe('$1.5K');
    });

    it('should abbreviate millions', () => {
      expect(formatCurrencyAbbreviated(2500000)).toBe('$2.5M');
    });

    it('should abbreviate billions', () => {
      expect(formatCurrencyAbbreviated(1200000000)).toBe('$1.2B');
    });

    it('should format small numbers normally', () => {
      expect(formatCurrencyAbbreviated(500)).toBe('$500');
    });

    it('should handle negative numbers', () => {
      expect(formatCurrencyAbbreviated(-1500)).toBe('-$1.5K');
    });

    it('should handle null and undefined', () => {
      expect(formatCurrencyAbbreviated(null as any)).toBe('$0');
    });
  });

  describe('parseCurrency', () => {
    it('should parse currency strings correctly', () => {
      expect(parseCurrency('$1,234.56')).toBe(1234.56);
      expect(parseCurrency('$1,000')).toBe(1000);
    });

    it('should handle strings without currency symbols', () => {
      expect(parseCurrency('1234.56')).toBe(1234.56);
    });

    it('should handle invalid strings', () => {
      expect(parseCurrency('')).toBe(0);
      expect(parseCurrency('abc')).toBe(0);
      expect(parseCurrency(null as any)).toBe(0);
    });
  });

  describe('formatPercentage', () => {
    it('should calculate and format percentages correctly', () => {
      expect(formatPercentage(250, 1000)).toBe('25.0%');
      expect(formatPercentage(333, 1000)).toBe('33.3%');
    });

    it('should handle zero total', () => {
      expect(formatPercentage(100, 0)).toBe('0%');
    });

    it('should handle NaN values', () => {
      expect(formatPercentage(NaN, 1000)).toBe('0%');
      expect(formatPercentage(100, NaN)).toBe('0%');
    });

    it('should respect decimal places', () => {
      expect(formatPercentage(333, 1000, 2)).toBe('33.30%');
    });
  });

  describe('roundToCents', () => {
    it('should round to 2 decimal places', () => {
      expect(roundToCents(1234.5678)).toBe(1234.57);
      expect(roundToCents(999.999)).toBe(1000);
    });

    it('should handle NaN', () => {
      expect(roundToCents(NaN)).toBe(0);
    });
  });

  describe('formatCurrencyWithSign', () => {
    it('should format positive amounts', () => {
      const result = formatCurrencyWithSign(1000);
      expect(result.formatted).toBe('$1,000');
      expect(result.isPositive).toBe(true);
      expect(result.isNegative).toBe(false);
    });

    it('should format negative amounts', () => {
      const result = formatCurrencyWithSign(-500);
      expect(result.formatted).toBe('-$500');
      expect(result.isNegative).toBe(true);
      expect(result.isPositive).toBe(false);
    });

    it('should show positive sign when requested', () => {
      const result = formatCurrencyWithSign(250, { showPositiveSign: true });
      expect(result.formatted).toBe('+$250');
    });

    it('should apply correct CSS classes', () => {
      const negative = formatCurrencyWithSign(-100);
      expect(negative.className).toBe('text-red-600');

      const positive = formatCurrencyWithSign(100);
      expect(positive.className).toBe('text-green-600');
    });
  });

  describe('getTransactionSignPrefix', () => {
    it('should return "+" for negative amounts (income)', () => {
      expect(getTransactionSignPrefix(-100)).toBe('+');
    });

    it('should return "" for positive amounts (expenses)', () => {
      expect(getTransactionSignPrefix(100)).toBe('');
    });

    it('should return "" for zero', () => {
      expect(getTransactionSignPrefix(0)).toBe('');
    });
  });
});
