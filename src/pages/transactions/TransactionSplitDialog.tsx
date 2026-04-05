import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/common/dialog";
import { DialogActionPanel } from "../../components/common/DialogActionPanel";
import { Label } from "../../components/common/label";
import { Select } from "../../components/common/select";
import type { Transaction } from "@easy-csp/shared-types";
import { SplitFrequency } from "@easy-csp/shared-types";
import { useSplitTransaction } from "../../hooks/api/useSplitTransactions";

interface TransactionSplitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

const FREQUENCY_OPTIONS = [
  { value: SplitFrequency.Weekly, label: "Weekly" },
  { value: SplitFrequency.Monthly, label: "Monthly" },
  { value: SplitFrequency.Yearly, label: "Yearly" },
];

function distributeAmountPreview(total: number, count: number): number[] {
  const base = Math.floor((total / count) * 100) / 100;
  const remainder = Math.round((total - base * count) * 100) / 100;
  return [base + remainder, ...Array(count - 1).fill(base)];
}

function calculateDatesPreview(startDate: number, frequency: SplitFrequency, count: number): Date[] {
  const dates: Date[] = [];
  let current = startDate;
  for (let i = 0; i < count; i++) {
    dates.push(new Date(current));
    const d = new Date(current);
    if (frequency === SplitFrequency.Weekly) d.setDate(d.getDate() + 7);
    else if (frequency === SplitFrequency.Monthly) d.setMonth(d.getMonth() + 1);
    else d.setFullYear(d.getFullYear() + 1);
    current = d.getTime();
  }
  return dates;
}

export const TransactionSplitDialog = ({ open, onOpenChange, transaction }: TransactionSplitDialogProps) => {
  const [splitCount, setSplitCount] = useState(2);
  const [frequency, setFrequency] = useState<SplitFrequency>(SplitFrequency.Monthly);
  const [error, setError] = useState<string | null>(null);

  const splitMutation = useSplitTransaction();

  const splitCountOptions = useMemo(
    () => Array.from({ length: 11 }, (_, i) => ({ value: String(i + 2), label: String(i + 2) })),
    []
  );

  const preview = useMemo(() => {
    if (!transaction) return null;
    const amounts = distributeAmountPreview(transaction.amount, splitCount);
    const dates = calculateDatesPreview(transaction.datetime, frequency, splitCount);
    return amounts.map((amount, i) => ({ amount, date: dates[i] }));
  }, [transaction, splitCount, frequency]);

  const handleSubmit = async () => {
    if (!transaction) return;
    setError(null);

    try {
      await splitMutation.mutateAsync({
        transactionId: transaction.id,
        splitCount,
        frequency,
        startDate: transaction.datetime,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to split transaction";
      setError(msg);
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Split Transaction</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Transaction</Label>
            <p className="text-sm text-gray-500">{transaction.name} — ${transaction.amount.toLocaleString()}</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Number of Splits</Label>
            <Select
              options={splitCountOptions}
              value={String(splitCount)}
              onValueChange={(v) => setSplitCount(Number(v))}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Frequency</Label>
            <Select
              options={FREQUENCY_OPTIONS}
              value={frequency}
              onValueChange={(v) => setFrequency(v as SplitFrequency)}
            />
          </div>

          {preview && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Preview</Label>
              <div className="mt-1 space-y-1 max-h-48 overflow-y-auto rounded border border-gray-200 p-2">
                {preview.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm text-gray-600">
                    <span>{item.date.toLocaleDateString()}</span>
                    <span>${item.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogActionPanel
          cancel={{
            label: 'Cancel',
            onClick: () => onOpenChange(false),
          }}
          submit={{
            label: 'Split',
            onClick: handleSubmit,
          }}
          isLoading={splitMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};
