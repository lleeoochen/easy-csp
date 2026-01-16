import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
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
    if (!uid) {
      throw new Error("User not authenticated");
    }
    return uid;
  }

  /**
   * Lists financial institutions for the user from Firestore
   */
  public static async listFinancialInstitutions(): Promise<FinancialInstitution[]> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();

      const financialInstitutionsQuery = query(
        collection(firestore, FINANCIAL_INSTITUTIONS_COLLECTION),
        where("uid", "==", uid)
      );

      const snapshot = await getDocs(financialInstitutionsQuery);

      const financialInstitutions: FinancialInstitution[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as FinancialInstitution;
        financialInstitutions.push(data);
      });

      return financialInstitutions;
    } catch (error) {
      console.error("Error listing financial institutions:", error);
      throw error;
    }
  }

  /**
   * Updates all user's financial institutions status to awaitSync
   */
  public static async refreshFinancialInstitutions(): Promise<void> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();

      const financialInstitutionsQuery = query(
        collection(firestore, FINANCIAL_INSTITUTIONS_COLLECTION),
        where("uid", "==", uid)
      );

      const snapshot = await getDocs(financialInstitutionsQuery);

      // Update all financial institutions status to awaitSync
      const updatePromises = snapshot.docs.map((docSnapshot) => {
        const docRef = doc(firestore, FINANCIAL_INSTITUTIONS_COLLECTION, docSnapshot.id);
        return updateDoc(docRef, {
          status: FinancialInstitutionStatus.AwaitSync
        });
      });

      await Promise.all(updatePromises);

      console.log(`Updated ${updatePromises.length} financial institutions to awaitSync status`);
    } catch (error) {
      console.error("Error updating financial institutions status:", error);
      throw error;
    }
  }
}
