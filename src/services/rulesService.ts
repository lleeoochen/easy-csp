import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  RULES_COLLECTION,
  type Rule,
  type RuleTransformation
} from "@easy-csp/shared-types";
import { withoutUndefinedValue } from "../utils/firestoreHelpers";

export class RulesService {
  private static getAuthenticatedUserId(): string {
    const auth = getAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) {
      throw new Error("User not authenticated");
    }
    return uid;
  }

  /**
   * Gets the user's rules from Firestore
   */
  public static async getRules(): Promise<Rule | null> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();

      const ruleDocRef = doc(firestore, RULES_COLLECTION, uid);
      const ruleDoc = await getDoc(ruleDocRef);

      if (ruleDoc.exists()) {
        return ruleDoc.data() as Rule;
      }

      return null;
    } catch (error) {
      console.error("Error fetching rules:", error);
      throw error;
    }
  }

  /**
   * Creates or updates the user's rules document
   */
  public static async saveRules(transformations: RuleTransformation[]): Promise<void> {
    try {
      const uid = this.getAuthenticatedUserId();
      const firestore = getFirestore();

      const ruleDocRef = doc(firestore, RULES_COLLECTION, uid);
      const ruleData: Rule = {
        uid,
        transformations
      };

      await setDoc(ruleDocRef, withoutUndefinedValue(ruleData));
    } catch (error) {
      console.error("Error saving rules:", error);
      throw error;
    }
  }

  /**
   * Adds a new rule transformation
   */
  public static async addRule(newRule: RuleTransformation): Promise<void> {
    try {
      const existingRule = await this.getRules();
      const transformations = existingRule?.transformations || [];

      await this.saveRules([...transformations, newRule]);
    } catch (error) {
      console.error("Error adding rule:", error);
      throw error;
    }
  }

  /**
   * Updates an existing rule transformation by index
   */
  public static async updateRule(ruleIndex: number, updatedRule: RuleTransformation): Promise<void> {
    try {
      const existingRule = await this.getRules();
      if (!existingRule || !existingRule.transformations[ruleIndex]) {
        throw new Error("Rule not found");
      }

      const transformations = [...existingRule.transformations];
      transformations[ruleIndex] = updatedRule;

      await this.saveRules(transformations);
    } catch (error) {
      console.error("Error updating rule:", error);
      throw error;
    }
  }

  /**
   * Deletes a rule transformation by index
   */
  public static async deleteRule(ruleIndex: number): Promise<void> {
    try {
      const existingRule = await this.getRules();
      if (!existingRule || !existingRule.transformations[ruleIndex]) {
        throw new Error("Rule not found");
      }

      const transformations = existingRule.transformations.filter((_, index) => index !== ruleIndex);

      await this.saveRules(transformations);
    } catch (error) {
      console.error("Error deleting rule:", error);
      throw error;
    }
  }

  /**
   * Reorders rules by moving a rule from one index to another
   */
  public static async reorderRules(fromIndex: number, toIndex: number): Promise<void> {
    try {
      const existingRule = await this.getRules();
      if (!existingRule) {
        throw new Error("No rules found");
      }

      const transformations = [...existingRule.transformations];
      const [movedRule] = transformations.splice(fromIndex, 1);
      transformations.splice(toIndex, 0, movedRule);

      await this.saveRules(transformations);
    } catch (error) {
      console.error("Error reordering rules:", error);
      throw error;
    }
  }
}