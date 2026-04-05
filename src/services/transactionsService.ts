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
  runTransaction
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
  public static async updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<void> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();

      const transactionRef = doc(firestore, TRANSACTIONS_COLLECTION, transactionId);

      // Read original transaction to get old values
      const transactionSnap = await getDoc(transactionRef);

      if (!transactionSnap.exists()) {
        throw new Error("Transaction not found");
      }

      const originalTransaction = transactionSnap.data() as Transaction;

      // Verify user owns this transaction
      if (originalTransaction.uid !== uid) {
        throw new Error("Unauthorized access to transaction");
      }

      const oldSavingTargetId = originalTransaction.savingTargetId;
      const oldAmount = originalTransaction.amount;
      const newSavingTargetId = updates.savingTargetId !== undefined ? updates.savingTargetId : oldSavingTargetId;
      const newAmount = updates.amount !== undefined ? updates.amount : oldAmount;

      const savingTargetChanged = oldSavingTargetId !== newSavingTargetId;
      const amountChanged = oldAmount !== newAmount;

      // If savingTargetId or amount changed, handle balance updates
      if (savingTargetChanged || amountChanged) {
        await runTransaction(firestore, async (firestoreTransaction) => {
          // Handle old fund balance update (if exists and is manual)
          if (oldSavingTargetId) {
            const oldFundRef = doc(firestore, SAVING_TARGETS_COLLECTION, oldSavingTargetId);
            const oldFundSnap = await firestoreTransaction.get(oldFundRef);

            if (oldFundSnap.exists()) {
              const oldFundData = oldFundSnap.data() as SavingTarget;

              if (isManualFund(oldFundData)) {
                // If fund changed, subtract old amount from old fund
                if (savingTargetChanged) {
                  const currentBalance = oldFundData.currentBalance ?? 0;
                  const newBalance = currentBalance - oldAmount;
                  firestoreTransaction.update(oldFundRef, withoutUndefinedValue({ currentBalance: newBalance }));
                }
                // If only amount changed (same fund), update by difference
                else if (amountChanged) {
                  const currentBalance = oldFundData.currentBalance ?? 0;
                  const difference = newAmount - oldAmount;
                  const newBalance = currentBalance + difference;
                  firestoreTransaction.update(oldFundRef, withoutUndefinedValue({ currentBalance: newBalance }));
                }
              }
            }
          }

          // Handle new fund balance update (if fund changed and new fund is manual)
          if (savingTargetChanged && newSavingTargetId) {
            const newFundRef = doc(firestore, SAVING_TARGETS_COLLECTION, newSavingTargetId);
            const newFundSnap = await firestoreTransaction.get(newFundRef);

            if (newFundSnap.exists()) {
              const newFundData = newFundSnap.data() as SavingTarget;

              if (isManualFund(newFundData)) {
                const currentBalance = newFundData.currentBalance ?? 0;
                const newBalance = currentBalance + newAmount;
                firestoreTransaction.update(newFundRef, withoutUndefinedValue({ currentBalance: newBalance }));
              }
            }
          }

          // Update transaction document
          const updatesWithUid = { ...updates, uid };
          firestoreTransaction.update(transactionRef, withoutUndefinedValue(updatesWithUid));
        });
      } else {
        // No balance updates needed, just update the transaction
        const updatesWithUid = { ...updates, uid };
        await updateDoc(transactionRef, withoutUndefinedValue(updatesWithUid));
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  }
}
