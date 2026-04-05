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
  deleteField,
  type Firestore,
  type Transaction as FirestoreTransaction
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  TRANSACTIONS_COLLECTION,
  SAVING_TARGETS_COLLECTION,
  isManualFund,
} from "@easy-csp/shared-types";
import type { Transaction, SavingTarget } from "@easy-csp/shared-types";
import type { ListTransactionsRequest, ListTransactionsResponse } from "../types/firestoreTypes";
import { withoutUndefinedValue } from "../utils/firestoreHelpers";

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

      // Add saving target filtering if provided
      if (request?.savingTargetId) {
        transactionsQuery = query(
          transactionsQuery,
          where("savingTargetId", "==", request.savingTargetId)
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
   * If savingTargetId is provided and fund is manual, atomically updates currentBalance
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

      // If savingTargetId is provided, check if fund is manual and update balance atomically
      if (transaction.savingTargetId) {
        const fundRef = doc(firestore, SAVING_TARGETS_COLLECTION, transaction.savingTargetId);

        // Use Firestore transaction for atomic balance update
        const createdTransactionId = await runTransaction(firestore, async (firestoreTransaction) => {
          const fundSnap = await firestoreTransaction.get(fundRef);

          if (fundSnap.exists()) {
            const fundData = fundSnap.data() as SavingTarget;

            // If fund is manual (no accountId), update currentBalance
            if (isManualFund(fundData)) {
              const currentBalance = fundData.currentBalance ?? 0;
              const newBalance = currentBalance + transaction.amount;
              firestoreTransaction.update(fundRef, { currentBalance: newBalance });
            }
          }

          // Create transaction document
          const transactionRef = doc(collection(firestore, TRANSACTIONS_COLLECTION));
          firestoreTransaction.set(transactionRef, withoutUndefinedValue(transactionData));

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
        // No savingTargetId, just create the transaction
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
   * If transaction has savingTargetId and fund is manual, atomically updates currentBalance
   */
  public static async deleteTransaction(transactionId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();

      const transactionRef = doc(firestore, TRANSACTIONS_COLLECTION, transactionId);

      // Read transaction to get savingTargetId and amount
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

      // If transaction has savingTargetId, check if fund is manual and update balance atomically
      if (transactionData.savingTargetId) {
        const fundRef = doc(firestore, SAVING_TARGETS_COLLECTION, transactionData.savingTargetId);

        // Use Firestore transaction for atomic balance update
        await runTransaction(firestore, async (firestoreTransaction) => {
          const fundSnap = await firestoreTransaction.get(fundRef);

          if (fundSnap.exists()) {
            const fundData = fundSnap.data() as SavingTarget;

            // If fund is manual (no accountId), update currentBalance
            if (isManualFund(fundData)) {
              const currentBalance = fundData.currentBalance ?? 0;
              const newBalance = currentBalance - transactionData.amount;
              firestoreTransaction.update(fundRef, withoutUndefinedValue({ currentBalance: newBalance }));
            }
          }

          // Delete transaction document
          firestoreTransaction.delete(transactionRef);
        });
      } else {
        // No savingTargetId, just delete the transaction
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
   * If savingTargetId or amount changed and fund is manual, atomically updates currentBalance
   */
  /**
   * Prepare updates by converting undefined fields to deleteField()
   */
  private static prepareTransactionUpdates(updates: Partial<Transaction>): Partial<Transaction> {
    const prepared = { ...updates };

    if (updates.savingTargetId === undefined && 'savingTargetId' in updates) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prepared as any).savingTargetId = deleteField();
    }
    if (updates.nickname === undefined && 'nickname' in updates) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prepared as any).nickname = deleteField();
    }

    return prepared;
  }

  /**
   * Update old saving target balance when transaction is moved or amount changes
   */
  private static async updateOldSavingTargetBalance(
    firestoreTransaction: FirestoreTransaction,
    firestore: Firestore,
    oldSavingTargetId: string,
    oldAmount: number,
    newAmount: number,
    savingTargetChanged: boolean,
    amountChanged: boolean
  ): Promise<void> {
    try {
      const oldFundRef = doc(firestore, SAVING_TARGETS_COLLECTION, oldSavingTargetId);
      const oldFundSnap = await firestoreTransaction.get(oldFundRef);

      if (!oldFundSnap.exists()) return;

      const oldFundData = oldFundSnap.data() as SavingTarget;
      if (!isManualFund(oldFundData)) return;

      const currentBalance = oldFundData.currentBalance ?? 0;
      let newBalance: number;

      if (savingTargetChanged) {
        // Fund changed: subtract old amount from old fund
        newBalance = currentBalance - oldAmount;
      } else if (amountChanged) {
        // Only amount changed: update by difference
        const difference = newAmount - oldAmount;
        newBalance = currentBalance + difference;
      } else {
        return;
      }

      firestoreTransaction.update(oldFundRef, withoutUndefinedValue({ currentBalance: newBalance }));
    } catch (error) {
      console.warn(`Could not access old saving target ${oldSavingTargetId}:`, error);
    }
  }

  /**
   * Update new saving target balance when transaction is moved to it
   */
  private static async updateNewSavingTargetBalance(
    firestoreTransaction: FirestoreTransaction,
    firestore: Firestore,
    newSavingTargetId: string,
    newAmount: number
  ): Promise<void> {
    try {
      const newFundRef = doc(firestore, SAVING_TARGETS_COLLECTION, newSavingTargetId);
      const newFundSnap = await firestoreTransaction.get(newFundRef);

      if (!newFundSnap.exists()) return;

      const newFundData = newFundSnap.data() as SavingTarget;
      if (!isManualFund(newFundData)) return;

      const currentBalance = newFundData.currentBalance ?? 0;
      const newBalance = currentBalance + newAmount;

      firestoreTransaction.update(newFundRef, withoutUndefinedValue({ currentBalance: newBalance }));
    } catch (error) {
      console.warn(`Could not access new saving target ${newSavingTargetId}:`, error);
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

      const oldSavingTargetId = originalTransaction.savingTargetId;
      const oldAmount = originalTransaction.amount;
      const newSavingTargetId = updates.savingTargetId;
      const newAmount = updates.amount !== undefined ? updates.amount : oldAmount;

      const savingTargetChanged = oldSavingTargetId !== newSavingTargetId;
      const amountChanged = oldAmount !== newAmount;
      const needsBalanceUpdate = savingTargetChanged || amountChanged;

      const preparedUpdates = this.prepareTransactionUpdates(updates);

      if (needsBalanceUpdate) {
        await runTransaction(firestore, async (firestoreTransaction) => {
          // Update old fund balance if it exists
          if (oldSavingTargetId) {
            await this.updateOldSavingTargetBalance(
              firestoreTransaction,
              firestore,
              oldSavingTargetId,
              oldAmount,
              newAmount,
              savingTargetChanged,
              amountChanged
            );
          }

          // Update new fund balance if fund changed
          if (savingTargetChanged && newSavingTargetId) {
            await this.updateNewSavingTargetBalance(
              firestoreTransaction,
              firestore,
              newSavingTargetId,
              newAmount
            );
          }

          // Update transaction document
          firestoreTransaction.update(transactionRef, withoutUndefinedValue(preparedUpdates));
        });
      } else {
        // No balance updates needed, just update the transaction
        await updateDoc(transactionRef, withoutUndefinedValue(preparedUpdates));
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  }
}
