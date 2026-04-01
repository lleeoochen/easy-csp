import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/common/dialog";
import { Label } from "../../components/common/label";
import { Input } from "../../components/common/input";
import { Button } from "../../components/common/button";
import { useUpdateCSPItem } from "../../hooks/api/useCSP";
import type { CSPCategoryBudget, CSPBucket } from "@easy-csp/shared-types";
import { camelCaseToSentence } from "../../utils/stringUtils";

interface CSPBudgetEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: CSPCategoryBudget;
  bucket: CSPBucket;
  categoryName: string;
}

export function CSPBudgetEditDialog({
  open,
  onOpenChange,
  budget,
  bucket,
  categoryName
}: CSPBudgetEditDialogProps) {
  const updateCSPItem = useUpdateCSPItem();
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(budget.amount.toString());
    }
  }, [open, budget.amount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isLoading) return;

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      return;
    }

    setIsLoading(true);
    try {
      await updateCSPItem.mutateAsync({
        bucket,
        category: budget.category,
        amount: numericAmount,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update budget:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Target</DialogTitle>
          <DialogDescription>
            Update the target amount for {camelCaseToSentence(categoryName)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Target Amount</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter target amount"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <DialogFooter className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!amount || isLoading}
            >
              {isLoading ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
