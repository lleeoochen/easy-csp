import { useState, useEffect, useMemo } from "react";
import { Input } from "../../components/common/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/common/dialog";
import { DialogActionPanel } from "../../components/common/DialogActionPanel";
import { Label } from "../../components/common/label";
import { AccountSelector, MANUAL_ACCOUNT_VALUE } from "../../components/common/AccountSelector";
import type { UI_FundAndBalance } from "../../types/uiTypes";
import { getAccountOptionValueForFund } from "../../utils/accountUtils";
import { FundType } from "@easy-csp/shared-types";

interface FundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  existingFund?: UI_FundAndBalance;
  onAdd: (data: { name: string; type: FundType; targetAmount: number; selectedAccount: string }) => void;
  onUpdate: (data: { id: string; name: string; type: FundType; targetAmount: number; selectedAccount: string }) => void;
  onDelete?: (id: string) => void;
}

interface FormData {
  name: string;
  type: FundType;
  targetAmount: number;
  selectedAccount: string;
}

export function FundDialog({
  open,
  onOpenChange,
  mode,
  existingFund,
  onAdd,
  onUpdate,
  onDelete,
}: FundDialogProps) {
  // Calculate initial form data based on mode and existing fund
  const initialFormData = useMemo(() => {
    if (mode === "edit" && existingFund) {
      return {
        name: existingFund.name,
        type: existingFund.type,
        targetAmount: existingFund.targetAmount,
        selectedAccount: getAccountOptionValueForFund({
          financialInstitutionId: existingFund.financialInstitutionId || "",
          accountId: existingFund.accountId,
        }),
      };
    }
    return {
      name: "",
      type: FundType.Saving,
      targetAmount: 0,
      selectedAccount: MANUAL_ACCOUNT_VALUE,
    };
  }, [mode, existingFund]);

  const [formData, setFormData] = useState<FormData>(initialFormData);

  const handleSubmit = () => {
    // Allow submission if name and target amount are valid
    // selectedAccount can be empty for manual funds or MANUAL_ACCOUNT_VALUE
    if (formData.name && formData.targetAmount > 0) {
      if (mode === "add") {
        onAdd(formData);
      } else if (mode === "edit" && existingFund) {
        onUpdate({
          id: existingFund.id,
          ...formData,
        });
      }

      onOpenChange(false);
    }
  };

  // Reset form data when initial data changes (when mode or existingFund changes)
  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  const handleDelete = () => {
    if (mode === "edit" && existingFund && onDelete) {
      onDelete(existingFund.id);
      onOpenChange(false);
    }
  };

  const isFormValid = formData.name && formData.targetAmount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Create New Fund" : "Edit Fund"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add" ? "Set a new fund" : "Update your fund details"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Fund Name</Label>
            <Input
              id="name"
              placeholder="e.g., Emergency Fund"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Fund Type</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as FundType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-bg"
            >
              <option value={FundType.Saving}>Saving</option>
              <option value={FundType.Investment}>Investment</option>
            </select>
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
              includeManualOption={true}
            />
          </div>
        </div>

        <DialogActionPanel
          cancel={{
            label: 'Cancel',
            onClick: () => onOpenChange(false),
          }}
          submit={{
            label: mode === "add" ? "Create" : "Save",
            onClick: handleSubmit,
            disabled: !isFormValid,
          }}
          delete={mode === "edit" && onDelete ? {
            label: 'Delete',
            onClick: handleDelete,
            confirmation: {
              title: 'Delete Fund',
              message: `Are you sure you want to delete "${existingFund?.name}"? This action cannot be undone.`,
            },
          } : undefined}
        />
      </DialogContent>
    </Dialog>
  );
}
