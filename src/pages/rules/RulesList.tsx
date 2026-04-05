import { Card, CardContent, CardHeader } from "../../components/common/card";
import { Switch } from "../../components/common/switch";
import { AlertTriangle } from "lucide-react";
import { useUpdateRule } from "../../hooks/api/useRules";
import { useCategoryMap } from "../../hooks/useCategoryMap";
import type { RuleTransformation } from "@easy-csp/shared-types";
import { useRegularCategoryNameMap } from "../../hooks/api/useCSP";

interface RulesListProps {
  rules: RuleTransformation[];
  onRuleClick: (rule: RuleTransformation, index: number) => void;
}

export function RulesList({ rules, onRuleClick }: RulesListProps) {
  const updateRuleMutation = useUpdateRule();
  const categoryMap = useCategoryMap();
  const categoryNameMap = useRegularCategoryNameMap();

  const handleToggleRule = (ruleIndex: number, enabled: boolean) => {
    const rule = rules[ruleIndex];
    if (rule) {
      updateRuleMutation.mutate({ ruleIndex, updatedRule: { ...rule, enabled } });
    }
  };

  const formatCriteria = (rule: RuleTransformation): string => {
    const criteria = rule.matchingCriteria;
    const parts: string[] = [];

    if (criteria.name) {
      parts.push(`Name ${criteria.name.condition} "${criteria.name.value}"`);
    }
    if (criteria.institutionId) {
      parts.push(`Institution ${criteria.institutionId.condition} "${criteria.institutionId.value}"`);
    }
    if (criteria.accountId) {
      parts.push(`Account ${criteria.accountId.condition} "${criteria.accountId.value}"`);
    }
    if (criteria.amount) {
      const symbol = criteria.amount.condition === 'lessThan' ? '<' :
                     criteria.amount.condition === 'greaterThan' ? '>' : '=';
      parts.push(`Amount ${symbol} $${criteria.amount.value}`);
    }
    if (criteria.category) {
      parts.push(`Category ${criteria.category.condition} "${categoryNameMap.get(criteria.category.value)}"`);
    }

    return parts.join(" AND ");
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

  return (
    <div className="space-y-3">
      {rules.map((rule, index) => {
        const hasStaleCategory = rule.action.changeCategory !== undefined
          && categoryMap[rule.action.changeCategory] === undefined;

        return (
          <div key={index} className="flex items-stretch gap-2" onClick={() => onRuleClick(rule, index)}>
            <Card key={index} className="flex-1">
              <CardHeader className="flex justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="font-medium">{rule.name}</h3>
                    {hasStaleCategory && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                        <AlertTriangle size={12} />
                        Category no longer exists in your CSP
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 justify-between">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(enabled) => handleToggleRule(index, enabled)}
                  />
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between px-4 py-2">
                <div className="flex-1 space-y-2">
                  <div className="grid columns-2 text-sm">
                    <div className="font-bold">
                      Condition
                    </div>
                    <span>{formatCriteria(rule)}</span>
                    <div className="mt-2 font-bold">
                      Action
                    </div>
                    <span className="whitespace-pre-wrap">{formatActions(rule)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}