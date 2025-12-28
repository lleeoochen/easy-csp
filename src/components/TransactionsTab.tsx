import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "./common/button";
import { Input } from "./common/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./common/dialog";
import { Label } from "./common/label";
import { Select } from "./common/select";
import type { Transaction } from "@easy-csp/shared-types";

interface TransactionsTabProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
}

export function TransactionsTab({
  transactions,
  onDeleteTransaction,
}: TransactionsTabProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [newTransaction, setNewTransaction] = useState<Transaction>({
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    category: "fixedCosts",
    uid: "",
    accountId: "",
    id: "",
    hidden: false,
    name: ""
  });

  const categories = [
    { value: "fixedCosts", label: "Fixed Costs", color: "bg-blue-500" },
    { value: "investments", label: "Investments", color: "bg-green-500" },
    { value: "savings", label: "Savings", color: "bg-purple-500" },
    { value: "guiltFree", label: "Guilt-Free Spending", color: "bg-orange-500" },
  ];

  const handleAdd = () => {
    // if (newTransaction.amount > 0) {
    //   onAddTransaction(newTransaction);
    //   setNewTransaction({
    //     date: new Date().toISOString().split("T")[0],
    //     amount: 0,
    //     category: "fixedCosts",
    //   });
    //   setIsAddOpen(false);
    // }
  };

  const filteredTransactions = transactions.filter(
    (t) => filterCategory === "all" || t.category === filterCategory
  );

  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // const getCategoryLabel = (category: string) => {
  //   return categories.find((c) => c.value === category)?.label || category;
  // };

  const getCategoryColor = (category: string) => {
    return categories.find((c) => c.value === category)?.color || "bg-gray-500";
  };

  return (
    <div className="space-y-4 p-4 pb-24">
      {/* Add Button & Filter */}
      <div className="flex gap-2">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger>
            <div className="flex items-center">
              <Plus className="size-4 mr-2" />
              <span>Add Transaction</span>
            </div>
          </DialogTrigger>
          <DialogContent className="w-[calc(100%-2rem)] max-w-md">
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
              <DialogDescription>
                Record a new expense or transaction
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newTransaction.date.toString()}
                  onChange={(e) =>
                    setNewTransaction({ ...newTransaction, date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={newTransaction.amount || ""}
                  onChange={(e) =>
                    setNewTransaction({ ...newTransaction, amount: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  options={categories}
                  value={newTransaction.category}
                  onValueChange={(value) =>
                    setNewTransaction({ ...newTransaction, category: value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAdd} className="w-full">Add Transaction</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Select
          options={[{ value: "all", label: "All" }, ...categories]}
          value={filterCategory}
          onValueChange={setFilterCategory}
          placeholder="Filter"
          className="w-30"
        />
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {sortedTransactions.length === 0 ? (
          <div className="text-center py-16 bg-card border rounded-lg">
            <p className="text-muted-foreground">No transactions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tap "Add Transaction" to start
            </p>
          </div>
        ) : (
          sortedTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="bg-card border-2 border-cardBorder drop-shadow-xl/20 rounded-lg p-4 active:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${getCategoryColor(transaction.category)}`} />
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onDeleteTransaction(transaction.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {sortedTransactions.length > 0 && (
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">Total</div>
            <div className="text-xl font-bold">
              ${sortedTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
