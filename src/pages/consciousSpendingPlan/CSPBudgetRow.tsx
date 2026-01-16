import { Progress } from "../../components/common/progress";
import type { CSPCategoryBudget } from "@easy-csp/shared-types";
import { camelCaseToSentence } from "../../utils/stringUtils";
import { formatCurrency } from "../../utils/financialUtils";
import { cn } from "../../components/common/utils";

interface CSPBudgetRowProps {
  budget: CSPCategoryBudget;
  categorySpending: Record<string, number>
}

export const CSPBudgetRow = ({ budget, categorySpending }: CSPBudgetRowProps) => {
  const spendingAmount = categorySpending[budget.category];
  const budgetAmount = budget.amount;
  const amountLeft = budgetAmount - spendingAmount;
  const isOverBudget = spendingAmount > budgetAmount;

  return (
    <div>
      <div key={budget.category} className="flex justify-between items-center active:bg-accent/50">
        <div className="grow shrink basis-2/3 font-medium text-md truncate">{camelCaseToSentence(budget.category)}</div>
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
    </div>
  );
}
