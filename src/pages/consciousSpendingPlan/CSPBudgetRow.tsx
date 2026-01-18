import { useState } from "react";
import { Progress } from "../../components/common/progress";
import type { CSPCategoryBudget, CSPBucket } from "@easy-csp/shared-types";
import { camelCaseToSentence } from "../../utils/stringUtils";
import { formatCurrency } from "../../utils/financialUtils";
import { cn } from "../../components/common/utils";
import { useAppSelector } from "../../hooks/useRedux";
import { CSPBudgetEditDialog } from "./CSPBudgetEditDialog";

interface CSPBudgetRowProps {
  budget: CSPCategoryBudget;
  categorySpending: Record<string, number>
  isSavingsBucket: boolean;
  bucket: CSPBucket;
}

export const CSPBudgetRow = ({ budget, categorySpending, isSavingsBucket, bucket }: CSPBudgetRowProps) => {
  const savingTargets = useAppSelector(state => state.savingTargets.savingTargets);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  let categoryName = budget.category;
  if (isSavingsBucket) {
    const savingTargetsMap = new Map<string, string>(
      savingTargets.map(savingTarget => [savingTarget.id, savingTarget.name])
    );
    categoryName = savingTargetsMap.get(budget.category);
  }

  const spendingAmount = categorySpending[budget.category];
  const budgetAmount = budget.amount;
  const amountLeft = budgetAmount - spendingAmount;
  const isOverBudget = spendingAmount > budgetAmount;

  const handleRowClick = () => {
    setIsEditDialogOpen(true);
  };

  return (
    <div className="px-4 py-2">
      <div
        key={budget.category}
        className="flex justify-between items-center active:bg-accent/50 cursor-pointer hover:bg-accent/20"
        onClick={handleRowClick}
      >
        <div className="grow shrink basis-2/3 font-medium text-md truncate">{camelCaseToSentence(categoryName)}</div>
        <Progress
          className="bg-gray-200 grow shrink basis-1/3"
          value={Math.min(spendingAmount / budgetAmount * 100, 100)}
          activeColorClass={cn("bg-cardHeader", { "bg-red-400": isOverBudget })} />
      </div>
      <div className="flex justify-between">
        <div className="text-gray-400 text-sm">
          Budget: {formatCurrency(budgetAmount)}
        </div>
        <div className={cn("text-gray-400 text-sm", { "text-red-400": isOverBudget })}>
          {
            amountLeft >= 0
              ? formatCurrency(amountLeft) + " left"
              : formatCurrency(Math.abs(amountLeft)) + " over"
          }
        </div>
      </div>

      <CSPBudgetEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        budget={budget}
        bucket={bucket}
        categoryName={categoryName}
      />
    </div>
  );
}
