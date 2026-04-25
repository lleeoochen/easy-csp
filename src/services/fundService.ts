import type { UI_Fund } from '@/types/uiTypes';
import { prepareFirestoreData, withoutUndefinedValue } from '@/utils/firestoreHelpers';
import type {
  Fund
} from "@easy-csp/shared-types";
import {
  FUNDS_COLLECTION
} from "@easy-csp/shared-types";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  where
} from "firebase/firestore";

/**
 * Service for managing user funds (both manual and Plaid-linked)
 *
 * This service provides methods for:
 * - Creating and managing manual funds
 * - Updating account nicknames and balances
 *
 * All methods require user authentication and enforce user ownership via uid.
 */
export class FundService {
  /**
   * Gets the authenticated user's ID
   *
   * @returns User ID (uid)
   * @throws Error if user is not authenticated
   */
  private static getAuthenticatedUserId(): string {
    const auth = getAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) {
      throw new Error("User not authenticated");
    }
    return uid;
  }

  /**
   * Lists all funds for the authenticated user
   *
   * Returns all funds (both manual and Plaid-linked) owned by the current user.
   * Funds are returned as-is from Firestore without additional denormalization.
   *
   * @returns Promise resolving to array of Account objects
   * @throws Error if user is not authenticated
   */
  static async listFunds(): Promise<UI_Fund[]> {
    const uid = this.getAuthenticatedUserId();
    const firestore = getFirestore();

    // Query funds collection by uid
    const fundsQuery = query(
      collection(firestore, FUNDS_COLLECTION),
      where("uid", "==", uid)
    );

    const fundsSnapshot = await getDocs(fundsQuery);

    // Map Firestore documents to FinancialAccount objects
    const funds: UI_Fund[] = fundsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as UI_Fund));

    return funds;
  }

  /**
   * Creates a new fund for the authenticated user
   *
   * Funds are used to track savings or investment goals linked to specific accounts.
   * Each fund must be associated with an existing account.
   *
   * @param name - Display name for the fund (required, non-empty)
   * @param type - Type of fund ('saving' or 'investment')
   * @param accountId - Firestore document ID of the account to link to this fund
   * @param targetAmount - Optional target amount for goal tracking
   * @returns Promise resolving to the new fund's Firestore document ID
   * @throws Error if user is not authenticated
   * @throws Error if validation fails (empty name, invalid type, invalid account)
   */
  static async createFund(
    name: string,
    type: 'saving' | 'investment',
    accountId: string,
    targetAmount?: number
  ): Promise<string> {
    // Step 1: Validate inputs
    const uid = this.getAuthenticatedUserId();

    // Validate fund name
    if (!name || name.trim().length === 0) {
      throw new Error("Fund name is required and cannot be empty");
    }

    // Validate fund type
    if (type !== 'saving' && type !== 'investment') {
      throw new Error("Fund type must be either 'saving' or 'investment'");
    }

    // Validate target amount if provided
    if (targetAmount !== undefined && targetAmount !== null) {
      if (typeof targetAmount !== "number" || isNaN(targetAmount)) {
        throw new Error("Target amount must be a valid number");
      }
      if (targetAmount <= 0) {
        throw new Error("Target amount must be a positive number");
      }
    }

    // Step 2: Create fund document
    const firestore = getFirestore();

    // Prepare fund data
    const fundData: Omit<Fund, "id"> = {
      uid,
      name: name.trim(),
      type,
      accountId,
      targetAmount: targetAmount || undefined,
    };

    // Step 3: Use withoutUndefinedValue for addDoc
    // This filters out undefined fields before writing to Firestore
    const docRef = await addDoc(
      collection(firestore, FUNDS_COLLECTION),
      withoutUndefinedValue(fundData)
    );

    // Step 4: Return new fund ID
    return docRef.id;
  }

  /**
   * Updates a fund's information
   *
   * Allows updating fund name, type, linked account, and target amount.
   *
   * @param fundId - Firestore document ID of the fund to update
   * @param updates - Object containing fields to update
   * @returns Promise that resolves when the update is complete
   * @throws Error if user is not authenticated
   * @throws Error if fund does not exist
   * @throws Error if fund does not belong to the authenticated user
   */
  static async updateFund(
    fundId: string,
    updates: {
      name?: string;
      type?: 'saving' | 'investment';
      accountId?: string;
      targetAmount?: number | null;
    }
  ): Promise<void> {
    // Step 1: Verify fund exists and belongs to user
    const uid = this.getAuthenticatedUserId();
    const firestore = getFirestore();

    // Get the fund document
    const fundRef = doc(firestore, FUNDS_COLLECTION, fundId);
    const fundSnapshot = await getDoc(fundRef);

    // Verify fund exists
    if (!fundSnapshot.exists()) {
      throw new Error(`Fund with ID ${fundId} does not exist`);
    }

    // Verify fund belongs to user
    const fundData = fundSnapshot.data() as Fund;
    if (fundData.uid !== uid) {
      throw new Error("Unauthorized: Fund does not belong to the authenticated user");
    }

    // Step 2: Validate and prepare updates
    const updateData: Partial<Fund> = {};

    // Validate and add name if provided
    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new Error("Fund name cannot be empty");
      }
      updateData.name = updates.name.trim();
    }

    // Validate and add type if provided
    if (updates.type !== undefined) {
      if (updates.type !== 'saving' && updates.type !== 'investment') {
        throw new Error("Fund type must be either 'saving' or 'investment'");
      }
      updateData.type = updates.type;
    }

    // Add accountId if provided
    if (updates.accountId !== undefined) {
      updateData.accountId = updates.accountId;
    }

    // Validate and add targetAmount if provided
    if (updates.targetAmount !== undefined) {
      if (updates.targetAmount === null) {
        updateData.targetAmount = undefined; // Will be deleted
      } else {
        if (typeof updates.targetAmount !== "number" || isNaN(updates.targetAmount)) {
          throw new Error("Target amount must be a valid number");
        }
        if (updates.targetAmount <= 0) {
          throw new Error("Target amount must be a positive number");
        }
        updateData.targetAmount = updates.targetAmount;
      }
    }

    // Step 3: Update fund with all changes
    await updateDoc(
      fundRef,
      prepareFirestoreData(updateData)
    );
  }

  /**
   * Deletes a fund
   *
   * Permanently deletes a fund from Firestore.
   *
   * @param fundId - Firestore document ID of the fund to delete
   * @returns Promise that resolves when the deletion is complete
   * @throws Error if user is not authenticated
   * @throws Error if fund does not exist or does not belong to user
   */
  static async deleteFund(fundId: string): Promise<void> {
    // Step 1: Verify fund exists and belongs to user
    const uid = this.getAuthenticatedUserId();
    const firestore = getFirestore();

    // Get the fund document
    const fundRef = doc(firestore, FUNDS_COLLECTION, fundId);
    const fundSnapshot = await getDoc(fundRef);

    // Verify fund exists
    if (!fundSnapshot.exists()) {
      throw new Error(`Fund with ID ${fundId} does not exist`);
    }

    // Verify fund belongs to user
    const fundData = fundSnapshot.data() as Fund;
    if (fundData.uid !== uid) {
      throw new Error("Unauthorized: Fund does not belong to the authenticated user");
    }

    // Step 2: Delete fund document
    await deleteDoc(fundRef);
  }

  /**
   * Updates the target amount for an fund (for goal tracking)
   *
   * This method allows users to set or update a target amount for any fund
   * (both manual and Plaid-linked). The target amount is used to track progress
   * toward savings or investment goals directly on the fund.
   *
   * To clear a target amount, pass null or undefined as the targetAmount parameter.
   *
   * @param fundId - Firestore document ID of the fund to update
   * @param targetAmount - Target amount (positive number to set, null/undefined to clear)
   * @returns Promise that resolves when the update is complete
   * @throws Error if user is not authenticated
   * @throws Error if fund does not exist
   * @throws Error if fund does not belong to the authenticated user
   * @throws Error if targetAmount is not a positive number (when not null/undefined)
   */
  static async updateFundTargetAmount(
    fundId: string,
    targetAmount: number | null | undefined
  ): Promise<void> {
    // Step 1: Verify fund exists and belongs to user
    const uid = this.getAuthenticatedUserId();
    const firestore = getFirestore();

    // Get the fund document
    const fundRef = doc(firestore, FUNDS_COLLECTION, fundId);
    const fundSnapshot = await getDoc(fundRef);

    // Verify fund exists
    if (!fundSnapshot.exists()) {
      throw new Error(`Fund with ID ${fundId} does not exist`);
    }

    // Verify fund belongs to user
    const fundData = fundSnapshot.data() as Fund;
    if (fundData.uid !== uid) {
      throw new Error("Unauthorized: Fund does not belong to the authenticated user");
    }

    // Step 2: Validate targetAmount is positive number or null
    if (targetAmount !== null && targetAmount !== undefined) {
      if (typeof targetAmount !== "number" || isNaN(targetAmount)) {
        throw new Error("Target amount must be a valid number");
      }
      if (targetAmount <= 0) {
        throw new Error("Target amount must be a positive number");
      }
    }

    // Step 3: Update targetAmount field (or remove if null)
    // Step 4: Use prepareFirestoreData for updateDoc
    // prepareFirestoreData converts undefined to deleteField()
    await updateDoc(
      fundRef,
      prepareFirestoreData({
        targetAmount: targetAmount || undefined, // Convert null to undefined for deletion
      })
    );
  }
}
