import { useMemo } from "react";
import type { CSPCategoryBudget, Transaction } from "@easy-csp/shared-types";
import { useCategoryMap, isSavingTargetCategory } from "../../hooks/useCategoryMap";
import { useCSP } from "../../hooks/api/useCSP";

type TransactionRowProps = {
  transaction: Transaction;
  onClick(transaction: Transaction): void;
};

export function TransactionRow({ transaction, onClick }: TransactionRowProps) {
  const categoryMap = useCategoryMap();
  const { data: csp } = useCSP();

  const cspCategoryIds = useMemo(() => {
    const ids = new Set<string>();
    if (csp) {
      for (const items of Object.values(csp)) {
        for (const item of items as CSPCategoryBudget[]) {
          ids.add(item.category);
        }
      }
    }
    return ids;
  }, [csp]);

  const categoryInfo = {
    text: categoryMap[transaction.category] ?? transaction.category,
    isSavingTarget: isSavingTargetCategory(transaction.category, cspCategoryIds)
  };

  return (
    <div className="bg-white active:bg-accent/50 transition-colors cursor-pointer hover:bg-accent/20 rounded-2xl">
      <div className="py-1" onClick={() => onClick(transaction)}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="min-w-0 flex-1">
              <div className="truncate">{transaction.name}</div>
              <div className={`text-sm truncate ${categoryInfo.isSavingTarget ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                {categoryInfo.text}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="font-bold">${transaction.amount.toLocaleString()}</div>
            <div className="text-sm text-gray-400 text-muted-foreground">
              {new Date(transaction.datetime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
