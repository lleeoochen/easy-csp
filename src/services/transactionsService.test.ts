import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransactionsService } from './transactionsService';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock Firebase modules
vi.mock('firebase/firestore');
vi.mock('firebase/auth');

describe('TransactionsService - Fund Allocation Methods', () => {
  const mockUid = 'test-user-123';
  const mockTransactionId = 'txn-123';
  const mockFundAccountId = 'fund-456';

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock getAuth
    vi.mocked(getAuth).mockReturnValue({
      currentUser: { uid: mockUid },
    } as any);

    // Mock getFirestore
    vi.mocked(getFirestore).mockReturnValue({} as any);
  });

  describe('updateTransactionFundAllocation', () => {
    it('should successfully allocate a transaction to a valid fund account', async () => {
      // Mock fund account exists and is valid
      const mockFundAccountData = {
        uid: mockUid,
        isFundAccount: true,
        accountName: 'Emergency Fund',
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockFundAccountData,
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await TransactionsService.updateTransactionFundAllocation(
        mockTransactionId,
        mockFundAccountId
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Transaction allocated to fund');
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should successfully clear fund allocation when allocatedFundId is null', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await TransactionsService.updateTransactionFundAllocation(
        mockTransactionId,
        null
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Fund allocation cleared');
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should fail when fund account does not exist', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await TransactionsService.updateTransactionFundAllocation(
        mockTransactionId,
        mockFundAccountId
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Fund account not found');
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('should fail when fund account does not belong to user', async () => {
      const mockFundAccountData = {
        uid: 'different-user-456',
        isFundAccount: true,
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockFundAccountData,
      } as any);

      const result = await TransactionsService.updateTransactionFundAllocation(
        mockTransactionId,
        mockFundAccountId
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Fund account does not belong to user');
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('should fail when account is not a fund account', async () => {
      const mockFundAccountData = {
        uid: mockUid,
        isFundAccount: false,
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockFundAccountData,
      } as any);

      const result = await TransactionsService.updateTransactionFundAllocation(
        mockTransactionId,
        mockFundAccountId
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Referenced account is not a fund account');
      expect(updateDoc).not.toHaveBeenCalled();
    });
  });

  describe('getTransactionsByFund', () => {
    it('should return transactions allocated to a specific fund', async () => {
      const mockTransactions = [
        { id: 'txn-1', amount: -50, datetime: 1704067200000, allocatedFundId: mockFundAccountId },
        { id: 'txn-2', amount: -30, datetime: 1704153600000, allocatedFundId: mockFundAccountId },
      ];

      const mockDocs = mockTransactions.map((txn) => ({
        id: txn.id,
        data: () => txn,
      }));

      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(orderBy).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockDocs,
      } as any);

      const result = await TransactionsService.getTransactionsByFund(mockFundAccountId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('txn-1');
      expect(result[1].id).toBe('txn-2');
    });

    it('should filter transactions by date range when options provided', async () => {
      const mockTransactions = [
        { id: 'txn-1', amount: -50, datetime: 1704067200000, allocatedFundId: mockFundAccountId },
      ];

      const mockDocs = mockTransactions.map((txn) => ({
        id: txn.id,
        data: () => txn,
      }));

      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(orderBy).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockDocs,
      } as any);

      const result = await TransactionsService.getTransactionsByFund(mockFundAccountId, {
        startDate: 1704067200000,
        endDate: 1706745600000,
      });

      expect(result).toHaveLength(1);
      expect(where).toHaveBeenCalledWith('datetime', '>=', 1704067200000);
      expect(where).toHaveBeenCalledWith('datetime', '<=', 1706745600000);
    });

    it('should return empty array when no transactions allocated to fund', async () => {
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(orderBy).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: [],
      } as any);

      const result = await TransactionsService.getTransactionsByFund(mockFundAccountId);

      expect(result).toHaveLength(0);
    });
  });

  describe('calculateFundAllocationTotal', () => {
    it('should calculate the total amount of transactions allocated to a fund', async () => {
      const mockTransactions = [
        { id: 'txn-1', amount: -50, datetime: 1704067200000, allocatedFundId: mockFundAccountId },
        { id: 'txn-2', amount: -30, datetime: 1704153600000, allocatedFundId: mockFundAccountId },
        { id: 'txn-3', amount: 100, datetime: 1704240000000, allocatedFundId: mockFundAccountId },
      ];

      const mockDocs = mockTransactions.map((txn) => ({
        id: txn.id,
        data: () => txn,
      }));

      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(orderBy).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockDocs,
      } as any);

      const result = await TransactionsService.calculateFundAllocationTotal(mockFundAccountId);

      expect(result).toBe(20); // -50 + -30 + 100 = 20
    });

    it('should return 0 when no transactions allocated to fund', async () => {
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(orderBy).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: [],
      } as any);

      const result = await TransactionsService.calculateFundAllocationTotal(mockFundAccountId);

      expect(result).toBe(0);
    });

    it('should calculate total with date range filtering', async () => {
      const mockTransactions = [
        { id: 'txn-1', amount: -50, datetime: 1704067200000, allocatedFundId: mockFundAccountId },
        { id: 'txn-2', amount: -30, datetime: 1704153600000, allocatedFundId: mockFundAccountId },
      ];

      const mockDocs = mockTransactions.map((txn) => ({
        id: txn.id,
        data: () => txn,
      }));

      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(orderBy).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockDocs,
      } as any);

      const result = await TransactionsService.calculateFundAllocationTotal(mockFundAccountId, {
        startDate: 1704067200000,
        endDate: 1706745600000,
      });

      expect(result).toBe(-80); // -50 + -30 = -80
    });

    it('should handle transactions with undefined amounts', async () => {
      const mockTransactions = [
        { id: 'txn-1', amount: -50, datetime: 1704067200000, allocatedFundId: mockFundAccountId },
        { id: 'txn-2', amount: undefined, datetime: 1704153600000, allocatedFundId: mockFundAccountId },
        { id: 'txn-3', amount: 100, datetime: 1704240000000, allocatedFundId: mockFundAccountId },
      ];

      const mockDocs = mockTransactions.map((txn) => ({
        id: txn.id,
        data: () => txn,
      }));

      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(orderBy).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: mockDocs,
      } as any);

      const result = await TransactionsService.calculateFundAllocationTotal(mockFundAccountId);

      expect(result).toBe(50); // -50 + 0 + 100 = 50
    });
  });
});
