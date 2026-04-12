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
  runTransaction,
  type Firestore,
  type Transaction as FirestoreTransaction
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  TRANSACTIONS_COLLECTION,
  FUNDS_COLLECTION,
  isManualFund,
} from "@easy-csp/shared-types";
import type { Transaction, Fund } from "@easy-csp/shared-types";
import type { ListTransactionsRequest, ListTransactionsResponse } from "../types/firestoreTypes";
import { prepareFirestoreData, withoutUndefinedValue } from "../utils/firestoreHelpers";

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
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();

      const transactionRef = doc(firestore, TRANSACTIONS_COLLECTION, transactionId);
      const transactionSnap = await getDoc(transactionRef);

      if (!transactionSnap.exists()) {
        return null;
      }

      const transaction = transactionSnap.data() as Transaction;

      // Verify user owns this transaction
      if (transaction.uid !== uid) {
        throw new Error("Unauthorized access to transaction");
      }

      return {
        ...transaction,
        id: transactionSnap.id,
      };
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

      // Add fund filtering if provided
      if (request?.fundId) {
        transactionsQuery = query(
          transactionsQuery,
          where("fundId", "==", request.fundId)
        );
      }

      // Sort by datetime in descending order (newest first)
      transactionsQuery = query(
        transactionsQuery,
        orderBy("datetime", "desc")
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
   * If fundId is provided and fund is manual, atomically updates currentBalance
   */
  public static async createTransaction(
    transaction: Omit<Transaction, 'id' | 'uid'>
  ): Promise<{ success: boolean; transaction?: Transaction & { id: string }; message?: string }> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();

      // Create transaction document with uid
      const transactionData: Omit<Transaction, 'id'> = {
        ...transaction,
        uid,
      };

      // If fundId is provided, check if fund is manual and update balance atomically
      if (transaction.fundId) {
        const fundRef = doc(firestore, FUNDS_COLLECTION, transaction.fundId);

        // Use Firestore transaction for atomic balance update
        const createdTransactionId = await runTransaction(firestore, async (firestoreTransaction) => {
          const fundSnap = await firestoreTransaction.get(fundRef);

          if (fundSnap.exists()) {
            const fundData = fundSnap.data() as Fund;

            // If fund is manual (no accountId), update currentBalance
            // Note: transaction.amount is negative for income, positive for expenses
            // For fund balance: income should increase, expenses should decrease
            // So we negate the transaction amount
            if (isManualFund(fundData)) {
              const currentBalance = fundData.currentBalance ?? 0;
              const newBalance = currentBalance - transaction.amount;
              firestoreTransaction.update(fundRef, { currentBalance: newBalance });
            }
          }

          // Create transaction document
          const transactionRef = doc(collection(firestore, TRANSACTIONS_COLLECTION));
          firestoreTransaction.set(transactionRef, prepareFirestoreData(transactionData), { merge: true });

          return transactionRef.id;
        });

        return {
          success: true,
          transaction: {
            ...transactionData,
            id: createdTransactionId,
          },
        };
      } else {
        // No fundId, just create the transaction
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
      }
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
   * If transaction has fundId and fund is manual, atomically updates currentBalance
   */
  public static async deleteTransaction(transactionId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();

      const transactionRef = doc(firestore, TRANSACTIONS_COLLECTION, transactionId);

      // Read transaction to get fundId and amount
      const transactionSnap = await getDoc(transactionRef);

      if (!transactionSnap.exists()) {
        return {
          success: false,
          message: "Transaction not found",
        };
      }

      const transactionData = transactionSnap.data() as Transaction;

      // Verify user owns this transaction
      if (transactionData.uid !== uid) {
        return {
          success: false,
          message: "Unauthorized access to transaction",
        };
      }

      // If transaction has fundId, check if fund is manual and update balance atomically
      if (transactionData.fundId) {
        const fundRef = doc(firestore, FUNDS_COLLECTION, transactionData.fundId);

        // Use Firestore transaction for atomic balance update
        await runTransaction(firestore, async (firestoreTransaction) => {
          const fundSnap = await firestoreTransaction.get(fundRef);

          if (fundSnap.exists()) {
            const fundData = fundSnap.data() as Fund;

            // If fund is manual (no accountId), update currentBalance
            // Note: transaction.amount is negative for income, positive for expenses
            // For fund balance: income should increase, expenses should decrease
            // So we negate the transaction amount (reverse the operation when deleting)
            if (isManualFund(fundData)) {
              const currentBalance = fundData.currentBalance ?? 0;
              const newBalance = currentBalance + transactionData.amount;
              firestoreTransaction.update(fundRef, prepareFirestoreData({ currentBalance: newBalance }));
            }
          }

          // Delete transaction document
          firestoreTransaction.delete(transactionRef);
        });
      } else {
        // No fundId, just delete the transaction
        await deleteDoc(transactionRef);
      }

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
   * If fundId or amount changed and fund is manual, atomically updates currentBalance
   */
  /**
   * Prepare updates by converting undefined fields to deleteField()
   */
  private static prepareTransactionUpdates(updates: Partial<Transaction>): Partial<Transaction> {
    // prepareFirestoreData will handle converting undefined to deleteField()
    // No need for manual handling anymore
    return updates;
  }

  /**
   * Update old fund balance when transaction is moved or amount changes
   */
  private static async updateOldFundBalance(
    firestoreTransaction: FirestoreTransaction,
    firestore: Firestore,
    oldFundId: string,
    oldAmount: number,
    newAmount: number,
    fundChanged: boolean,
    amountChanged: boolean
  ): Promise<void> {
    try {
      const oldFundRef = doc(firestore, FUNDS_COLLECTION, oldFundId);
      const oldFundSnap = await firestoreTransaction.get(oldFundRef);

      if (!oldFundSnap.exists()) return;

      const oldFundData = oldFundSnap.data() as Fund;
      if (!isManualFund(oldFundData)) return;

      const currentBalance = oldFundData.currentBalance ?? 0;
      let newBalance: number;

      if (fundChanged) {
        // Fund changed: reverse the old transaction's effect on old fund
        // Note: transaction.amount is negative for income, positive for expenses
        // For fund balance: income should increase, expenses should decrease
        // So we negate the transaction amount (reverse when removing from fund)
        newBalance = currentBalance + oldAmount;
      } else if (amountChanged) {
        // Only amount changed: update by difference
        // Reverse old amount effect, apply new amount effect
        const difference = oldAmount - newAmount;
        newBalance = currentBalance + difference;
      } else {
        return;
      }

      firestoreTransaction.update(oldFundRef, prepareFirestoreData({ currentBalance: newBalance }));
    } catch (error) {
      console.warn(`Could not access old fund ${oldFundId}:`, error);
    }
  }

  /**
   * Update new fund balance when transaction is moved to it
   */
  private static async updateNewFundBalance(
    firestoreTransaction: FirestoreTransaction,
    firestore: Firestore,
    newFundId: string,
    newAmount: number
  ): Promise<void> {
    try {
      const newFundRef = doc(firestore, FUNDS_COLLECTION, newFundId);
      const newFundSnap = await firestoreTransaction.get(newFundRef);

      if (!newFundSnap.exists()) return;

      const newFundData = newFundSnap.data() as Fund;
      if (!isManualFund(newFundData)) return;

      const currentBalance = newFundData.currentBalance ?? 0;
      // Note: transaction.amount is negative for income, positive for expenses
      // For fund balance: income should increase, expenses should decrease
      // So we negate the transaction amount
      const newBalance = currentBalance - newAmount;

      firestoreTransaction.update(newFundRef, prepareFirestoreData({ currentBalance: newBalance }));
    } catch (error) {
      console.warn(`Could not access new fund ${newFundId}:`, error);
    }
  }

  /**
   * Fetch and validate transaction ownership
   */
  private static async fetchAndValidateTransaction(
    firestore: Firestore,
    transactionId: string,
    uid: string
  ): Promise<Transaction> {
    const transactionRef = doc(firestore, TRANSACTIONS_COLLECTION, transactionId);
    const transactionSnap = await getDoc(transactionRef);

    if (!transactionSnap.exists()) {
      throw new Error("Transaction not found");
    }

    const transaction = transactionSnap.data() as Transaction;

    if (transaction.uid !== uid) {
      throw new Error("Unauthorized access to transaction");
    }

    return transaction;
  }

  public static async updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<void> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();

      const originalTransaction = await this.fetchAndValidateTransaction(firestore, transactionId, uid);
      const transactionRef = doc(firestore, TRANSACTIONS_COLLECTION, transactionId);

      const oldFundId = originalTransaction.fundId;
      const oldAmount = originalTransaction.amount;
      const newFundId = updates.fundId;
      const newAmount = updates.amount !== undefined ? updates.amount : oldAmount;

      const fundChanged = oldFundId !== newFundId;
      const amountChanged = oldAmount !== newAmount;
      const needsBalanceUpdate = fundChanged || amountChanged;

      const preparedUpdates = this.prepareTransactionUpdates(updates);

      if (needsBalanceUpdate) {
        await runTransaction(firestore, async (firestoreTransaction) => {
          // Update old fund balance if it exists
          if (oldFundId) {
            await this.updateOldFundBalance(
              firestoreTransaction,
              firestore,
              oldFundId,
              oldAmount,
              newAmount,
              fundChanged,
              amountChanged
            );
          }

          // Update new fund balance if fund changed
          if (fundChanged && newFundId) {
            await this.updateNewFundBalance(
              firestoreTransaction,
              firestore,
              newFundId,
              newAmount
            );
          }

          // Update transaction document
          firestoreTransaction.update(transactionRef, prepareFirestoreData(preparedUpdates));
        });
      } else {
        // No balance updates needed, just update the transaction
        await updateDoc(transactionRef, prepareFirestoreData(preparedUpdates));
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  }
}
