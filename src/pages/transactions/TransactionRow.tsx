import type { Transaction } from "@easy-csp/shared-types";
import { useCategoryMap, useSavingTargetCategoryIds, useIgnoredCategoryIds } from "../../hooks/useCategoryMap";
import { useSavingTargets } from "../../hooks/api/useSavingTargets";
import { useSplitTransactionsByParent } from "../../hooks/api/useSplitTransactions";
import { cn } from "../../components/common/utils";

type TransactionRowProps = {
  transaction: Transaction;
  onClick(transaction: Transaction): void;
};

function SplitBadge({ transaction }: { transaction: Transaction }) {
  const parentId = transaction.splitParentId;
  const { data: splits = [] } = useSplitTransactionsByParent(parentId);

  if (!parentId || splits.length === 0) return null;

  const isParent = parentId === transaction.id;

  if (isParent) {
    return (
      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
        Parent ({splits.length} splits)
      </span>
    );
  }

  const index = splits.findIndex((s) => s.id === transaction.id);
  const position = index >= 0 ? index + 1 : "?";

  return (
    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
      Split {position} of {splits.length}
    </span>
  );
}

export function TransactionRow({ transaction, onClick }: TransactionRowProps) {
  const categoryMap = useCategoryMap();
  const savingTargetCategoryIds = useSavingTargetCategoryIds();
  const ignoredCategoryIds = useIgnoredCategoryIds();
  const { data: savingTargets = [] } = useSavingTargets();

  const savingTarget = transaction.savingTargetId
    ? savingTargets.find(st => st.id === transaction.savingTargetId)
    : null;

  const categoryText = categoryMap[transaction.category] ?? transaction.category;

  const categoryInfo = {
    isSavingTarget: savingTargetCategoryIds.has(transaction.category),
    isIgnored: ignoredCategoryIds.has(transaction.category) || transaction.hidden
  };

  return (
    <div className="bg-white active:bg-accent/50 transition-colors cursor-pointer hover:bg-accent/20 rounded-2xl">
      <div className="py-1" onClick={() => onClick(transaction)}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="min-w-0 flex-1">
              <div className="truncate">{transaction.name}</div>
              <div className={cn(
                "text-sm truncate",
                categoryInfo.isSavingTarget ? "text-blue-600 font-medium" : "text-gray-400"
              )}>
                {categoryText}
                {savingTarget && (
                  <div className="text-blue-600"> {savingTarget.name} </div>
                )}
              </div>
              {transaction.splitParentId && (
                <div className="mt-0.5">
                  <SplitBadge transaction={transaction} />
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className={cn(
              "font-bold",
              categoryInfo.isIgnored && "text-gray-400",
              !categoryInfo.isIgnored && transaction.amount < 0 && "text-green-600"
            )}>
              {transaction.amount < 0 ? "+" : ""}${Math.abs(transaction.amount).toLocaleString()}
            </div>
            <div className="text-sm text-gray-400 text-muted-foreground">
              {new Date(transaction.datetime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
