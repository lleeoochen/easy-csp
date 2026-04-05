/**
 * Travel Mode Service
 *
 * Service layer for managing Travel Mode rules in Firestore.
 * Travel Mode automatically marks transactions from selected categories
 * to a designated saving fund using the rules system.
 */

import {
  getFirestore,
  doc,
  getDoc,
  runTransaction,
  FirestoreError
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  RULES_COLLECTION,
  type Rule,
  type RuleTransformation,
  RuleCondition
} from "@easy-csp/shared-types";
import { TRAVEL_MODE_RULE_NAME, type TravelModeConfig } from "../types/travelMode";
import { getTravelModeRules } from "../utils/travelModeUtils";
import { prepareFirestoreData } from "../utils/firestoreHelpers";

/**
 * Custom error class for Travel Mode service errors
 */
export class TravelModeError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = "TravelModeError";
  }
}

/**
 * Error codes for Travel Mode operations
 */
export enum TravelModeErrorCode {
  NOT_AUTHENTICATED = "NOT_AUTHENTICATED",
  NOT_CONFIGURED = "NOT_CONFIGURED",
  INVALID_CONFIG = "INVALID_CONFIG",
  FIRESTORE_ERROR = "FIRESTORE_ERROR",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR"
}

export class TravelModeService {
  /**
   * Converts Firestore errors to TravelModeError with appropriate error codes
   */
  private static handleFirestoreError(error: unknown, operation: string): never {
    console.error(`Error during ${operation}:`, error);

    if (error instanceof FirestoreError) {
      switch (error.code) {
        case "permission-denied":
          throw new TravelModeError(
            "You don't have permission to perform this operation",
            TravelModeErrorCode.PERMISSION_DENIED,
            error
          );
        case "unavailable":
        case "deadline-exceeded":
          throw new TravelModeError(
            "Network error. Please check your connection and try again",
            TravelModeErrorCode.NETWORK_ERROR,
            error
          );
        case "not-found":
          throw new TravelModeError(
            "Travel mode configuration not found",
            TravelModeErrorCode.NOT_CONFIGURED,
            error
          );
        default:
          throw new TravelModeError(
            `Failed to ${operation}: ${error.message}`,
            TravelModeErrorCode.FIRESTORE_ERROR,
            error
          );
      }
    }

    if (error instanceof TravelModeError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new TravelModeError(
        error.message,
        TravelModeErrorCode.UNKNOWN_ERROR,
        error
      );
    }

    throw new TravelModeError(
      `An unexpected error occurred during ${operation}`,
      TravelModeErrorCode.UNKNOWN_ERROR,
      error
    );
  }

