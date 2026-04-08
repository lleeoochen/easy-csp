import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./common/dialog";
import { Button } from "./common/button";
import { Label } from "./common/label";
import { Input } from "./common/input";
import { useSetFundBalance } from "../hooks/api/useFunds";
import type { UI_FundAndBalance } from "../types/uiTypes";

interface SetBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fund: UI_FundAndBalance | null;
}

export function SetBalanceDialog({ open, onOpenChange, fund }: SetBalanceDialogProps) {
  const [newBalance, setNewBalance] = useState<string>("");
  const [error, setError] = useState<string>("");
  const { mutate: setBalance, isPending, isError, error: mutationError } = useSetFundBalance();

  // Reset form when dialog opens/closes or fund changes
  useEffect(() => {
    if (open && fund) {
      setNewBalance("");
      setError("");
    }
  }, [open, fund]);

  const handleBalanceChange = (value: string) => {
    setNewBalance(value);
    setError("");
  };

  const validateBalance = (): boolean => {
    if (newBalance.trim() === "") {
      setError("Balance is required");
      return false;
    }

    const numValue = parseFloat(newBalance);
    if (isNaN(numValue) || !isFinite(numValue)) {
      setError("Please enter a valid number");
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!fund || !validateBalance()) return;

    const numValue = parseFloat(newBalance);
    setBalance(
      { fundId: fund.id, newBalance: numValue },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isPending) {
      handleSave();
    }
  };

  if (!fund) return null;

  const isValid = newBalance.trim() !== "" && !error;
  const currentBalanceFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(fund.currentAmount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Balance</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1 block">
              Fund
            </Label>
            <div className="text-sm text-gray-900 font-medium">{fund.name}</div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1 block">
              Current Balance
            </Label>
            <div className="text-sm text-gray-600">{currentBalanceFormatted}</div>
          </div>

          <div>
            <Label htmlFor="newBalance" className="text-sm font-medium text-gray-700 mb-1 block">
              New Balance
            </Label>
            <Input
              id="newBalance"
              type="number"
              step="0.01"
              value={newBalance}
              onChange={(e) => handleBalanceChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter new balance"
              className={error ? "border-red-500" : ""}
              disabled={isPending}
              autoFocus
            />
            {error && (
              <div className="text-sm text-red-600 mt-1">{error}</div>
            )}
          </div>

          {isError && mutationError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {mutationError.message || "Failed to set fund balance"}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!isValid || isPending}
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
