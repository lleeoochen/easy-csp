import type { Transaction } from "@easy-csp/shared-types";

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
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">Total</div>
            <div className="text-xl font-bold">
              ${transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
            </div>
          </div>
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
            <div
              key={transaction.id}
              className="bg-card border-2 border-cardBorder drop-shadow-xl/20 rounded-lg p-4 active:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{transaction.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(transaction.date).toLocaleDateString("en-US", {
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
            </div>
          ))
        )}
      </div>
    </div>
  );
}
