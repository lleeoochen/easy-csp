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
  limit
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  TRANSACTIONS_COLLECTION,
} from "@easy-csp/shared-types";
import type { Transaction } from "@easy-csp/shared-types";
import type { ListTransactionsRequest, ListTransactionsResponse } from "../types/firestoreTypes";

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
        transactions.push(doc.data() as Transaction);
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
   * Updates a transaction in Firestore
   */
  public static async updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<void> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();

      const transactionRef = doc(firestore, TRANSACTIONS_COLLECTION, transactionId);

      // Add uid to updates to ensure user owns this transaction
      const updatesWithUid = { ...updates, uid };

      await updateDoc(transactionRef, updatesWithUid);
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  }
}
