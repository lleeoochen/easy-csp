import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  startAfter,
  limit,
  addDoc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { TRANSACTIONS_COLLECTION, ACCOUNTS_COLLECTION } from "@easy-csp/shared-types";
import type { Transaction } from "@easy-csp/shared-types";
import type { ListTransactionsRequest, ListTransactionsResponse } from '@/types/requestTypes';
import { prepareFirestoreData, withoutUndefinedValue } from '@/utils/firestoreHelpers';

export const NEXT_TOKEN_END = "NEXT_TOKEN_END";

export class TransactionsService {
  private static getAuthenticatedUserId(): string {
    const auth = getAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) {
      throw new Error("User not authenticated");
    }
    return uid;
  }

  /**
   * Gets a single transaction by ID
   */
  public static async getTransaction(transactionId: string): Promise<Transaction | null> {
    try {
      const firestore = getFirestore();

      const transactionRef = doc(firestore, TRANSACTIONS_COLLECTION, transactionId);
      const transactionSnap = await getDoc(transactionRef);

      if (!transactionSnap.exists()) {
        return null;
      }

      return {
        ...transactionSnap.data(),
        id: transactionSnap.id,
      } as Transaction;
    } catch (error) {
      console.error("Error getting transaction:", error);
      throw error;
    }
  }

  /**
   * Lists transactions for the user from Firestore
   */
  public static async listTransactions(request?: ListTransactionsRequest): Promise<ListTransactionsResponse> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();

      // Start with base query for this user
      let transactionsQuery = query(
        collection(firestore, TRANSACTIONS_COLLECTION),
        where("uid", "==", uid)
      );

      // Add date filtering if provided
      if (request?.startDate) {
        transactionsQuery = query(
          transactionsQuery,
          where("datetime", ">=", request.startDate)
        );
      }

      if (request?.endDate) {
        transactionsQuery = query(
          transactionsQuery,
          where("datetime", "<=", request.endDate)
        );
      }

      // Add category filtering if provided
      if (request?.category) {
        transactionsQuery = query(
          transactionsQuery,
          where("category", "==", request.category)
        );
      }

      // Add splitParentId filtering if provided
      if (request?.splitParentId) {
        transactionsQuery = query(
          transactionsQuery,
          where("splitParentId", "==", request.splitParentId)
        );
      }

      // Sort by specified field and direction (defaults to datetime desc)
      const orderByField = request?.orderBy?.field ?? 'datetime';
      const orderByDirection = request?.orderBy?.direction ?? 'desc';
      transactionsQuery = query(
        transactionsQuery,
        orderBy(orderByField, orderByDirection)
      );

      if (request?.startAfter) {
        transactionsQuery = query(
          transactionsQuery,
          startAfter(request.startAfter)
        );
      }

      if (request?.limit) {
        transactionsQuery = query(
          transactionsQuery,
          limit(request.limit)
        );
      }

      const snapshot = await getDocs(transactionsQuery);

      // Convert the snapshot to Transaction objects
      const transactions: Transaction[] = [];
      snapshot.forEach((doc) => {
        transactions.push({
          ...doc.data(),
          id: doc.id,
        } as Transaction);
      });

      return {
        transactions,
        lastFetchSnapshot: snapshot.docs[snapshot.docs.length - 1] ?? NEXT_TOKEN_END
      };
    } catch (error) {
      console.error("Error listing transactions:", error);
      throw error;
    }
  }

  /**
   * Creates a new transaction in Firestore
   */
  public static async createTransaction(
    transaction: Omit<Transaction, 'id' | 'uid'>
  ): Promise<{ success: boolean; transaction?: Transaction & { id: string }; message?: string }> {
    try {
      console.log(transaction);
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();

      // Create transaction document with uid
      const transactionData: Omit<Transaction, 'id'> = {
        ...transaction,
        uid,
      };

      // Use withoutUndefinedValue for addDoc (doesn't support deleteField)
      const docRef = await addDoc(
        collection(firestore, TRANSACTIONS_COLLECTION),
        withoutUndefinedValue(transactionData)
      );

      return {
        success: true,
        transaction: {
          ...transactionData,
          id: docRef.id,
        },
      };
    } catch (error) {
      console.error("Error creating transaction:", error);
      return {
        success: false,
        message: "Failed to create transaction",
      };
    }
  }

  /**
   * Deletes a transaction from Firestore
   */
  public static async deleteTransaction(transactionId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const firestore = getFirestore();
      const transactionRef = doc(firestore, TRANSACTIONS_COLLECTION, transactionId);

      // Delete the transaction
      await deleteDoc(transactionRef);

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error deleting transaction:", error);
      return {
        success: false,
        message: "Failed to delete transaction",
      };
    }
  }

  /**
   * Updates a transaction in Firestore
   */
  public static async updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<void> {
    try {
      const firestore = getFirestore();
      const transactionRef = doc(firestore, TRANSACTIONS_COLLECTION, transactionId);

      // Update transaction document
      await updateDoc(transactionRef, prepareFirestoreData(updates));
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  }


  /**
   * Updates the fund allocation for a transaction
   *
   * Sets or clears the allocatedFundId field on a transaction.
   * Validates that the fund account exists and has isFundAccount === true.
   *
   * @param transactionId - Firestore document ID of the transaction to update
   * @param allocatedFundId - Fund account ID to allocate to, or null to clear allocation
   * @returns Promise resolving to success status and optional message
   * @throws Error if user is not authenticated
   *
   * @example
   * // Allocate transaction to a fund
   * const result = await TransactionsService.updateTransactionFundAllocation("txn123", "fund456");
   * if (result.success) {
   *   console.log("Transaction allocated to fund");
   * }
   *
   * @example
   * // Clear fund allocation
   * const result = await TransactionsService.updateTransactionFundAllocation("txn123", null);
   * if (result.success) {
   *   console.log("Fund allocation cleared");
   * }
   */
  public static async updateTransactionFundAllocation(
    transactionId: string,
    allocatedFundId: string | null
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();

      // If allocatedFundId is provided, validate it
      if (allocatedFundId) {
        // Get the fund account document
        const fundAccountRef = doc(firestore, ACCOUNTS_COLLECTION, allocatedFundId);
        const fundAccountSnapshot = await getDoc(fundAccountRef);

        // Verify fund account exists
        if (!fundAccountSnapshot.exists()) {
          return {
            success: false,
            message: "Fund account not found",
          };
        }

        // Verify fund account belongs to user
        const fundAccountData = fundAccountSnapshot.data();
        if (fundAccountData.uid !== uid) {
          return {
            success: false,
            message: "Fund account does not belong to user",
          };
        }

        // Verify account is a fund account
        if (!fundAccountData.isFundAccount) {
          return {
            success: false,
            message: "Referenced account is not a fund account",
          };
        }
      }

      // Update transaction with fund allocation
      const transactionRef = doc(firestore, TRANSACTIONS_COLLECTION, transactionId);
      await updateDoc(
        transactionRef,
        prepareFirestoreData({
          allocatedFundId: allocatedFundId,
        })
      );

      return {
        success: true,
        message: allocatedFundId
          ? "Transaction allocated to fund"
          : "Fund allocation cleared",
      };
    } catch (error) {
      console.error("Error updating transaction fund allocation:", error);
      return {
        success: false,
        message: "Failed to update fund allocation",
      };
    }
  }

  /**
   * Gets all transactions allocated to a specific fund
   *
   * Filters transactions by allocatedFundId and orders by datetime descending.
   * Optionally filters by date range.
   *
   * @param fundAccountId - Firestore document ID of the fund account
   * @param options - Optional date range filtering
   * @returns Promise resolving to array of Transaction objects
   * @throws Error if user is not authenticated
   *
   * @example
   * // Get all transactions for a fund
   * const transactions = await TransactionsService.getTransactionsByFund("fund123");
   *
   * @example
   * // Get transactions for a fund within a date range
   * const transactions = await TransactionsService.getTransactionsByFund("fund123", {
   *   startDate: 1704067200000,
   *   endDate: 1706745600000
   * });
   */
  public static async getTransactionsByFund(
    fundAccountId: string,
    options?: { startDate?: number; endDate?: number }
  ): Promise<Transaction[]> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();

      // Build query for transactions allocated to this fund
      let fundTransactionsQuery = query(
        collection(firestore, TRANSACTIONS_COLLECTION),
        where("uid", "==", uid),
        where("allocatedFundId", "==", fundAccountId)
      );

      // Add date filtering if provided
      if (options?.startDate) {
        fundTransactionsQuery = query(
          fundTransactionsQuery,
          where("datetime", ">=", options.startDate)
        );
      }

      if (options?.endDate) {
        fundTransactionsQuery = query(
          fundTransactionsQuery,
          where("datetime", "<=", options.endDate)
        );
      }

      // Order by datetime descending (newest first)
      fundTransactionsQuery = query(
        fundTransactionsQuery,
        orderBy("datetime", "desc")
      );

      const snapshot = await getDocs(fundTransactionsQuery);

      // Convert snapshot to Transaction objects
      const transactions: Transaction[] = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      } as Transaction));

      return transactions;
    } catch (error) {
      console.error("Error getting transactions by fund:", error);
      throw error;
    }
  }

  /**
   * Calculates the total amount of transactions allocated to a fund
   *
   * Sums the amount field of all transactions allocated to the specified fund.
   * Optionally filters by date range.
   *
   * @param fundAccountId - Firestore document ID of the fund account
   * @param options - Optional date range filtering
   * @returns Promise resolving to the total amount
   * @throws Error if user is not authenticated
   *
   * @example
   * // Get total allocation for a fund
   * const total = await TransactionsService.calculateFundAllocationTotal("fund123");
   * console.log(`Total allocated: $${total}`);
   *
   * @example
   * // Get total allocation for a fund within a date range
   * const total = await TransactionsService.calculateFundAllocationTotal("fund123", {
   *   startDate: 1704067200000,
   *   endDate: 1706745600000
   * });
   */
  public static async calculateFundAllocationTotal(
    fundAccountId: string,
    options?: { startDate?: number; endDate?: number }
  ): Promise<number> {
    try {
      // Get all transactions for this fund
      const transactions = await this.getTransactionsByFund(fundAccountId, options);

      // Sum the amounts
      const total = transactions.reduce((sum, transaction) => {
        return sum + (transaction.amount || 0);
      }, 0);

      return total;
    } catch (error) {
      console.error("Error calculating fund allocation total:", error);
      throw error;
    }
  }

}
