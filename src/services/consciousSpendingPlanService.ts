import {
  getFirestore,
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  CONSCIOUS_SPENDING_PLANS_COLLECTION,
  type ConsciousSpendingPlan,
  CSPBucket
} from "@easy-csp/shared-types";

export class ConsciousSpendingPlanService {
  private static getAuthenticatedUserId(): string {
    const auth = getAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) {
      throw new Error("User not authenticated");
    }
    return uid;
  }

  /**
   * Gets the user's Conscious Spending Plan
   */
  public static async getCSP(): Promise<{
    success: boolean;
    csp?: ConsciousSpendingPlan;
    message?: string
  }> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();
      const docRef = doc(firestore, CONSCIOUS_SPENDING_PLANS_COLLECTION, uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          message: "Conscious Spending Plan not found",
        };
      }

      return {
        success: true,
        csp: docSnap.data() as ConsciousSpendingPlan,
      };
    } catch (error) {
      console.error("Error getting CSP:", error);
      return {
        success: false,
        message: "Failed to get Conscious Spending Plan",
      };
    }
  }

  /**
   * Updates an existing CSP item
   */
  public static async updateCSPItem(
    bucket: CSPBucket,
    category: string,
    amount: number
  ): Promise<{
    success: boolean;
    csp?: ConsciousSpendingPlan;
    message?: string
  }> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();
      const docRef = doc(firestore, CONSCIOUS_SPENDING_PLANS_COLLECTION, uid);

      // First get the current CSP
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return {
          success: false,
          message: "Conscious Spending Plan not found",
        };
      }

      const currentCSP = docSnap.data() as ConsciousSpendingPlan;

      // Update the specific category in the bucket
      const bucketItems = [...currentCSP[bucket]];
      const itemIndex = bucketItems.findIndex(item => item.category === category);

      if (itemIndex === -1) {
        return {
          success: false,
          message: "Category not found in bucket",
        };
      }

      console.log(bucketItems[itemIndex]);

      bucketItems[itemIndex] = {
        ...bucketItems[itemIndex],
        category,
        amount,
      };

      const updatedCSP = {
        ...currentCSP,
        [bucket]: bucketItems
      };

      // Update the document
      await updateDoc(docRef, updatedCSP);

      return {
        success: true,
        csp: updatedCSP,
      };
    } catch (error) {
      console.error("Error updating CSP item:", error);
      return {
        success: false,
        message: "Failed to update CSP item",
      };
    }
  }

  /**
   * Adds a new CSP item to a bucket
   */
  public static async addCSPItem(
    bucket: CSPBucket,
    category: string,
    amount: number,
    isTrackingSavingTarget?: boolean,
    name?: string
  ): Promise<{
    success: boolean;
    csp?: ConsciousSpendingPlan;
    message?: string
  }> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();
      const docRef = doc(firestore, CONSCIOUS_SPENDING_PLANS_COLLECTION, uid);

      // First get the current CSP
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return {
          success: false,
          message: "Conscious Spending Plan not found",
        };
      }

      const currentCSP = docSnap.data() as ConsciousSpendingPlan;

      // Check if category already exists in the bucket
      const bucketItems = [...currentCSP[bucket]];
      const existingIndex = bucketItems.findIndex(item => item.category === category);

      if (existingIndex !== -1) {
        return {
          success: false,
          message: "Category already exists in bucket",
        };
      }

      // Add the new item
      bucketItems.push({
        category,
        amount,
        ...(isTrackingSavingTarget !== undefined ? { isTrackingSavingTarget } : {}),
        ...(name ? { name } : {})
      });

      const updatedCSP = {
        ...currentCSP,
        [bucket]: bucketItems
      };

      // Update the document
      await updateDoc(docRef, updatedCSP);

      return {
        success: true,
        csp: updatedCSP,
      };
    } catch (error) {
      console.error("Error adding CSP item:", error);
      return {
        success: false,
        message: "Failed to add CSP item",
      };
    }
  }

  /**
   * Removes a CSP item from a bucket
   */
  public static async deleteCSPItem(
    bucket: CSPBucket,
    category: string
  ): Promise<{
    success: boolean;
    csp?: ConsciousSpendingPlan;
    message?: string
  }> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();
      const docRef = doc(firestore, CONSCIOUS_SPENDING_PLANS_COLLECTION, uid);

      // First get the current CSP
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return {
          success: false,
          message: "Conscious Spending Plan not found",
        };
      }

      const currentCSP = docSnap.data() as ConsciousSpendingPlan;

      // Remove the item from the bucket
      const bucketItems = currentCSP[bucket].filter(item => item.category !== category);

      const updatedCSP = {
        ...currentCSP,
        [bucket]: bucketItems
      };

      // Update the document
      await updateDoc(docRef, updatedCSP);

      return {
        success: true,
        csp: updatedCSP,
      };
    } catch (error) {
      console.error("Error deleting CSP item:", error);
      return {
        success: false,
        message: "Failed to delete CSP item",
      };
    }
  }
}
