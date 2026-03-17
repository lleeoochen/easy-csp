import { useMemo } from "react";
import type { Transaction } from "@easy-csp/shared-types";
import { Card, CardContent, CardHeader } from "../../components/common/card";
import { TransactionRow } from "./TransactionRow";

type TransactionsListProps =  {
  transactions: Transaction[];
  handleTransactionClick(transaction: Transaction): void;
};

export function TransactionsList({ transactions, handleTransactionClick }: TransactionsListProps) {
  // Group transactions by month
  const groupedTransactions = useMemo(() => {
    const groups: { [monthYear: string]: Transaction[] } = {};

    transactions.forEach((transaction) => {
      const date = new Date(transaction.datetime);
      const monthYear = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long"
      });

      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(transaction);
    });

    // Convert to array and sort by date (newest first)
    return Object.entries(groups)
      .map(([monthYear, transactions]) => ({
        monthYear,
        transactions: transactions.sort((a, b) => b.datetime - a.datetime)
      }))
      .sort((a, b) => {
        // Sort groups by the first transaction's date (newest first)
        const aFirstDate = a.transactions[0]?.datetime || 0;
        const bFirstDate = b.transactions[0]?.datetime || 0;
        return bFirstDate - aFirstDate;
      });
  }, [transactions]);

  return (
    <div className="flex flex-col relative gap-4">
      {
        groupedTransactions.flatMap(({ monthYear, transactions }) => {
          return (
            <Card
              key={`month-${monthYear}`}
              className="sticky top-0 z-10">
              <CardHeader>
                <div className="text-lg">{monthYear}</div>
              </CardHeader>
              <CardContent className="px-0! py-0! divide-y divide-gray-200">
                {
                  transactions.map((transaction) => (
                    <div key={transaction.id} className="px-4 py-1.5">
                      <TransactionRow
                        transaction={transaction}
                        onClick={handleTransactionClick}
                      />
                    </div>
                  ))
                }
              </CardContent>
            </Card>
          );
        })
      }
    </div>
  );
}
