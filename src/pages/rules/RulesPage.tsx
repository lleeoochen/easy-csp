import { Page } from '@/components/Page';
import { useNavigate } from "react-router-dom";
import { useRules } from '@/hooks/api/useRules';
import { RulesList } from "./RulesList";
import { Button } from '@/components/common/button';
import { BackButton } from '@/components/common/BackButton';
import { TRAVEL_MODE_RULE_NAME } from '@/types/travelMode';

const RulesPage = () => {
  const navigate = useNavigate();
  const { data: rulesDoc, isLoading, error, refetch } = useRules();
  const transformations = (rulesDoc?.transformations ?? []).filter(
    transform => transform.name != TRAVEL_MODE_RULE_NAME);

  const handleRuleClick = (_rule: unknown, index: number) => {
    navigate(`/rules/${index}/edit`);
  };

  const handleAddRule = () => {
    navigate('/rules/new/edit');
  };

  return (
    <Page title="Transaction Rules" maxWidth="full">
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
      </div>
    </Page>
  );
};

export default RulesPage;
