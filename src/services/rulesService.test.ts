import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RulesService } from './rulesService';
import { TRAVEL_MODE_RULE_NAME } from '@/types/travelMode';
import { FundService } from './fundService';
import {
  type Transaction,
  type RuleTransformation,
  RuleCondition,
} from '@easy-csp/shared-types';
import type { UI_Fund } from '@/types/uiTypes';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock FundService
vi.mock('./fundService');

describe('RulesService - Fund Assignment Methods', () => {
  const mockUid = 'test-user-123';
  const mockFundAccountId = 'fund-456';

  const mockFund: UI_Fund = {
    id: mockFundAccountId,
    uid: mockUid,
    name: 'Emergency Fund',
    type: 'saving',
    accountId: 'plaid-fund-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateFundAssignmentRule', () => {
    it('should return valid for a valid fund', async () => {
      vi.mocked(FundService.listFunds).mockResolvedValue([mockFund]);

      const result = await RulesService.validateFundAssignmentRule(mockFundAccountId);

      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should return invalid when fund does not exist', async () => {
      vi.mocked(FundService.listFunds).mockResolvedValue([mockFund]);

      const result = await RulesService.validateFundAssignmentRule('non-existent-id');

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Fund not found');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(FundService.listFunds).mockRejectedValue(new Error('Network error'));

      const result = await RulesService.validateFundAssignmentRule(mockFundAccountId);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Error validating fund account');
    });
  });

  describe('applyRulesToTransaction', () => {
    const mockTransaction: Transaction = {
      id: 'txn-123',
      uid: mockUid,
      accountId: 'account-123',
      name: 'Grocery Store',
      amount: -85.50,
      datetime: Date.now(),
      plaidCategory: 'Food and Drink',
      category: 'groceries',
      hidden: false,
    };

    it('should apply fund assignment when rule matches', () => {
      const rules: RuleTransformation[] = [
        {
          name: 'Allocate groceries to food fund',
          enabled: true,
          matchingCriteria: {
            category: {
              value: 'groceries',
              condition: RuleCondition.Exact,
            },
          },
          action: {
            assignFund: mockFundAccountId,
          },
        },
      ];

      const result = RulesService.applyRulesToTransaction(mockTransaction, rules);

      expect(result.allocatedFundId).toBe(mockFundAccountId);
    });

    it('should apply category change when rule matches', () => {
      const rules: RuleTransformation[] = [
        {
          name: 'Change category',
          enabled: true,
          matchingCriteria: {
            name: {
              value: 'Grocery',
              condition: RuleCondition.Contains,
            },
          },
          action: {
            changeCategory: 'food',
          },
        },
      ];

      const result = RulesService.applyRulesToTransaction(mockTransaction, rules);

      expect(result.category).toBe('food');
    });

    it('should apply multiple actions when rule matches', () => {
      const rules: RuleTransformation[] = [
        {
          name: 'Multiple actions',
          enabled: true,
          matchingCriteria: {
            category: {
              value: 'groceries',
              condition: RuleCondition.Exact,
            },
          },
          action: {
            changeCategory: 'food',
            toggleHidden: true,
            assignFund: mockFundAccountId,
          },
        },
      ];

      const result = RulesService.applyRulesToTransaction(mockTransaction, rules);

      expect(result.category).toBe('food');
      expect(result.hidden).toBe(true);
      expect(result.allocatedFundId).toBe(mockFundAccountId);
    });

    it('should not apply disabled rules', () => {
      const rules: RuleTransformation[] = [
        {
          name: 'Disabled rule',
          enabled: false,
          matchingCriteria: {
            category: {
              value: 'groceries',
              condition: RuleCondition.Exact,
            },
          },
          action: {
            assignFund: mockFundAccountId,
          },
        },
      ];

      const result = RulesService.applyRulesToTransaction(mockTransaction, rules);

      expect(result.allocatedFundId).toBeUndefined();
    });

    it('should apply last matching rule when multiple rules match', () => {
      const rules: RuleTransformation[] = [
        {
          name: 'First rule',
          enabled: true,
          matchingCriteria: {
            category: {
              value: 'groceries',
              condition: RuleCondition.Exact,
            },
          },
          action: {
            assignFund: 'fund-1',
          },
        },
        {
          name: 'Second rule',
          enabled: true,
          matchingCriteria: {
            name: {
              value: 'Grocery',
              condition: RuleCondition.Contains,
            },
          },
          action: {
            assignFund: 'fund-2',
          },
        },
      ];

      const result = RulesService.applyRulesToTransaction(mockTransaction, rules);

      expect(result.allocatedFundId).toBe('fund-2');
    });

    it('should not modify transaction when no rules match', () => {
      const rules: RuleTransformation[] = [
        {
          name: 'Non-matching rule',
          enabled: true,
          matchingCriteria: {
            category: {
              value: 'dining',
              condition: RuleCondition.Exact,
            },
          },
          action: {
            assignFund: mockFundAccountId,
          },
        },
      ];

      const result = RulesService.applyRulesToTransaction(mockTransaction, rules);

      expect(result).toEqual(mockTransaction);
    });

    it('should handle amount criteria with exact match', () => {
      const rules: RuleTransformation[] = [
        {
          name: 'Amount exact match',
          enabled: true,
          matchingCriteria: {
            amount: {
              value: -85.50,
              condition: RuleCondition.Equal,
            },
          },
          action: {
            assignFund: mockFundAccountId,
          },
        },
      ];

      const result = RulesService.applyRulesToTransaction(mockTransaction, rules);

      expect(result.allocatedFundId).toBe(mockFundAccountId);
    });

    it('should handle amount criteria with less than', () => {
      const rules: RuleTransformation[] = [
        {
          name: 'Amount less than',
          enabled: true,
          matchingCriteria: {
            amount: {
              value: -50,
              condition: RuleCondition.LessThan,
            },
          },
          action: {
            assignFund: mockFundAccountId,
          },
        },
      ];

      const result = RulesService.applyRulesToTransaction(mockTransaction, rules);

      expect(result.allocatedFundId).toBe(mockFundAccountId);
    });

    it('should handle accountId criteria', () => {
      const rules: RuleTransformation[] = [
        {
          name: 'Account match',
          enabled: true,
          matchingCriteria: {
            accountId: {
              value: 'account-123',
              condition: RuleCondition.Exact,
            },
          },
          action: {
            assignFund: mockFundAccountId,
          },
        },
      ];

      const result = RulesService.applyRulesToTransaction(mockTransaction, rules);

      expect(result.allocatedFundId).toBe(mockFundAccountId);
    });

    it('should return original transaction on error', () => {
      const rules: any = [
        {
          name: 'Invalid rule',
          enabled: true,
          matchingCriteria: null, // This will cause an error
          action: {
            assignFund: mockFundAccountId,
          },
        },
      ];

      const result = RulesService.applyRulesToTransaction(mockTransaction, rules);

      expect(result).toEqual(mockTransaction);
    });

    it('should not apply rule when transaction.datetime is outside activeDateRange', () => {
      const txnTime = mockTransaction.datetime;
      const rules: RuleTransformation[] = [
        {
          name: 'Old travel rule',
          enabled: true,
          matchingCriteria: { category: { value: 'groceries', condition: RuleCondition.Exact } },
          action: { assignFund: mockFundAccountId },
          activeDateRange: { startDate: txnTime - 2000, endDate: txnTime - 1000 }, // range ended before txn
        },
      ];

      const result = RulesService.applyRulesToTransaction(mockTransaction, rules);

      expect(result.allocatedFundId).toBeUndefined();
    });

    it('should apply rule when transaction.datetime is within activeDateRange', () => {
      const txnTime = mockTransaction.datetime;
      const rules: RuleTransformation[] = [
        {
          name: 'Active travel rule',
          enabled: true,
          matchingCriteria: { category: { value: 'groceries', condition: RuleCondition.Exact } },
          action: { assignFund: mockFundAccountId },
          activeDateRange: { startDate: txnTime - 1000, endDate: txnTime + 1000 },
        },
      ];

      const result = RulesService.applyRulesToTransaction(mockTransaction, rules);

      expect(result.allocatedFundId).toBe(mockFundAccountId);
    });

    it('should not apply rule when transaction.datetime is before activeDateRange.startDate', () => {
      const txnTime = mockTransaction.datetime;
      const rules: RuleTransformation[] = [
        {
          name: 'Future travel rule',
          enabled: true,
          matchingCriteria: { category: { value: 'groceries', condition: RuleCondition.Exact } },
          action: { assignFund: mockFundAccountId },
          activeDateRange: { startDate: txnTime + 1000, endDate: txnTime + 2000 }, // range starts after txn
        },
      ];

      const result = RulesService.applyRulesToTransaction(mockTransaction, rules);

      expect(result.allocatedFundId).toBeUndefined();
    });

    it('should apply travel rule to late-posting transaction whose datetime falls within the trip range', () => {
      const tripStart = mockTransaction.datetime - 1000 * 60 * 60 * 24 * 3; // trip started 3 days ago
      const tripEnd = mockTransaction.datetime - 1000 * 60 * 60 * 24;       // trip ended 1 day ago
      const latePostingTxn = { ...mockTransaction, datetime: tripEnd - 1000 }; // txn occurred during trip
      const rules: RuleTransformation[] = [
        {
          name: TRAVEL_MODE_RULE_NAME,
          enabled: true,
          matchingCriteria: { category: { value: 'groceries', condition: RuleCondition.Exact } },
          action: { assignFund: mockFundAccountId },
          activeDateRange: { startDate: tripStart, endDate: tripEnd },
        },
      ];

      const result = RulesService.applyRulesToTransaction(latePostingTxn, rules);

      expect(result.allocatedFundId).toBe(mockFundAccountId);
    });

    it('should not apply travel mode rule when no activeDateRange is set', () => {
      const rules: RuleTransformation[] = [
        {
          name: TRAVEL_MODE_RULE_NAME,
          enabled: true,
          matchingCriteria: { category: { value: 'groceries', condition: RuleCondition.Exact } },
          action: { assignFund: mockFundAccountId },
          // no activeDateRange
        },
      ];

      const result = RulesService.applyRulesToTransaction(mockTransaction, rules);

      expect(result.allocatedFundId).toBeUndefined();
    });
  });
});
