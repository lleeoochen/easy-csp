import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/common/dialog";
import { Button } from "../../components/common/button";
import { Input } from "../../components/common/input";
import { Select } from "../../components/common/select";
import { Label } from "../../components/common/label";
import { Switch } from "../../components/common/switch";
import { Card, CardContent, CardHeader } from "../../components/common/card";
import { CategorySelector } from "../../components/common/CategorySelector";
import type { RuleTransformation, RuleMatchingCriteria, RuleAction } from "@easy-csp/shared-types";
import { CSPCategory, RuleCondition, SplitFrequency } from "@easy-csp/shared-types";
import { useAddRule, useUpdateRule } from "../../hooks/api/useRules";
import { cn } from "../../components/common/utils";
import { generateAccountOptionValue, parseAccountOptionValue } from "../../utils/accountUtils";
import { AccountSelector } from "../../components/common/AccountSelector";

interface RuleEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: RuleTransformation | null;
  ruleIndex: number | null;
}

export const RuleEditDialog = ({ open, onOpenChange, rule, ruleIndex }: RuleEditDialogProps) => {
  const addRuleMutation = useAddRule();
  const updateRuleMutation = useUpdateRule();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(true);

  // Criteria state
  const [nameValue, setNameValue] = useState("");
  const [nameCondition, setNameCondition] = useState<RuleCondition.Contains | RuleCondition.Exact>(RuleCondition.Contains);
  const [nameEnabled, setNameEnabled] = useState(false);

  // Combined institution+account selector (encodes as "institutionId-accountId")
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

  // Reset form when dialog opens/closes or rule changes
  useEffect(() => {
    if (rule) {
      setName(rule.name);
      setEnabled(rule.enabled);

      // Set criteria
      setNameEnabled(!!rule.matchingCriteria.name);
      setNameValue(rule.matchingCriteria.name?.value || "");
      setNameCondition(rule.matchingCriteria.name?.condition || RuleCondition.Contains);

      const hasAccount = !!rule.matchingCriteria.institutionId || !!rule.matchingCriteria.accountId;
      setAccountEnabled(hasAccount);
      setSelectedAccountOption(
        hasAccount
          ? generateAccountOptionValue(
              rule.matchingCriteria.institutionId?.value || "",
              rule.matchingCriteria.accountId?.value || ""
            )
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
    } else {
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
    }
  }, [rule]);

  const buildCriteria = (): RuleMatchingCriteria => {
    const criteria: RuleMatchingCriteria = {};

    if (nameEnabled && nameValue) {
      criteria.name = { value: nameValue, condition: nameCondition };
    }
    if (accountEnabled && selectedAccountOption) {
      const { institutionId, accountId } = parseAccountOptionValue(selectedAccountOption);
      if (institutionId) criteria.institutionId = { value: institutionId, condition: RuleCondition.Exact };
      if (accountId) criteria.accountId = { value: accountId, condition: RuleCondition.Exact };
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

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving rule:', error);
      // TODO: Show error toast/notification
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle>
            {ruleIndex !== null ? "Edit Transaction Rule" : "Create Transaction Rule"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {/* Rule Basic Info */}
          <Card>
            <CardHeader className="text-lg">
              Rule Name
            </CardHeader>
            <CardContent className="space-y-4 py-4">
              <Input
                id="rule-name"
                className="w-full"
                placeholder="e.g., Hide ATM fees"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Matching Criteria */}
          <Card>
            <CardHeader className="text-lg">Matching Criteria</CardHeader>
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

              {/* Account Criteria (institution + account combined) */}
              <div className="flex flex-col items-start gap-2">
                <div className="flex flex-row gap-2 justify-between w-full">
                  <Label className={cn({ "text-gray-300": !accountEnabled })}>Account</Label>
                  <Switch checked={accountEnabled} onCheckedChange={setAccountEnabled} />
                </div>
                <div className={cn("w-full", { "hidden": !accountEnabled })}>
                  <AccountSelector
                    value={selectedAccountOption}
                    onChange={setSelectedAccountOption}
                    disabled={!accountEnabled}
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
            <CardHeader className="text-lg">Actions</CardHeader>
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
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : ruleIndex !== null ? 'Update Rule' : 'Create Rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};