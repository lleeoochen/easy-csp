import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  FINANCIAL_INSTITUTIONS_COLLECTION,
  FinancialInstitutionStatus,
} from "@easy-csp/shared-types";
import type { FinancialInstitution } from "@easy-csp/shared-types";

export class FinancialInstitutionsService {
  private static getAuthenticatedUserId(): string {
    const auth = getAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated");
    return uid;
  }

  public static async listFinancialInstitutions(): Promise<FinancialInstitution[]> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();
      const snapshot = await getDocs(
        query(collection(firestore, FINANCIAL_INSTITUTIONS_COLLECTION), where("uid", "==", uid))
      );
      return snapshot.docs.map((d) => ({ ...(d.data() as FinancialInstitution), docId: d.id }));
    } catch (error) {
      console.error("Error listing financial institutions:", error);
      throw error;
    }
  }

  /** Sets all institutions to AwaitSync to trigger a full refresh */
  public static async refreshFinancialInstitutions(): Promise<void> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();
      const snapshot = await getDocs(
        query(collection(firestore, FINANCIAL_INSTITUTIONS_COLLECTION), where("uid", "==", uid))
      );
      await Promise.all(
        snapshot.docs.map((d) =>
          updateDoc(doc(firestore, FINANCIAL_INSTITUTIONS_COLLECTION, d.id), {
            status: FinancialInstitutionStatus.AwaitSync,
          })
        )
      );
    } catch (error) {
      console.error("Error refreshing financial institutions:", error);
      throw error;
    }
  }

  /** Retries sync for a single institution by setting it back to AwaitSync */
  public static async retrySyncInstitution(docId: string): Promise<void> {
    const firestore = getFirestore();
    await updateDoc(doc(firestore, FINANCIAL_INSTITUTIONS_COLLECTION, docId), {
      status: FinancialInstitutionStatus.AwaitSync,
      plaidErrorCode: null,
    });
  }

  /** Removes an institution document from Firestore */
  public static async removeInstitution(docId: string): Promise<void> {
    const firestore = getFirestore();
    await deleteDoc(doc(firestore, FINANCIAL_INSTITUTIONS_COLLECTION, docId));
  }

  /** Sets institution back to AwaitSync after a successful reconnect via Plaid Link update mode */
  public static async markInstitutionForResync(docId: string): Promise<void> {
    const firestore = getFirestore();
    await updateDoc(doc(firestore, FINANCIAL_INSTITUTIONS_COLLECTION, docId), {
      status: FinancialInstitutionStatus.AwaitSync,
      plaidErrorCode: null,
    });
  }
}
