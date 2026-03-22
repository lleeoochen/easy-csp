import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/common/dropdown-menu";
import { Progress } from "../../components/common/progress";
import { type CSPCategoryBudget, CSPBucket } from "@easy-csp/shared-types";
import { formatCurrency } from "../../utils/financialUtils";
import { cn } from "../../components/common/utils";
import { CSPBudgetEditDialog } from "./CSPBudgetEditDialog";
import { PenIcon, BarChart3Icon, Trash2Icon } from "lucide-react";
import { useDeleteCSPItem } from "../../hooks/api/useCSP";
import { PROTECTED_CSP_CATEGORIES } from "@easy-csp/shared-types";

interface CSPBudgetActionMenuProps {
  budget: CSPCategoryBudget;
  bucket: CSPBucket;
  categoryName: string;
  actualAmount: number;
  budgetAmount: number;
  amountLeft: number;
  isOverBudget: boolean;
  currentMonth: string; // Format: YYYY-MM
}

export const CSPBudgetActionMenu = ({
  budget,
  bucket,
  categoryName,
  actualAmount,
  budgetAmount,
  amountLeft,
  isOverBudget,
  currentMonth
}: CSPBudgetActionMenuProps) => {
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const deleteCSPItem = useDeleteCSPItem();

  const handleEditBudget = () => {
    setIsEditDialogOpen(true);
  };

  const handleViewTransactions = () => {
    // For saving targets, filter by fund; for regular categories, filter by category and no fund
    if (budget.isTrackingSavingTarget) {
      navigate(`/transactions?fund=${encodeURIComponent(budget.category)}&month=${currentMonth}`);
    } else {
      navigate(`/transactions?category=${encodeURIComponent(budget.category)}&fund=none&month=${currentMonth}`);
    }
  };

  const handleRemoveCategory = () => {
    if (window.confirm("Remove this category from your CSP? This cannot be undone.")) {
      deleteCSPItem.mutate(
        { bucket, category: budget.category },
        { onError: (err) => console.error("Failed to delete CSP item:", err) }
      );
    }
  };

  return (
    <>
      <div className="relative">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="py-1 cursor-pointer hover:bg-accent/20 active:bg-accent/50 w-full">
              <div className="flex justify-between items-center">
                <div className="grow shrink basis-2/3 font-medium truncate">
                  {categoryName}
                </div>
                <Progress
                  className="bg-gray-200 grow shrink basis-1/3"
                  value={Math.min(actualAmount / budgetAmount * 100, 100)}
                  activeColorClass={cn("bg-primary-bg", { "bg-red-400": isOverBudget })}
                />
              </div>
              <div className="flex justify-between">
                <div className="text-gray-400 text-sm">
                  Target: {formatCurrency(budgetAmount)}
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
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleEditBudget}>
              <PenIcon className="mr-2 h-4 w-4" />
              Edit Budget
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleViewTransactions}>
              <BarChart3Icon className="mr-2 h-4 w-4" />
              View Transactions
            </DropdownMenuItem>
            {bucket !== CSPBucket.Income && budget.isTrackingSavingTarget !== true && !PROTECTED_CSP_CATEGORIES.has(budget.category) && (
              <DropdownMenuItem
                onClick={handleRemoveCategory}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2Icon className="mr-2 h-4 w-4" />
                Remove Category
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CSPBudgetEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        budget={budget}
        bucket={bucket}
        categoryName={categoryName}
      />
    </>
  );
};