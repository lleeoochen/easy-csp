import { Card, CardContent, CardHeader } from '@/components/common/card';
import { Switch } from '@/components/common/switch';
import { AlertTriangle } from "lucide-react";
import { useUpdateRule } from '@/hooks/api/useRules';
import { useCategoryMap } from '@/hooks/useCategoryMap';
import { RuleCondition, type RuleTransformation } from "@easy-csp/shared-types";
import { useRegularCategoryNameMap } from '@/hooks/api/useCSP';
import { useAccountsWithInfo } from '@/hooks/api/useAccounts';
import { useFunds } from '@/hooks/api/useFunds';

interface RulesListProps {
  rules: Array<{ transform: RuleTransformation; originalIndex: number }>;
  onRuleClick: (rule: RuleTransformation, originalIndex: number) => void;
}

export function RulesList({ rules, onRuleClick }: RulesListProps) {
  const updateRuleMutation = useUpdateRule();
  const categoryMap = useCategoryMap();
  const categoryNameMap = useRegularCategoryNameMap();
  const { data: accounts = [] } = useAccountsWithInfo();
  const { data: funds = [] } = useFunds();

  // Create account lookup map for O(1) access
  const accountMap = new Map(accounts.map(account => [account.id, account]));
  const fundMap = new Map(funds.map(fund => [fund.id, fund]));

  const handleToggleRule = (originalIndex: number, enabled: boolean) => {
    const ruleItem = rules.find(r => r.originalIndex === originalIndex);
    if (ruleItem) {
      updateRuleMutation.mutate({ ruleIndex: originalIndex, updatedRule: { ...ruleItem.transform, enabled } });
    }
  };

  const formatCriteria = (rule: RuleTransformation): string => {
    const criteria = rule.matchingCriteria;
    const parts: string[] = [];

    // Helper to format text conditions (contains/exact)
    const formatTextCondition = (condition: RuleCondition): string => {
      switch (condition) {
        case RuleCondition.Contains:
          return "contains";
        case RuleCondition.Equal:
          return "equals";
        case RuleCondition.Exact:
          return "is";
        case RuleCondition.GreaterThan:
          return ">";
        case RuleCondition.LessThan:
          return "<";
      }
    };

    if (criteria.name) {
      const conditionText = formatTextCondition(criteria.name.condition);
      parts.push(`Name ${conditionText} "${criteria.name.value}"`);
    }
    if (criteria.accountId) {
      const conditionText = formatTextCondition(criteria.accountId.condition);
      parts.push(`Account ${conditionText} "${accountMap.get(criteria.accountId.value)?.displayName}"`);
    }
    if (criteria.amount) {
      const conditionText = formatTextCondition(criteria.amount.condition);
      parts.push(`Amount ${conditionText} $${criteria.amount.value}`);
    }
    if (criteria.category) {
      const conditionText = formatTextCondition(criteria.category.condition);
      parts.push(`Category ${conditionText} "${categoryNameMap.get(criteria.category.value)}"`);
    }

    return parts.join(" and ");
  };

  const formatActions = (rule: RuleTransformation): string => {
    const actions: string[] = [];

    if (rule.action.changeCategory) {
      actions.push(`Set category to "${categoryNameMap.get(rule.action.changeCategory)}"`);
    }
    if (rule.action.toggleHidden !== undefined) {
      actions.push(rule.action.toggleHidden ? "Hide transaction" : "Show transaction");
    }
    if (rule.action.autoSplit) {
      actions.push(`Auto-split into ${rule.action.autoSplit.splitCount} (${rule.action.autoSplit.frequency})`);
    }
    if (rule.action.assignFund) {
      const fund = fundMap.get(rule.action.assignFund);
      actions.push(`Assign to fund "${fund?.name ?? 'Unknown Fund'}"`);
    }

    return actions.join("\n");
  };

  if (rules.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No transaction rules created yet.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Click "Add Rule" to create your first automated transaction rule.
        </p>
      </Card>
    );
  }

  // Group rules by whether they check transaction name
  const sortedRules = rules.sort((a, b) => a.transform.name.localeCompare(b.transform.name));

  const renderRuleRow = (rule: RuleTransformation, originalIndex: number) => {
    const hasStaleCategory = rule.action.changeCategory !== undefined
      && categoryMap[rule.action.changeCategory] === undefined;

    return (
      <div key={originalIndex}>
        <div
          className="flex items-center justify-between p-4 hover:bg-accent/50 cursor-pointer transition-colors"
          onClick={() => onRuleClick(rule, originalIndex)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h3 className="font-medium truncate">{rule.name}</h3>
              {hasStaleCategory && (
                <span className="flex items-center gap-1 text-xs text-amber-600 shrink-0">
                  <AlertTriangle size={12} />
                  Category no longer exists
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
              {formatActions(rule)}
            </div>
            <div className="text-sm text-gray-400 text-muted-foreground mt-1 whitespace-pre-wrap">
              Condition: {formatCriteria(rule)}
            </div>
          </div>
          <div className="ml-4 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={rule.enabled}
              onCheckedChange={(enabled) => handleToggleRule(originalIndex, enabled)}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Transaction Rules</h2>
          <p className="text-sm text-muted-foreground">Automatically applied when transactions are imported.</p>
        </CardHeader>
        <CardContent className="p-0! divide-y divide-gray-200">
          {sortedRules.map(({ transform: rule, originalIndex }) =>
            renderRuleRow(rule, originalIndex)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
