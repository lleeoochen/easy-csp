import type { Transaction } from "@easy-csp/shared-types";
import { isManualTransaction } from "@easy-csp/shared-types";
import { useCategoryMap, useSavingTargetCategoryIds, useIgnoredCategoryIds } from "../../hooks/useCategoryMap";
import { useSavingTargets } from "../../hooks/api/useSavingTargets";
import { cn } from "../../components/common/utils";
import { formatCurrency, getTransactionSignPrefix } from "../../utils/financialUtils";
import { Split, Target, PenLine } from "lucide-react";

const SAVING_TARGET_COLORS = [
  "text-blue-600",
  "text-purple-600",
  "text-green-600",
  "text-orange-600",
  "text-pink-600",
  "text-teal-600",
  "text-indigo-600",
  "text-red-600",
  "text-cyan-600",
  "text-amber-600",
];

function hashStringToIndex(str: string, arrayLength: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % arrayLength;
}

type TransactionRowProps = {
  transaction: Transaction;
  onClick(transaction: Transaction): void;
};

function SplitIndicator({ transaction }: { transaction: Transaction }) {
  if (!transaction.splitParentId) return null;

  const isParent = transaction.splitParentId === transaction.id;

  return (
    <Split
      className={cn(
        "inline-block",
        isParent ? "text-yellow-600" : "text-indigo-600"
      )}
      size={14}
      strokeWidth={isParent ? 2.5 : 2}
    />
  );
}

export function TransactionRow({ transaction, onClick }: TransactionRowProps) {
  const categoryMap = useCategoryMap();
  const savingTargetCategoryIds = useSavingTargetCategoryIds();
  const ignoredCategoryIds = useIgnoredCategoryIds();
  const { data: savingTargets = [] } = useSavingTargets();

  const isManual = isManualTransaction(transaction);

  const savingTarget = transaction.savingTargetId
    ? savingTargets.find(st => st.id === transaction.savingTargetId)
    : null;

  const targetColor = transaction.savingTargetId
    ? SAVING_TARGET_COLORS[hashStringToIndex(transaction.savingTargetId, SAVING_TARGET_COLORS.length)]
    : "text-blue-600";

  const categoryText = categoryMap[transaction.category] ?? transaction.category;

  const categoryInfo = {
    isSavingTarget: savingTargetCategoryIds.has(transaction.category),
    isIgnored: ignoredCategoryIds.has(transaction.category) || transaction.hidden
  };

  const displayName = transaction.nickname || transaction.name;

  return (
    <div className="bg-white active:bg-accent/50 transition-colors cursor-pointer hover:bg-accent/20 rounded-2xl">
      <div className="py-1" onClick={() => onClick(transaction)}>
        <div className="flex items-start justify-between gap-5">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="min-w-0 flex-1">
              <div className="truncate flex items-center gap-1">
                {isManual && (
                  <PenLine className="text-gray-500 shrink-0" size={14} strokeWidth={2} />
                )}
                {displayName}
              </div>
              <div className={cn(
                "flex flex-row gap-1 items-center text-sm flex-wrap",
                categoryInfo.isSavingTarget ? `${targetColor} font-medium` : "text-gray-400"
              )}>
                {savingTarget && (
                  <Target className={targetColor} size={18} strokeWidth={2} />
                )}
                <SplitIndicator transaction={transaction} />
                {categoryText}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className={cn(
              "font-bold",
              categoryInfo.isIgnored && "text-gray-400",
              !categoryInfo.isIgnored && transaction.amount < 0 && "text-green-600"
            )}>
              {getTransactionSignPrefix(transaction.amount) + formatCurrency(transaction.amount)}
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
