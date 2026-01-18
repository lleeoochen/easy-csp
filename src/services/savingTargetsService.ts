import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  SAVING_TARGETS_COLLECTION,
  FINANCIAL_INSTITUTIONS_COLLECTION,
} from "@easy-csp/shared-types";
import type { SavingTarget, FinancialInstitution } from "@easy-csp/shared-types";
import type { UI_SavingTargetAndBalance } from "../types/uiTypes";

// Extended SavingTarget interface with current balance information

export class SavingTargetsService {
  private static getAuthenticatedUserId(): string {
    const auth = getAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) {
      throw new Error("User not authenticated");
    }
    return uid;
  }

  /**
   * Creates a new saving target for a user
   */
  public static async addSavingTarget(
    name: string,
    targetAmount: number,
    financialInstitutionId: string,
    accountId: string
  ): Promise<{ success: boolean; savingTarget?: SavingTarget & { id: string }; message?: string }> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();

      const savingTarget: SavingTarget = {
        uid,
        name,
        targetAmount,
        financialInstitutionId,
        accountId,
      };

      // Add to Firestore with auto-generated document ID
      const docRef = await addDoc(
        collection(firestore, SAVING_TARGETS_COLLECTION),
        savingTarget
      );

      return {
        success: true,
        savingTarget: {
          ...savingTarget,
          id: docRef.id,
        },
      };
    } catch (error) {
      console.error("Error adding saving target:", error);
      return {
        success: false,
        message: "Failed to add saving target",
      };
    }
  }

  /**
   * Updates an existing saving target
   */
  public static async updateSavingTarget(
    id: string,
    updates: Partial<Pick<SavingTarget, "name" | "targetAmount" | "financialInstitutionId" | "accountId">>
  ): Promise<{ success: boolean; savingTarget?: SavingTarget & { id: string }; message?: string }> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();
      const docRef = doc(firestore, SAVING_TARGETS_COLLECTION, id);

      // First verify the document exists and belongs to the user
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return {
          success: false,
          message: "Saving target not found",
        };
      }

      const existingData = docSnap.data() as SavingTarget;
      if (existingData.uid !== uid) {
        return {
          success: false,
          message: "Unauthorized access to saving target",
        };
      }

      // Update the document
      await updateDoc(docRef, updates);

      // Return updated data
      const updatedSavingTarget = {
        ...existingData,
        ...updates,
        id,
      };

      return {
        success: true,
        savingTarget: updatedSavingTarget,
      };
    } catch (error) {
      console.error("Error updating saving target:", error);
      return {
        success: false,
        message: "Failed to update saving target",
      };
    }
  }

  /**
   * Removes a saving target
   */
  public static async removeSavingTarget(
    id: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();
      const docRef = doc(firestore, SAVING_TARGETS_COLLECTION, id);

      // First verify the document exists and belongs to the user
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return {
          success: false,
          message: "Saving target not found",
        };
      }

      const existingData = docSnap.data() as SavingTarget;
      if (existingData.uid !== uid) {
        return {
          success: false,
          message: "Unauthorized access to saving target",
        };
      }

      // Delete the document
      await deleteDoc(docRef);

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error removing saving target:", error);
      return {
        success: false,
        message: "Failed to remove saving target",
      };
    }
  }

  /**
   * Lists all saving targets for a user with current balance information
   */
  public static async listSavingTargets(): Promise<{
    success: boolean;
    savingTargets?: UI_SavingTargetAndBalance[];
    message?: string
  }> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();

      // Fetch saving targets
      const savingTargetsQuery = query(
        collection(firestore, SAVING_TARGETS_COLLECTION),
        where("uid", "==", uid)
      );
      const savingTargetsSnapshot = await getDocs(savingTargetsQuery);

      // Fetch user's financial institutions
      const financialInstitutionsQuery = query(
        collection(firestore, FINANCIAL_INSTITUTIONS_COLLECTION),
        where("uid", "==", uid)
      );
      const financialInstitutionsSnapshot = await getDocs(financialInstitutionsQuery);

      const financialInstitutions = financialInstitutionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data() as FinancialInstitution,
      }));

      // Process saving targets with balance information
      const savingTargetsWithBalance: UI_SavingTargetAndBalance[] = savingTargetsSnapshot.docs.map((doc) => {
        const savingTarget = doc.data() as SavingTarget;
        let currentAmount = 0;
        let institutionName = '';
        let accountName = '';

        // Calculate current balance from tracked account
        if (savingTarget.financialInstitutionId && savingTarget.accountId) {
          const institution = financialInstitutions.find((fi) => fi.institutionId === savingTarget.financialInstitutionId);

          if (institution) {
            const account = institution.accounts.find((acc) => acc.accountId === savingTarget.accountId);

            if (account) {
              currentAmount = account.balance;
              institutionName = institution.institutionName;
              accountName = account.accountName;
            }
          }
        }

        return {
          ...savingTarget,
          id: doc.id,
          currentAmount,
          institutionName,
          accountName
        };
      });

      return {
        success: true,
        savingTargets: savingTargetsWithBalance,
      };
    } catch (error) {
      console.error("Error listing saving targets:", error);
      return {
        success: false,
        message: "Failed to list saving targets",
      };
    }
  }
}
