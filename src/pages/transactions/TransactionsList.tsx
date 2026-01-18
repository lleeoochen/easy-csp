import type { Transaction } from "@easy-csp/shared-types";
import { Card } from "../../components/common/card";
import { camelCaseToSentence } from "../../utils/stringUtils";

interface TransactionsListProps {
  transactions: Transaction[];
}

export function TransactionsList({
  transactions,
}: TransactionsListProps) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      {transactions.length > 0 && (
        <div className="text-md text-right">
          Total: ${transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
        </div>
      )}
      {/* Transactions List */}
      <div className="flex flex-col gap-1">
        {transactions.length === 0 ? (
          <div className="text-center py-16 bg-card border rounded-lg">
            <p className="text-muted-foreground">No transactions yet</p>
            <p className="text-md text-muted-foreground mt-1">
              Tap "Add Transaction" to start
            </p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <Card
              key={transaction.id}
              className="px-4 py-2 active:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="min-w-0 flex-1">
                    <div className="text-md truncate">{transaction.name}</div>
                    <div className="text-sm text-gray-400 truncate">{camelCaseToSentence(transaction.category)}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-md font-bold">
                    ${transaction.amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400 text-muted-foreground">
                    {new Date(transaction.datetime).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric"
                    })}
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
