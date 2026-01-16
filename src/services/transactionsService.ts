import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  TRANSACTIONS_COLLECTION,
} from "@easy-csp/shared-types";
import type { Transaction, ListTransactionsRequest } from "@easy-csp/shared-types";

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
  public static async listTransactions(request?: ListTransactionsRequest): Promise<Transaction[]> {
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

      // Sort by datetime in descending order (newest first)
      transactionsQuery = query(
        transactionsQuery,
        orderBy("datetime", "desc")
      );

      const snapshot = await getDocs(transactionsQuery);

      // Convert the snapshot to Transaction objects
      const transactions: Transaction[] = [];
      snapshot.forEach((doc) => {
        transactions.push(doc.data() as Transaction);
      });

      return transactions;
    } catch (error) {
      console.error("Error listing transactions:", error);
      throw error;
    }
  }
}
