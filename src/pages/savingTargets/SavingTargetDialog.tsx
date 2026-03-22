import { useState, useEffect, useMemo } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "../../components/common/button";
import { Input } from "../../components/common/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/common/dialog";
import { Label } from "../../components/common/label";
import { AccountSelector } from "../../components/common/AccountSelector";
import type { UI_SavingTargetAndBalance } from "../../types/uiTypes";
import { getAccountOptionValueForSavingTarget } from "../../utils/accountUtils";

interface SavingTargetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  existingSavingTarget?: UI_SavingTargetAndBalance;
  onAdd: (data: { name: string; targetAmount: number; selectedAccount: string }) => void;
  onUpdate: (data: { id: string; name: string; targetAmount: number; selectedAccount: string }) => void;
  onDelete?: (id: string) => void;
}

interface FormData {
  name: string;
  targetAmount: number;
  selectedAccount: string;
}

export function SavingTargetDialog({
  open,
  onOpenChange,
  mode,
  existingSavingTarget,
  onAdd,
  onUpdate,
  onDelete,
}: SavingTargetDialogProps) {
  // Calculate initial form data based on mode and existing target
  const initialFormData = useMemo(() => {
    if (mode === "edit" && existingSavingTarget) {
      return {
        name: existingSavingTarget.name,
        targetAmount: existingSavingTarget.targetAmount,
        selectedAccount: getAccountOptionValueForSavingTarget({
          financialInstitutionId: existingSavingTarget.financialInstitutionId || "",
          accountId: existingSavingTarget.accountId,
        }),
      };
    }
    return {
      name: "",
      targetAmount: 0,
      selectedAccount: "",
    };
  }, [mode, existingSavingTarget]);

  const [formData, setFormData] = useState<FormData>(initialFormData);

  const handleSubmit = () => {
    if (formData.name && formData.targetAmount > 0 && formData.selectedAccount) {
      if (mode === "add") {
        onAdd(formData);
      } else if (mode === "edit" && existingSavingTarget) {
        onUpdate({
          id: existingSavingTarget.id,
          ...formData,
        });
      }

      onOpenChange(false);
    }
  };

  // Reset form data when initial data changes (when mode or existingSavingTarget changes)
  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  const handleDelete = () => {
    if (mode === "edit" && existingSavingTarget && onDelete) {
      onDelete(existingSavingTarget.id);
      onOpenChange(false);
    }
  };

  const isFormValid = formData.name && formData.targetAmount > 0 && formData.selectedAccount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Create New Saving Fund" : "Edit Saving Fund"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add" ? "Set a new savings fund" : "Update your saving fund details"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Saving Fund Name</Label>
            <Input
              id="name"
              placeholder="e.g., Emergency Fund"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target">Target Amount</Label>
            <Input
              id="target"
              type="number"
              placeholder="0"
              value={formData.targetAmount || ""}
              onChange={(e) =>
                setFormData({ ...formData, targetAmount: Number(e.target.value) })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account">Select Account</Label>
            <AccountSelector
              value={formData.selectedAccount}
              onChange={(value) => setFormData({ ...formData, selectedAccount: value })}
            />
          </div>
        </div>

        <DialogFooter className={mode === "edit" ? "flex gap-2" : ""}>
          {mode === "edit" && onDelete && (
            <Button
              variant="secondary"
              className="flex items-center"
              onClick={handleDelete}
            >
              <Trash2 className="size-4 mr-2" />
              Delete
            </Button>
          )}

          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isFormValid}
          >
            {mode === "add" ? "Create fund" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
