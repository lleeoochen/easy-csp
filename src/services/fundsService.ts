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
  where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  FUNDS_COLLECTION,
  FINANCIAL_INSTITUTIONS_COLLECTION,
  CSPBucket,
  FundType,
} from "@easy-csp/shared-types";
import type { Fund, FinancialInstitution } from "@easy-csp/shared-types";
import type { UI_FundAndBalance } from "../types/uiTypes";
import { ConsciousSpendingPlanService } from "./consciousSpendingPlanService";
import { prepareFirestoreData, withoutUndefinedValue } from "../utils/firestoreHelpers";

export class FundsService {
  private static getAuthenticatedUserId(): string {
    const auth = getAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) {
      throw new Error("User not authenticated");
    }
    return uid;
  }

  /**
   * Creates a new fund for a user
   */
  public static async addFund(
    name: string,
    type: FundType,
    targetAmount: number,
    financialInstitutionId?: string,
    accountId?: string
  ): Promise<{ success: boolean; fund?: Fund & { id: string }; message?: string }> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();

      const fund: Partial<Fund> = {
        uid,
        name,
        type,
        targetAmount,
        financialInstitutionId,
        accountId,
      };

      // If accountId is undefined, initialize currentBalance to 0 (manual fund)
      if (accountId === undefined) {
        fund.currentBalance = 0;
      }

      // Add to Firestore with auto-generated document ID
      // Use withoutUndefinedValue for addDoc (doesn't support deleteField)
      const docRef = await addDoc(
        collection(firestore, FUNDS_COLLECTION),
        withoutUndefinedValue(fund)
      );

      // Determine which CSP bucket based on fund type
      const cspBucket = type === FundType.Saving ? CSPBucket.Savings : CSPBucket.Investment;

      // Add CSP budget under appropriate bucket with category set to document ID
      try {
        await ConsciousSpendingPlanService.addCSPItem(
          cspBucket,
          docRef.id,
          0,
          true
        );
      } catch (cspError) {
        console.error("Error adding CSP budget item:", cspError);
        // Continue execution even if CSP fails - the fund was created successfully
      }

      return {
        success: true,
        fund: {
          ...fund,
          id: docRef.id,
        } as Fund & { id: string },
      };
    } catch (error) {
      console.error("Error adding fund:", error);
      return {
        success: false,
        message: "Failed to add fund",
      };
    }
  }

  /**
   * Updates an existing fund
   */
  public static async updateFund(
    id: string,
    updates: Partial<Pick<Fund, "name" | "type" | "targetAmount" | "financialInstitutionId" | "accountId">>
  ): Promise<{ success: boolean; fund?: Fund & { id: string }; message?: string }> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();
      const docRef = doc(firestore, FUNDS_COLLECTION, id);

      // First verify the document exists and belongs to the user
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return {
          success: false,
          message: "Fund not found",
        };
      }

      const existingData = docSnap.data() as Fund;
      if (existingData.uid !== uid) {
        return {
          success: false,
          message: "Unauthorized access to fund",
        };
      }

      // If type is changing, we need to move the CSP budget item
      if (updates.type && updates.type !== existingData.type) {
        const oldBucket = existingData.type === FundType.Saving ? CSPBucket.Savings : CSPBucket.Investment;
        const newBucket = updates.type === FundType.Saving ? CSPBucket.Savings : CSPBucket.Investment;

        try {
          // Delete from old bucket
          await ConsciousSpendingPlanService.deleteCSPItem(oldBucket, id);
          // Add to new bucket
          await ConsciousSpendingPlanService.addCSPItem(newBucket, id, 0, true);
        } catch (cspError) {
          console.error("Error moving CSP budget item:", cspError);
        }
      }

      // Update the document
      // prepareFirestoreData will convert undefined values to deleteField()
      await updateDoc(docRef, prepareFirestoreData(updates));

      // Return updated data
      const updatedFund = {
        ...existingData,
        ...updates,
        id,
      };

      return {
        success: true,
        fund: updatedFund,
      };
    } catch (error) {
      console.error("Error updating fund:", error);
      return {
        success: false,
        message: "Failed to update fund",
      };
    }
  }

  /**
   * Removes a fund
   */
  public static async removeFund(
    id: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();
      const docRef = doc(firestore, FUNDS_COLLECTION, id);

      // First verify the document exists and belongs to the user
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return {
          success: false,
          message: "Fund not found",
        };
      }

      const existingData = docSnap.data() as Fund;
      if (existingData.uid !== uid) {
        return {
          success: false,
          message: "Unauthorized access to fund",
        };
      }

      // Determine which CSP bucket based on fund type
      const cspBucket = existingData.type === FundType.Saving ? CSPBucket.Savings : CSPBucket.Investment;

      // Remove CSP budget item with matching category before deleting the fund
      try {
        await ConsciousSpendingPlanService.deleteCSPItem(cspBucket, id);
      } catch (cspError) {
        console.error("Error removing CSP budget item:", cspError);
        // Continue execution even if CSP fails - we still want to delete the fund
      }

      // Nullify fundId for all transactions linked to this fund
      try {
        const transactionsQuery = query(
          collection(firestore, "transactions"),
          where("uid", "==", uid),
          where("fundId", "==", id)
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);

        const updatePromises = transactionsSnapshot.docs.map(transactionDoc =>
          updateDoc(doc(firestore, "transactions", transactionDoc.id), prepareFirestoreData({
            fundId: null
          }))
        );

        await Promise.all(updatePromises);
      } catch (transactionError) {
        console.error("Error nullifying fundId for transactions:", transactionError);
        // Continue execution even if this fails
      }

      // Delete the document
      await deleteDoc(docRef);

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error removing fund:", error);
      return {
        success: false,
        message: "Failed to remove fund",
      };
    }
  }

  /**
   * Sets the balance of a manual fund directly
   * Only works for manual funds (accountId is undefined)
   */
  public static async setFundBalance(
    fundId: string,
    newBalance: number
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();
      const fundRef = doc(firestore, FUNDS_COLLECTION, fundId);

      // Verify the fund exists and belongs to the user
      const fundSnap = await getDoc(fundRef);
      if (!fundSnap.exists()) {
        return {
          success: false,
          message: "Fund not found",
        };
      }

      const fundData = fundSnap.data() as Fund;

      if (fundData.uid !== uid) {
        return {
          success: false,
          message: "Unauthorized access to fund",
        };
      }

      // Verify fund is manual (accountId is undefined)
      if (fundData.accountId !== undefined) {
        return {
          success: false,
          message: "Cannot set balance for account-based funds",
        };
      }

      // Update the currentBalance field
      await updateDoc(fundRef, prepareFirestoreData({ currentBalance: newBalance }));

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error setting fund balance:", error);
      return {
        success: false,
        message: "Failed to set fund balance",
      };
    }
  }

  /**
   * Lists all funds for a user with current balance information
   */
  public static async listFunds(): Promise<{
    success: boolean;
    funds?: UI_FundAndBalance[];
    message?: string
  }> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();

      // Fetch funds
      const fundsQuery = query(
        collection(firestore, FUNDS_COLLECTION),
        where("uid", "==", uid)
      );
      const fundsSnapshot = await getDocs(fundsQuery);

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

      // Process funds with balance information
      const fundsWithBalance: UI_FundAndBalance[] = fundsSnapshot.docs.map((doc) => {
        const fund = doc.data() as Fund;
        let currentAmount = 0;
        let institutionName = '';
        let accountName = '';

        // Check if fund is manual (no accountId)
        if (fund.accountId === undefined) {
          // Manual fund - use currentBalance field
          currentAmount = fund.currentBalance ?? 0;
          institutionName = '';
          accountName = '';
        } else {
          // Account-based fund - calculate current balance from tracked account
          if (fund.financialInstitutionId && fund.accountId) {
            const institution = financialInstitutions.find((fi) => fi.institutionId === fund.financialInstitutionId);

            if (institution) {
              const account = institution.accounts.find((acc) => acc.accountId === fund.accountId);

              if (account) {
                currentAmount = account.balance;
                institutionName = institution.institutionName;
                accountName = account.accountName;
              }
            }
          }
        }

        return {
          ...fund,
          id: doc.id,
          currentAmount,
          institutionName,
          accountName
        };
      });

      return {
        success: true,
        funds: fundsWithBalance,
      };
    } catch (error) {
      console.error("Error listing funds:", error);
      return {
        success: false,
        message: "Failed to list funds",
      };
    }
  }
}
