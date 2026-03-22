import { Page } from "../../components/Page";
import { useState } from "react";
import { useRules } from "../../hooks/api/useRules";
import { RulesList } from "./RulesList";
import { RuleEditDialog } from "./RuleEditDialog";
import { Button } from "../../components/common/button";
import { BackButton } from "../../components/common/BackButton";
import type { RuleTransformation } from "@easy-csp/shared-types";

const RulesPage = () => {
  const { data: rulesDoc, isLoading, error, refetch } = useRules();
  const transformations = rulesDoc?.transformations ?? [];

  const [selectedRule, setSelectedRule] = useState<RuleTransformation | null>(null);
  const [selectedRuleIndex, setSelectedRuleIndex] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleRuleClick = (rule: RuleTransformation, index: number) => {
    setSelectedRule(rule);
    setSelectedRuleIndex(index);
    setIsEditDialogOpen(true);
  };

  const handleAddRule = () => {
    setSelectedRule(null);
    setSelectedRuleIndex(null);
    setIsEditDialogOpen(true);
  };

  return (
    <Page title="Transaction Rules">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <BackButton to="/settings" />
          <Button variant="primary" onClick={handleAddRule} className="flex items-center gap-2">
            Add Rule
          </Button>
        </div>

        {isLoading && <div className="animate-pulse">Loading rules...</div>}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">Error loading rules: {error.message}</p>
            <button onClick={() => refetch()} className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
              Try Again
            </button>
          </div>
        )}

        <RulesList rules={transformations} onRuleClick={handleRuleClick} />

        <RuleEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          rule={selectedRule}
          ruleIndex={selectedRuleIndex}
        />
      </div>
    </Page>
  );
};

export default RulesPage;
