import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Page } from "../../components/Page";
import { Card, CardHeader, CardContent } from "../../components/common/card";
import { DialogActionPanel } from "../../components/common/DialogActionPanel";
import { Input } from "../../components/common/input";
import { Select } from "../../components/common/select";
import { Label } from "../../components/common/label";
import { Switch } from "../../components/common/switch";
import { CategorySelector } from "../../components/common/CategorySelector";
import type { RuleTransformation, RuleMatchingCriteria, RuleAction } from "@easy-csp/shared-types";
import { CSPCategory, RuleCondition, SplitFrequency } from "@easy-csp/shared-types";
import { useRules, useAddRule, useUpdateRule, useDeleteRule } from "../../hooks/api/useRules";
import { cn } from "../../components/common/utils";
import { AccountSelector } from "../../components/common/AccountSelector";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/common/button";
import { FundAccountDropdown } from "../../components/FundAccountDropdown";
import { RulesService } from "../../services/rulesService";

const RuleEditPage = () => {
  const { index } = useParams<{ index: string }>();
  const navigate = useNavigate();
  const isCreateMode = index === 'new';
  const ruleIndex = isCreateMode ? null : parseInt(index!, 10);

  const { data: rulesData, isLoading: loadingRules } = useRules();
  const rules = rulesData?.transformations || [];
  const addRuleMutation = useAddRule();
  const updateRuleMutation = useUpdateRule();
  const deleteRuleMutation = useDeleteRule();
  const [isLoading, setIsLoading] = useState(false);

  const rule = isCreateMode ? null : (rules && ruleIndex !== null ? rules[ruleIndex] : null);

  // Form state
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(true);

  // Criteria state
  const [nameValue, setNameValue] = useState("");
  const [nameCondition, setNameCondition] = useState<RuleCondition.Contains | RuleCondition.Exact>(RuleCondition.Contains);
  const [nameEnabled, setNameEnabled] = useState(false);

  const [accountEnabled, setAccountEnabled] = useState(false);
  const [selectedAccountOption, setSelectedAccountOption] = useState("");

  const [amountValue, setAmountValue] = useState("");
  const [amountCondition, setAmountCondition] = useState<RuleCondition.LessThan | RuleCondition.GreaterThan | RuleCondition.Equal>(RuleCondition.Equal);
  const [amountEnabled, setAmountEnabled] = useState(false);

  const [categoryValue, setCategoryValue] = useState("");
  const [categoryEnabled, setCategoryEnabled] = useState(false);

  // Action state
  const [changeCategoryEnabled, setChangeCategoryEnabled] = useState(false);
  const [changeCategoryValue, setChangeCategoryValue] = useState<string>(CSPCategory.Miscellaneous);
  const [toggleHiddenEnabled, setToggleHiddenEnabled] = useState(false);
  const [toggleHiddenValue, setToggleHiddenValue] = useState(false);
  const [autoSplitEnabled, setAutoSplitEnabled] = useState(false);
  const [autoSplitCount, setAutoSplitCount] = useState(2);
  const [autoSplitFrequency, setAutoSplitFrequency] = useState<SplitFrequency>(SplitFrequency.Monthly);
  const [assignFundEnabled, setAssignFundEnabled] = useState(false);
  const [assignFundValue, setAssignFundValue] = useState<string>("");

  // Reset form when rule changes
  useEffect(() => {
    if (rule) {
      setName(rule.name);
      setEnabled(rule.enabled);

      // Set criteria
      setNameEnabled(!!rule.matchingCriteria.name);
      setNameValue(rule.matchingCriteria.name?.value || "");
      setNameCondition(rule.matchingCriteria.name?.condition || RuleCondition.Contains);

      const hasAccount = !!rule.matchingCriteria.accountId;
      setAccountEnabled(hasAccount);
      setSelectedAccountOption(
        hasAccount
          ? rule.matchingCriteria.accountId!.value
          : ""
      );

      setAmountEnabled(!!rule.matchingCriteria.amount);
      setAmountValue(rule.matchingCriteria.amount?.value.toString() || "");
      setAmountCondition(rule.matchingCriteria.amount?.condition || RuleCondition.Equal);

      setCategoryEnabled(!!rule.matchingCriteria.category);
      setCategoryValue(rule.matchingCriteria.category?.value || "");

      // Set actions
      setChangeCategoryEnabled(!!rule.action.changeCategory);
      setChangeCategoryValue(rule.action.changeCategory || CSPCategory.Miscellaneous);
      setToggleHiddenEnabled(rule.action.toggleHidden !== undefined);
      setToggleHiddenValue(rule.action.toggleHidden || false);
      setAutoSplitEnabled(!!rule.action.autoSplit);
      setAutoSplitCount(rule.action.autoSplit?.splitCount ?? 2);
      setAutoSplitFrequency(rule.action.autoSplit?.frequency ?? SplitFrequency.Monthly);
      setAssignFundEnabled(!!rule.action.assignFund);
      setAssignFundValue(rule.action.assignFund || "");
    } else if (isCreateMode) {
      // Reset to defaults for new rule
      setName("");
      setEnabled(true);
      setNameEnabled(false);
      setNameValue("");
      setNameCondition(RuleCondition.Contains);
      setAccountEnabled(false);
      setSelectedAccountOption("");
      setAmountEnabled(false);
      setAmountValue("");
      setAmountCondition(RuleCondition.Equal);
      setCategoryEnabled(false);
      setCategoryValue("");
      setChangeCategoryEnabled(false);
      setChangeCategoryValue(CSPCategory.Miscellaneous);
      setToggleHiddenEnabled(false);
      setToggleHiddenValue(false);
      setAutoSplitEnabled(false);
      setAutoSplitCount(2);
      setAutoSplitFrequency(SplitFrequency.Monthly);
      setAssignFundEnabled(false);
      setAssignFundValue("");
    }
  }, [rule, isCreateMode]);

  const buildCriteria = (): RuleMatchingCriteria => {
    const criteria: RuleMatchingCriteria = {};

    if (nameEnabled && nameValue) {
      criteria.name = { value: nameValue, condition: nameCondition };
    }
    if (accountEnabled && selectedAccountOption) {
      criteria.accountId = { value: selectedAccountOption, condition: RuleCondition.Exact };
    }
    if (amountEnabled && amountValue) {
      criteria.amount = { value: parseFloat(amountValue), condition: amountCondition };
    }
    if (categoryEnabled && categoryValue) {
      criteria.category = { value: categoryValue, condition: RuleCondition.Exact };
    }

    return criteria;
  };

  const buildAction = (): RuleAction => {
    const action: RuleAction = {};

    if (changeCategoryEnabled) {
      action.changeCategory = changeCategoryValue;
    }
    if (toggleHiddenEnabled) {
      action.toggleHidden = toggleHiddenValue;
    }
    if (autoSplitEnabled) {
      action.autoSplit = { splitCount: autoSplitCount, frequency: autoSplitFrequency };
    }
    if (assignFundEnabled && assignFundValue) {
      action.assignFund = assignFundValue;
    }

    return action;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Please enter a rule name");
      return;
    }

    const criteria = buildCriteria();
    const action = buildAction();

    // Validate that at least one criteria is set
    if (Object.keys(criteria).length === 0) {
      alert("Please set at least one matching criteria");
      return;
    }

    // Validate that at least one action is set
    if (Object.keys(action).length === 0) {
      alert("Please set at least one action");
      return;
    }

    // Validate fund assignment if enabled
    if (assignFundEnabled && assignFundValue) {
      const validation = await RulesService.validateFundAssignmentRule(assignFundValue);
      if (!validation.valid) {
        alert(`Invalid fund account: ${validation.message}`);
        return;
      }
    }

    setIsLoading(true);
    try {
      const ruleData: RuleTransformation = {
        name: name.trim(),
        enabled,
        matchingCriteria: criteria,
        action
      };

      if (ruleIndex !== null) {
        await updateRuleMutation.mutateAsync({ ruleIndex, updatedRule: ruleData });
      } else {
        await addRuleMutation.mutateAsync(ruleData);
      }

      navigate('/rules');
    } catch (error) {
      console.error('Error saving rule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (ruleIndex === null) return;

    setIsLoading(true);
    try {
      await deleteRuleMutation.mutateAsync(ruleIndex);
      navigate('/rules');
    } catch (error) {
      console.error('Error deleting rule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingRules) {
    return (
      <Page maxWidth="cozy">
        <div className="animate-pulse">Loading...</div>
      </Page>
    );
  }

  if (!isCreateMode && !rule) {
    return (
      <Page maxWidth="cozy">
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Rule not found</p>
          <Button
            variant="secondary"
            onClick={() => navigate('/rules')}
            className="text-primary-fg hover:text-primary-fg/80"
          >
            Back to Rules
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <>
      <Page maxWidth="cozy" title={isCreateMode ? "Create Rule" : "Edit Rule"}>
        {/* Header with back button */}
        <div className="mb-6">
          <Button
            variant="secondary"
            onClick={() => navigate('/rules')}
            className="flex items-center gap-2 text-primary-fg hover:text-primary-fg/80 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back to Rules</span>
          </Button>
        </div>

        <div className="space-y-2">
          {/* Rule Basic Info */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">
                {isCreateMode ? 'Create Transaction Rule' : rule!.name}
              </h2>
            </CardHeader>
            <CardContent className="space-y-4 py-4">
              <div>
                <Label htmlFor="rule-name" className="text-sm font-medium text-gray-700">Rule Name</Label>
                <Input
                  id="rule-name"
                  className="w-full mt-1"
                  placeholder="e.g., Hide ATM fees"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Matching Criteria */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Matching Criteria</h3>
            </CardHeader>
            <CardContent className="space-y-4 py-4">
              {/* Name Criteria */}
              <div className="flex flex-col items-start gap-2">
                <div className="flex flex-row justify-between w-full">
                  <Label className={cn({ "text-gray-300": !nameEnabled })}>Name</Label>
                  <Switch checked={nameEnabled} onCheckedChange={setNameEnabled} />
                </div>
                <div className={cn("flex flex-row gap-2 w-full", { "hidden": !nameEnabled })}>
                  <Select
                    options={[
                      { value: RuleCondition.Contains, label: "Contains" },
                      { value: RuleCondition.Exact, label: "=" }
                    ]}
                    value={nameCondition}
                    onValueChange={(value) => setNameCondition(value as RuleCondition.Contains | RuleCondition.Exact)}
                    isDisabled={!nameEnabled}
                  />
                  <Input
                    placeholder="Transaction name"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    disabled={!nameEnabled}
                    className="flex-1 w-40"
                  />
                </div>
              </div>

              {/* Account Criteria */}
              <div className="flex flex-col items-start gap-2">
                <div className="flex flex-row gap-2 justify-between w-full">
                  <Label className={cn({ "text-gray-300": !accountEnabled })}>Account</Label>
                  <Switch checked={accountEnabled} onCheckedChange={setAccountEnabled} />
                </div>
                <div className={cn("w-full", { "hidden": !accountEnabled })}>
                  <AccountSelector
                    value={selectedAccountOption}
                    onValueChange={setSelectedAccountOption}
                    disabled={!accountEnabled}
                    label=""
                  />
                </div>
              </div>

              {/* Amount Criteria */}
              <div className="flex flex-col items-start gap-2">
                <div className="flex flex-row gap-2 justify-between w-full">
                  <Label className={cn({ "text-gray-300": !amountEnabled })}>Amount</Label>
                  <Switch checked={amountEnabled} onCheckedChange={setAmountEnabled} />
                </div>
                <div className={cn("flex flex-row gap-2 w-full", { "hidden": !amountEnabled })}>
                  <Select
                    options={[
                      { value: RuleCondition.LessThan, label: "<" },
                      { value: RuleCondition.GreaterThan, label: ">" },
                      { value: RuleCondition.Equal, label: "=" }
                    ]}
                    value={amountCondition}
                    onValueChange={(value) => setAmountCondition(value as RuleCondition.LessThan | RuleCondition.GreaterThan | RuleCondition.Equal)}
                    isDisabled={!amountEnabled}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amountValue}
                    onChange={(e) => setAmountValue(e.target.value)}
                    disabled={!amountEnabled}
                    className="flex-1 w-40"
                  />
                </div>
              </div>

              {/* Category Criteria */}
              <div className="flex flex-col items-start gap-2">
                <div className="flex flex-row gap-2 justify-between w-full">
                  <Label className={cn({ "text-gray-300": !categoryEnabled })}>Category</Label>
                  <Switch checked={categoryEnabled} onCheckedChange={setCategoryEnabled} />
                </div>
                <div className={cn("flex flex-row gap-2 w-full", { "hidden": !categoryEnabled })}>
                  <CategorySelector
                    value={categoryValue}
                    onValueChange={setCategoryValue}
                    disabled={!categoryEnabled}
                    label=""
                    placeholder="Select a category"
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Actions</h3>
            </CardHeader>
            <CardContent className="py-4 space-y-4">
              {/* Change Category Action */}
              <div className="flex flex-col items-start gap-2">
                <div className="flex flex-row gap-2 justify-between w-full">
                  <Label className={cn({ "text-gray-300": !changeCategoryEnabled })}>Change Category to</Label>
                  <Switch checked={changeCategoryEnabled} onCheckedChange={setChangeCategoryEnabled} />
                </div>
                <div className={cn("flex flex-row gap-2 w-full", { "hidden": !changeCategoryEnabled })}>
                  <CategorySelector
                    value={changeCategoryValue}
                    onValueChange={(value) => setChangeCategoryValue(value)}
                    disabled={!changeCategoryEnabled}
                    label=""
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Toggle Hidden Action */}
              <div className="flex flex-col items-start gap-2">
                <div className="flex flex-row gap-2 justify-between w-full">
                  <Label className={cn({ "text-gray-300": !toggleHiddenEnabled })}>Set Hidden Status</Label>
                  <Switch checked={toggleHiddenEnabled} onCheckedChange={setToggleHiddenEnabled} />
                </div>
                <div className={cn("flex flex-row gap-2 w-full", { "hidden": !toggleHiddenEnabled })}>
                  <Select
                    options={[
                      { value: "true", label: "Hide transaction" },
                      { value: "false", label: "Show transaction" }
                    ]}
                    value={toggleHiddenValue.toString()}
                    onValueChange={(value) => setToggleHiddenValue(value === "true")}
                    isDisabled={!toggleHiddenEnabled}
                  />
                </div>
              </div>

              {/* Auto Split Action */}
              <div className="flex flex-col items-start gap-2">
                <div className="flex flex-row gap-2 justify-between w-full">
                  <Label className={cn({ "text-gray-300": !autoSplitEnabled })}>Auto Split</Label>
                  <Switch checked={autoSplitEnabled} onCheckedChange={setAutoSplitEnabled} />
                </div>
                <div className={cn("flex flex-row gap-2 w-full", { "hidden": !autoSplitEnabled })}>
                  <Select
                    options={Array.from({ length: 11 }, (_, i) => ({
                      value: String(i + 2),
                      label: `${i + 2} splits`
                    }))}
                    value={String(autoSplitCount)}
                    onValueChange={(value) => setAutoSplitCount(Number(value))}
                    isDisabled={!autoSplitEnabled}
                  />
                  <Select
                    options={[
                      { value: SplitFrequency.Weekly, label: "Weekly" },
                      { value: SplitFrequency.Monthly, label: "Monthly" },
                      { value: SplitFrequency.Yearly, label: "Yearly" }
                    ]}
                    value={autoSplitFrequency}
                    onValueChange={(value) => setAutoSplitFrequency(value as SplitFrequency)}
                    isDisabled={!autoSplitEnabled}
                  />
                </div>
              </div>

              {/* Assign Fund Action */}
              <div className="flex flex-col items-start gap-2">
                <div className="flex flex-row gap-2 justify-between w-full">
                  <Label className={cn({ "text-gray-300": !assignFundEnabled })}>Assign to Fund</Label>
                  <Switch checked={assignFundEnabled} onCheckedChange={setAssignFundEnabled} />
                </div>
                <div className={cn("w-full", { "hidden": !assignFundEnabled })}>
                  <FundAccountDropdown
                    value={assignFundValue}
                    onValueChange={(value) => setAssignFundValue(value || "")}
                    label=""
                    disabled={!assignFundEnabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action buttons - Fixed at bottom on mobile */}
        <Card className="bg-white p-4 mt-2">
          <DialogActionPanel
            cancel={{
              label: 'Cancel',
              onClick: () => navigate('/rules'),
              disabled: isLoading
            }}
            submit={{
              label: isLoading ? 'Saving...' : (isCreateMode ? 'Create' : 'Update'),
              onClick: handleSave,
              disabled: isLoading
            }}
            delete={!isCreateMode ? {
              label: 'Delete',
              onClick: handleDelete,
              disabled: isLoading,
              confirmation: {
                title: 'Delete Rule',
                message: 'Are you sure you want to delete this rule?'
              }
            } : undefined}
            isLoading={isLoading}
          />
        </Card>

        {/* Spacer for fixed button on mobile */}
        <div className="h-20 md:hidden" />
      </Page>
    </>
  );
};

export default RuleEditPage;
