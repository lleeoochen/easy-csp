import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RulesService } from './rulesService';
import { AccountService } from './accountService';
import {
  type Transaction,
  type RuleTransformation,
  RuleCondition,
  AccountType,
  type FinancialAccount
} from '@easy-csp/shared-types';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock AccountService
vi.mock('./accountService');

describe('RulesService - Fund Assignment Methods', () => {
  const mockUid = 'test-user-123';
  const mockFundAccountId = 'fund-456';
  const mockNonFundAccountId = 'account-789';

  const mockFundAccount: FinancialAccount = {
    id: mockFundAccountId,
    uid: mockUid,
    accountId: 'plaid-fund-123',
    accountName: 'Emergency Fund',
    accountType: AccountType.Savings,
    balance: 5000,
    isManual: false,
    isFundAccount: true,
  };

  const mockNonFundAccount: FinancialAccount = {
    id: mockNonFundAccountId,
    uid: mockUid,
    accountId: 'plaid-checking-456',
    accountName: 'Checking Account',
    accountType: AccountType.Checking,
    balance: 2000,
    isManual: false,
    isFundAccount: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateFundAssignmentRule', () => {
    it('should return valid for a valid fund account', async () => {
      vi.mocked(AccountService.listAccounts).mockResolvedValue([
        mockFundAccount,
        mockNonFundAccount,
      ]);

      const result = await RulesService.validateFundAssignmentRule(mockFundAccountId);

      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should return invalid when fund account does not exist', async () => {
      vi.mocked(AccountService.listAccounts).mockResolvedValue([
        mockNonFundAccount,
      ]);

      const result = await RulesService.validateFundAssignmentRule('non-existent-id');

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Fund account not found');
    });

    it('should return invalid when account is not a fund account', async () => {
      vi.mocked(AccountService.listAccounts).mockResolvedValue([
        mockFundAccount,
        mockNonFundAccount,
      ]);

      const result = await RulesService.validateFundAssignmentRule(mockNonFundAccountId);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Referenced account is not a fund account');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(AccountService.listAccounts).mockRejectedValue(new Error('Network error'));

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
  });
});
