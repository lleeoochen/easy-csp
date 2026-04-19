# RulesService Usage Guide - Fund Assignment

This document explains how to use the new fund assignment methods in the RulesService.

## New Methods

### 1. validateFundAssignmentRule

Validates that a fund assignment rule references a valid fund account. Use this when creating or editing rules with `assignFund` action.

```typescript
import { RulesService } from './services/rulesService';

// When creating/editing a rule with assignFund action
const fundAccountId = 'fund-account-123';
const validation = await RulesService.validateFundAssignmentRule(fundAccountId);

if (validation.valid) {
  // Proceed with saving the rule
  console.log('Fund account is valid');
} else {
  // Show error to user
  console.error(validation.message);
  // Possible messages:
  // - "Fund account not found"
  // - "Referenced account is not a fund account"
  // - "Error validating fund account"
}
```

### 2. applyRulesToTransaction

Applies rules to a transaction (including fund assignment) during UI transaction categorization. This method evaluates all enabled rules and applies matching actions.

```typescript
import { RulesService } from './services/rulesService';
import type { Transaction, RuleTransformation } from '@easy-csp/shared-types';

// Get user's rules
const rulesDoc = await RulesService.getRules();
const rules: RuleTransformation[] = rulesDoc?.transformations || [];

// Apply rules to a transaction
const transaction: Transaction = {
  id: 'txn-123',
  uid: 'user-123',
  accountId: 'account-456',
  name: 'Grocery Store',
  amount: -85.50,
  datetime: Date.now(),
  plaidCategory: 'Food and Drink',
  category: 'groceries',
  hidden: false,
};

const modifiedTransaction = RulesService.applyRulesToTransaction(transaction, rules);

// modifiedTransaction now has:
// - Updated category (if rule matched with changeCategory action)
// - Updated hidden status (if rule matched with toggleHidden action)
// - Updated allocatedFundId (if rule matched with assignFund action)
```

## Integration Examples

### Example 1: Transaction Tagging Modal

When a user tags a transaction in the UI, apply rules before saving:

```typescript
import { RulesService } from './services/rulesService';
import { TransactionsService } from './services/transactionsService';

async function handleTransactionTag(transactionId: string, updates: Partial<Transaction>) {
  // Get user's rules
  const rulesDoc = await RulesService.getRules();
  const rules = rulesDoc?.transformations || [];

  // Get the transaction
  const transaction = await TransactionsService.getTransaction(transactionId);
  if (!transaction) return;

  // Merge user updates with transaction
  const updatedTransaction = { ...transaction, ...updates };

  // Apply rules to the updated transaction
  const finalTransaction = RulesService.applyRulesToTransaction(updatedTransaction, rules);

  // Save the transaction with rule-applied changes
  await TransactionsService.updateTransaction(transactionId, {
    category: finalTransaction.category,
    hidden: finalTransaction.hidden,
    allocatedFundId: finalTransaction.allocatedFundId,
  });
}
```

### Example 2: Rule Creation Form

When creating a rule with fund assignment, validate the fund account:

```typescript
import { RulesService } from './services/rulesService';
import type { RuleTransformation } from '@easy-csp/shared-types';

async function handleCreateRule(newRule: RuleTransformation) {
  // If rule has assignFund action, validate it
  if (newRule.action.assignFund) {
    const validation = await RulesService.validateFundAssignmentRule(
      newRule.action.assignFund
    );

    if (!validation.valid) {
      // Show error to user
      alert(`Invalid fund account: ${validation.message}`);
      return;
    }
  }

  // Validation passed, save the rule
  await RulesService.addRule(newRule);
}
```

### Example 3: Bulk Transaction Processing

Apply rules to multiple transactions:

```typescript
import { RulesService } from './services/rulesService';
import { TransactionsService } from './services/transactionsService';

async function applyRulesToAllTransactions() {
  // Get user's rules
  const rulesDoc = await RulesService.getRules();
  const rules = rulesDoc?.transformations || [];

  // Get all transactions
  const response = await TransactionsService.listTransactions();
  const transactions = response.transactions;

  // Apply rules to each transaction
  for (const transaction of transactions) {
    const modifiedTransaction = RulesService.applyRulesToTransaction(transaction, rules);

    // Only update if something changed
    if (
      modifiedTransaction.category !== transaction.category ||
      modifiedTransaction.hidden !== transaction.hidden ||
      modifiedTransaction.allocatedFundId !== transaction.allocatedFundId
    ) {
      await TransactionsService.updateTransaction(transaction.id, {
        category: modifiedTransaction.category,
        hidden: modifiedTransaction.hidden,
        allocatedFundId: modifiedTransaction.allocatedFundId,
      });
    }
  }
}
```

## Rule Matching Behavior

The `applyRulesToTransaction` method:

1. Processes rules in order (first to last)
2. Only evaluates enabled rules (`enabled: true`)
3. Checks if transaction matches all criteria in `matchingCriteria`
4. If matched, applies all actions in the rule's `action` object
5. **Last matching rule wins** - if multiple rules match and set the same field, the last one takes precedence

### Supported Actions

- `changeCategory`: Changes the transaction category
- `toggleHidden`: Sets the hidden status
- `assignFund`: Sets the allocatedFundId (fund assignment)
- `autoSplit`: **Not applied in frontend** - this is a backend-only action

## Error Handling

Both methods handle errors gracefully:

- `validateFundAssignmentRule`: Returns `{ valid: false, message: string }` on error
- `applyRulesToTransaction`: Returns the original transaction unchanged on error

Errors are logged to console for debugging.

## Requirements Satisfied

This implementation satisfies:
- **Requirement 5.3**: Validate fund account when creating/editing rules with assignFund action
- **Requirement 5.4**: Apply fund assignment rules during UI transaction categorization
