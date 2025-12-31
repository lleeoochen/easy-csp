import type { Transaction } from "@easy-csp/shared-types";
import { Card } from "../../components/common/card";

interface TransactionsListProps {
  transactions: Transaction[];
}

export function TransactionsList({
  transactions,
}: TransactionsListProps) {
  return (
    <div className="space-y-4 p-4 pb-24">
      {/* Summary */}
      {transactions.length > 0 && (
        <div className="text-md text-right">
          Total: ${transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
        </div>
      )}
      {/* Transactions List */}
      <div className="space-y-2">
        {transactions.length === 0 ? (
          <div className="text-center py-16 bg-card border rounded-lg">
            <p className="text-muted-foreground">No transactions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tap "Add Transaction" to start
            </p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <Card
              key={transaction.id}
              className="p-4 active:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{transaction.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(transaction.datetime).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric"
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-lg font-bold">
                    ${transaction.amount.toLocaleString()}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
