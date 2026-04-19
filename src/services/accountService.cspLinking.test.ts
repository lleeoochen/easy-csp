import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AccountService } from './accountService';
import { CSPBucket, AccountType } from '@easy-csp/shared-types';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('AccountService - CSP Category Linking', () => {
  const mockUid = 'test-user-123';
  const mockAccountId = 'account-123';

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock auth
    vi.mocked(getAuth).mockReturnValue({
      currentUser: { uid: mockUid }
    } as any);

    // Mock firestore
    vi.mocked(getFirestore).mockReturnValue({} as any);
  });

  describe('handleCSPCategoryLinking - Savings bucket', () => {
    it('should auto-enable fund status when linking asset account to Savings category', async () => {
      // Arrange
      const mockAccount = {
        id: mockAccountId,
        uid: mockUid,
        accountType: AccountType.Checking,
        isFundAccount: false,
        accountName: 'Chase Checking',
        balance: 1000,
        isManual: false,
        accountId: 'plaid-account-123'
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockAccount
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      // Act
      const result = await AccountService.handleCSPCategoryLinking(
        mockAccountId,
        CSPBucket.Savings
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Fund account status enabled');
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ isFundAccount: true })
      );
    });

    it('should return success without changes when account is already a fund account', async () => {
      // Arrange
      const mockAccount = {
        id: mockAccountId,
        uid: mockUid,
        accountType: AccountType.Savings,
        isFundAccount: true, // Already enabled
        accountName: 'Savings Account',
        balance: 5000,
        isManual: false,
        accountId: 'plaid-account-456'
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockAccount
      } as any);

      // Act
      const result = await AccountService.handleCSPCategoryLinking(
        mockAccountId,
        CSPBucket.Savings
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Account is already a fund account');
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('should throw error when linking liability account to Savings category', async () => {
      // Arrange
      const mockAccount = {
        id: mockAccountId,
        uid: mockUid,
        accountType: AccountType.Credit, // Liability account
        isFundAccount: false,
        accountName: 'Credit Card',
        balance: -500,
        isManual: false,
        accountId: 'plaid-account-789'
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockAccount
      } as any);

      // Act & Assert
      await expect(
        AccountService.handleCSPCategoryLinking(mockAccountId, CSPBucket.Savings)
      ).rejects.toThrow('Only asset accounts can be linked to savings/investment categories');
      expect(updateDoc).not.toHaveBeenCalled();
    });
  });

  describe('handleCSPCategoryLinking - Investment bucket', () => {
    it('should auto-enable fund status when linking asset account to Investment category', async () => {
      // Arrange
      const mockAccount = {
        id: mockAccountId,
        uid: mockUid,
        accountType: AccountType.Investment,
        isFundAccount: false,
        accountName: 'Vanguard 401k',
        balance: 50000,
        isManual: false,
        accountId: 'plaid-account-investment'
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockAccount
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      // Act
      const result = await AccountService.handleCSPCategoryLinking(
        mockAccountId,
        CSPBucket.Investment
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Fund account status enabled');
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should throw error when linking loan account to Investment category', async () => {
      // Arrange
      const mockAccount = {
        id: mockAccountId,
        uid: mockUid,
        accountType: AccountType.Loan, // Liability account
        isFundAccount: false,
        accountName: 'Student Loan',
        balance: -25000,
        isManual: true,
        accountId: 'manual-loan-123'
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockAccount
      } as any);

      // Act & Assert
      await expect(
        AccountService.handleCSPCategoryLinking(mockAccountId, CSPBucket.Investment)
      ).rejects.toThrow('Only asset accounts can be linked to savings/investment categories');
      expect(updateDoc).not.toHaveBeenCalled();
    });
  });

  describe('handleCSPCategoryLinking - Other buckets', () => {
    it('should NOT auto-enable fund status when linking to Income bucket', async () => {
      // Arrange
      const mockAccount = {
        id: mockAccountId,
        uid: mockUid,
        accountType: AccountType.Checking,
        isFundAccount: false,
        accountName: 'Checking Account',
        balance: 2000,
        isManual: false,
        accountId: 'plaid-account-income'
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockAccount
      } as any);

      // Act
      const result = await AccountService.handleCSPCategoryLinking(
        mockAccountId,
        CSPBucket.Income
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('No fund status change needed for this bucket');
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('should NOT auto-enable fund status when linking to FixedCost bucket', async () => {
      // Arrange
      const mockAccount = {
        id: mockAccountId,
        uid: mockUid,
        accountType: AccountType.Checking,
        isFundAccount: false,
        accountName: 'Checking Account',
        balance: 2000,
        isManual: false,
        accountId: 'plaid-account-fixed'
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockAccount
      } as any);

      // Act
      const result = await AccountService.handleCSPCategoryLinking(
        mockAccountId,
        CSPBucket.FixedCost
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('No fund status change needed for this bucket');
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('should NOT auto-enable fund status when linking to GuildFreeSpending bucket', async () => {
      // Arrange
      const mockAccount = {
        id: mockAccountId,
        uid: mockUid,
        accountType: AccountType.Checking,
        isFundAccount: false,
        accountName: 'Checking Account',
        balance: 2000,
        isManual: false,
        accountId: 'plaid-account-spending'
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockAccount
      } as any);

      // Act
      const result = await AccountService.handleCSPCategoryLinking(
        mockAccountId,
        CSPBucket.GuildFreeSpending
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('No fund status change needed for this bucket');
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('should NOT auto-enable fund status when linking to Ignored bucket', async () => {
      // Arrange
      const mockAccount = {
        id: mockAccountId,
        uid: mockUid,
        accountType: AccountType.Other,
        isFundAccount: false,
        accountName: 'Other Account',
        balance: 500,
        isManual: true,
        accountId: 'manual-other-123'
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockAccount
      } as any);

      // Act
      const result = await AccountService.handleCSPCategoryLinking(
        mockAccountId,
        CSPBucket.Ignored
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('No fund status change needed for this bucket');
      expect(updateDoc).not.toHaveBeenCalled();
    });
  });

  describe('handleCSPCategoryLinking - Edge cases', () => {
    it('should throw error when account does not exist', async () => {
      // Arrange
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false
      } as any);

      // Act & Assert
      await expect(
        AccountService.handleCSPCategoryLinking(mockAccountId, CSPBucket.Savings)
      ).rejects.toThrow(`Account with ID ${mockAccountId} does not exist`);
    });

    it('should throw error when account belongs to different user', async () => {
      // Arrange
      const mockAccount = {
        id: mockAccountId,
        uid: 'different-user-456', // Different user
        accountType: AccountType.Savings,
        isFundAccount: false,
        accountName: 'Savings Account',
        balance: 5000,
        isManual: false,
        accountId: 'plaid-account-123'
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockAccount
      } as any);

      // Act & Assert
      await expect(
        AccountService.handleCSPCategoryLinking(mockAccountId, CSPBucket.Savings)
      ).rejects.toThrow('Unauthorized: Account does not belong to the authenticated user');
    });

    it('should handle all asset account types for Savings bucket', async () => {
      const assetTypes = [
        AccountType.Checking,
        AccountType.Savings,
        AccountType.Investment,
        AccountType.Other
      ];

      for (const accountType of assetTypes) {
        vi.clearAllMocks();

        const mockAccount = {
          id: mockAccountId,
          uid: mockUid,
          accountType,
          isFundAccount: false,
          accountName: `${accountType} Account`,
          balance: 1000,
          isManual: false,
          accountId: `plaid-${accountType}`
        };

        vi.mocked(doc).mockReturnValue({} as any);
        vi.mocked(getDoc).mockResolvedValue({
          exists: () => true,
          data: () => mockAccount
        } as any);
        vi.mocked(updateDoc).mockResolvedValue(undefined);

        const result = await AccountService.handleCSPCategoryLinking(
          mockAccountId,
          CSPBucket.Savings
        );

        expect(result.success).toBe(true);
        expect(result.message).toBe('Fund account status enabled');
        expect(updateDoc).toHaveBeenCalled();
      }
    });
  });
});
