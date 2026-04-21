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
  type RuleTransformation,
  type Transaction,
  type RuleMatchingCriteria,
  RuleCondition
} from "@easy-csp/shared-types";
import { prepareFirestoreData } from '@/utils/firestoreHelpers';
import { AccountService } from "./accountService";

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

      await setDoc(ruleDocRef, prepareFirestoreData(ruleData));
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

  /**
   * Validates that a fund assignment rule references a valid fund account
   * Called when creating or updating rules with assignFund action
   * @param fundAccountId The fund account ID to validate
   * @returns Object with valid flag and optional error message
   */
  public static async validateFundAssignmentRule(
    fundAccountId: string
  ): Promise<{ valid: boolean; message?: string }> {
    try {
      // Get all accounts to find the referenced fund account
      const accounts = await AccountService.listAccounts();
      const fundAccount = accounts.find(acc => acc.id === fundAccountId);

      if (!fundAccount) {
        return { valid: false, message: "Fund account not found" };
      }

      if (!fundAccount.isFundAccount) {
        return { valid: false, message: "Referenced account is not a fund account" };
      }

      return { valid: true };
    } catch (error) {
      console.error("Error validating fund assignment rule:", error);
      return { valid: false, message: "Error validating fund account" };
    }
  }

  /**
   * Evaluates if a transaction matches the rule criteria
   * @param transaction The transaction to evaluate
   * @param criteria The matching criteria to check against
   * @returns True if the transaction matches all criteria
   */
  private static evaluateRuleCriteria(
    transaction: Transaction,
    criteria: RuleMatchingCriteria
  ): boolean {
    try {
      // Check name criteria
      if (criteria.name) {
        const nameMatch = criteria.name.condition === RuleCondition.Exact ?
          transaction.name === criteria.name.value :
          transaction.name.toLowerCase().includes(criteria.name.value.toLowerCase());
        if (!nameMatch) return false;
      }

      // Check accountId criteria
      if (criteria.accountId) {
        const accountMatch = criteria.accountId.condition === RuleCondition.Exact ?
          transaction.accountId === criteria.accountId.value :
          transaction.accountId.toLowerCase().includes(criteria.accountId.value.toLowerCase());
        if (!accountMatch) return false;
      }

      // Check amount criteria
      if (criteria.amount) {
        let amountMatch = false;
        switch (criteria.amount.condition) {
        case RuleCondition.Equal:
          amountMatch = Math.abs(transaction.amount - criteria.amount.value) < 0.01; // Handle floating point precision
          break;
        case RuleCondition.LessThan:
          amountMatch = transaction.amount < criteria.amount.value;
          break;
        case RuleCondition.GreaterThan:
          amountMatch = transaction.amount > criteria.amount.value;
          break;
        }
        if (!amountMatch) return false;
      }

      // Check category criteria
      if (criteria.category) {
        const categoryMatch = criteria.category.condition === RuleCondition.Exact ?
          transaction.category === criteria.category.value :
          transaction.category.toLowerCase().includes(criteria.category.value.toLowerCase());
        if (!categoryMatch) return false;
      }

      return true;
    } catch (error) {
      console.error("Error evaluating rule criteria:", error);
      return false;
    }
  }

  /**
   * Applies rules to a transaction (including fund assignment)
   * Returns the modified transaction with all rule actions applied
   * @param transaction The transaction to apply rules to
   * @param rules Array of rule transformations to evaluate
   * @returns Transaction with all applicable rules applied
   */
  public static applyRulesToTransaction(
    transaction: Transaction,
    rules: RuleTransformation[]
  ): Transaction {
    const modifiedTransaction = { ...transaction };

    try {
      // Process each enabled rule
      for (const rule of rules) {
        if (!rule.enabled) continue;

        // Check if rule matches transaction
        if (this.evaluateRuleCriteria(modifiedTransaction, rule.matchingCriteria)) {
          // Apply rule actions
          if (rule.action.changeCategory !== undefined) {
            modifiedTransaction.category = rule.action.changeCategory;
          }

          if (rule.action.toggleHidden !== undefined) {
            modifiedTransaction.hidden = rule.action.toggleHidden;
          }

          if (rule.action.assignFund !== undefined) {
            modifiedTransaction.allocatedFundId = rule.action.assignFund;
          }

          // Note: autoSplit is not applied in frontend - it's a backend-only action
        }
      }

      return modifiedTransaction;
    } catch (error) {
      console.error("Error applying rules to transaction:", error);
      return transaction; // Return original transaction if rule application fails
    }
  }
}