  private static getAuthenticatedUserId(): string {
    const auth = getAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) {
      throw new TravelModeError(
        "User not authenticated. Please sign in and try again",
        TravelModeErrorCode.NOT_AUTHENTICATED
      );
    }
    return uid;
  }

  /**
   * Gets the travel mode rule from Firestore
   * @param uid User ID (optional, defaults to authenticated user)
   * @returns Rule document or null if not found
   * @throws {TravelModeError} If user is not authenticated or Firestore operation fails
   */
  public static async getTravelModeRule(uid?: string): Promise<Rule | null> {
    try {
      const userId = uid || this.getAuthenticatedUserId();
      const firestore = getFirestore();

      const ruleDocRef = doc(firestore, RULES_COLLECTION, userId);
      const ruleDoc = await getDoc(ruleDocRef);

      if (ruleDoc.exists()) {
        return ruleDoc.data() as Rule;
      }

      return null;
    } catch (error) {
      this.handleFirestoreError(error, "fetch travel mode rule");
    }
  }

  /**
   * Creates or updates travel mode rules in Firestore
   * @param uid User ID
   * @param config Travel mode configuration (categories and saving target)
   * @throws {TravelModeError} If configuration is invalid or Firestore operation fails
   */
  public static async createOrUpdateTravelModeRule(
    uid: string,
    config: TravelModeConfig
  ): Promise<void> {
    try {
      // Validate user ID
      if (!uid || typeof uid !== "string" || uid.trim() === "") {
        throw new TravelModeError(
          "Invalid user ID",
          TravelModeErrorCode.INVALID_CONFIG
        );
      }

      // Validate configuration
      if (!config) {
        throw new TravelModeError(
          "Configuration is required",
          TravelModeErrorCode.INVALID_CONFIG
        );
      }

      if (!config.categories || !Array.isArray(config.categories)) {
        throw new TravelModeError(
          "Categories must be an array",
          TravelModeErrorCode.INVALID_CONFIG
        );
      }

      if (config.categories.length === 0) {
        throw new TravelModeError(
          "At least one category must be selected",
          TravelModeErrorCode.INVALID_CONFIG
        );
      }

      // Validate each category is a non-empty string
      const invalidCategories = config.categories.filter(
        cat => !cat || typeof cat !== "string" || cat.trim() === ""
      );
      if (invalidCategories.length > 0) {
        throw new TravelModeError(
          "All categories must be valid non-empty strings",
          TravelModeErrorCode.INVALID_CONFIG
        );
      }

      if (!config.fundId || typeof config.fundId !== "string" || config.fundId.trim() === "") {
        throw new TravelModeError(
          "Saving target must be selected",
          TravelModeErrorCode.INVALID_CONFIG
        );
      }

      const firestore = getFirestore();
      const ruleDocRef = doc(firestore, RULES_COLLECTION, uid);

      // Use Firestore transaction for atomic update
      await runTransaction(firestore, async (transaction) => {
        const ruleDoc = await transaction.get(ruleDocRef);

        let transformations: RuleTransformation[] = [];

        if (ruleDoc.exists()) {
          const existingRule = ruleDoc.data() as Rule;
          // Remove old travel mode rules
          transformations = existingRule.transformations.filter(
            t => t.name !== TRAVEL_MODE_RULE_NAME
          );
        }

        // Create new travel mode rules (one per category)
        const travelModeRules: RuleTransformation[] = config.categories.map(category => ({
          name: TRAVEL_MODE_RULE_NAME,
          enabled: true,
          matchingCriteria: {
            category: {
              value: category,
              condition: RuleCondition.Exact
            }
          },
          action: {
            assignFundId: config.fundId
          }
        }));

        // Add new travel mode rules
        transformations.push(...travelModeRules);

        // Save updated rules
        transaction.set(ruleDocRef, prepareFirestoreData({
          uid,
          transformations
        }), { merge: true });
      });
    } catch (error) {
      this.handleFirestoreError(error, "create or update travel mode rule");
    }
  }

  /**
   * Toggles travel mode on or off by updating the enabled field
   * @param uid User ID
   * @param enabled Whether travel mode should be enabled
   * @throws {TravelModeError} If travel mode is not configured or Firestore operation fails
   */
  public static async toggleTravelMode(uid: string, enabled: boolean): Promise<void> {
    try {
      // Validate user ID
      if (!uid || typeof uid !== "string" || uid.trim() === "") {
        throw new TravelModeError(
          "Invalid user ID",
          TravelModeErrorCode.INVALID_CONFIG
        );
      }

      // Validate enabled parameter
      if (typeof enabled !== "boolean") {
        throw new TravelModeError(
          "Enabled parameter must be a boolean",
          TravelModeErrorCode.INVALID_CONFIG
        );
      }

      const firestore = getFirestore();
      const ruleDocRef = doc(firestore, RULES_COLLECTION, uid);

      // Use Firestore transaction for atomic update
      await runTransaction(firestore, async (transaction) => {
        const ruleDoc = await transaction.get(ruleDocRef);

        if (!ruleDoc.exists()) {
          throw new TravelModeError(
            "Travel mode not configured. Please configure travel mode before toggling",
            TravelModeErrorCode.NOT_CONFIGURED
          );
        }

        const existingRule = ruleDoc.data() as Rule;
        const travelRules = getTravelModeRules(existingRule);

        if (travelRules.length === 0) {
          throw new TravelModeError(
            "Travel mode not configured. Please configure travel mode before toggling",
            TravelModeErrorCode.NOT_CONFIGURED
          );
        }

        // Update enabled field for all travel mode rules
        const transformations = existingRule.transformations.map(t => {
          if (t.name === TRAVEL_MODE_RULE_NAME) {
            return { ...t, enabled };
          }
          return t;
        });

        // Save updated rules
        transaction.set(ruleDocRef, prepareFirestoreData({
          uid,
          transformations
        }), { merge: true });
      });
    } catch (error) {
      this.handleFirestoreError(error, "toggle travel mode");
    }
  }
}
