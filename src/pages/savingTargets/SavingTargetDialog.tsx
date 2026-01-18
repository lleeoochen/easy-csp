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
import { useAppSelector } from "../../hooks/useRedux";
import type { UI_SavingTargetAndBalance } from "../../types/uiTypes";
import type { ThunkProps_AddSavingTarget, ThunkProps_UpdateSavingTarget } from "../../redux/thunks/savingTargetsThunk";
import { generateAccountOptions, getAccountOptionValueForSavingTarget } from "../../utils/accountUtils";

interface SavingTargetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  existingSavingTarget?: UI_SavingTargetAndBalance;
  onAdd: (savingTargetData: ThunkProps_AddSavingTarget) => void;
  onUpdate: (savingTargetData: ThunkProps_UpdateSavingTarget) => void;
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
  const financialInstitutionState = useAppSelector(state => state.financialInstitution);
  const institutions = financialInstitutionState.fetchFinancialInstitutions.institutions;

  // Generate account options
  const accountOptions = generateAccountOptions(institutions);

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
          savingTargetData: formData
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
            {mode === "add" ? "Create New Saving Target" : "Edit Saving Target"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add" ? "Set a new savings target" : "Update your saving target details"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Saving Target Name</Label>
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
            <select
              id="account"
              value={formData.selectedAccount}
              onChange={(e) => setFormData({ ...formData, selectedAccount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose an account...</option>
              {accountOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter className={mode === "edit" ? "flex gap-2" : ""}>
          {mode === "edit" && onDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex-1"
            >
              <Trash2 className="size-4 mr-2" />
              Delete
            </Button>
          )}

          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={!isFormValid}
            className={mode === "edit" ? "flex-1" : "w-full"}
          >
            {mode === "add" ? "Create" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
