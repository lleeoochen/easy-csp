import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Target } from "lucide-react";
import { Progress } from "../../components/common/progress";
import { Button } from "../../components/common/button";
import { Input } from "../../components/common/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../../components/common/dialog";
import { Label } from "../../components/common/label";
import { Card } from "../../components/common/card";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { fetchFinancialInstitutions } from "../../redux/thunks/financialInstitutionThunk";
import type { UI_SavingTargetAndBalance } from "../../types/uiTypes";
import type { ThunkProps_AddSavingTarget, ThunkProps_UpdateSavingTarget } from "../../redux/thunks/savingTargetsThunk";

interface SavingTargetsContentProps {
  savingTargets: UI_SavingTargetAndBalance[];
  onAddSavingTarget: (savingTargetData: ThunkProps_AddSavingTarget) => void;
  onUpdateSavingTarget: (savingTargetData: ThunkProps_UpdateSavingTarget) => void;
  onDeleteSavingTarget: (id: string) => void;
  onUpdateProgress: (id: string, amount: number) => void;
}

export function SavingTargetsContent({
  savingTargets,
  onAddSavingTarget,
  onUpdateSavingTarget,
  onDeleteSavingTarget,
  onUpdateProgress,
}: SavingTargetsContentProps) {
  const dispatch = useAppDispatch();
  const financialInstitutionState = useAppSelector(state => state.financialInstitution);
  const institutions = financialInstitutionState.institutions;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [progressId, setProgressId] = useState<string | null>(null);
  const [progressAmount, setProgressAmount] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: 0,
    selectedAccount: "",
  });

  useEffect(() => {
    // Load financial institutions for account selection
    dispatch(fetchFinancialInstitutions());
  }, [dispatch]);

  // Create account options for the selector
  const accountOptions = institutions.flatMap((institution, index) =>
    institution.accounts.map(account => ({
      value: `${index}|${account.accountId}`,
      label: `${institution.institutionName} - ${account.accountName}`,
      institutionIndex: index,
      accountId: account.accountId,
    }))
  );

  const handleAdd = () => {
    if (formData.name && formData.targetAmount > 0 && formData.selectedAccount) {
      onAddSavingTarget(formData);
      setFormData({
        name: "",
        targetAmount: 0,
        selectedAccount: "",
      });
      setIsAddOpen(false);
    }
  };

  const handleEdit = (savingTarget: UI_SavingTargetAndBalance) => {
    setEditingId(savingTarget.id);
    setFormData({
      name: savingTarget.name,
      targetAmount: savingTarget.targetAmount,
      selectedAccount: "", // Would need to derive this from saving target data
    });
  };

  const handleUpdate = () => {
    if (editingId && formData.name && formData.targetAmount > 0 && formData.selectedAccount) {
      onUpdateSavingTarget({
        id: editingId,
        savingTargetData: formData
      });
      setEditingId(null);
    }
  };

  const handleProgressUpdate = () => {
    if (progressId && progressAmount > 0) {
      onUpdateProgress(progressId, progressAmount);
      setProgressId(null);
      setProgressAmount(0);
    }
  };

  return (
    <div className="space-y-4 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger>
            <div className="flex items-center">
              <Plus className="size-4 mr-2" />
              <span>Add Saving Target</span>
            </div>
          </DialogTrigger>
          <DialogContent className="w-[calc(100%-2rem)] max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Saving Target</DialogTitle>
              <DialogDescription>Set a new savings target</DialogDescription>
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
            <DialogFooter>
              <Button onClick={handleAdd} className="w-full">Create Saving Target</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Saving Targets List */}
      <div className="space-y-3">
        {savingTargets.length === 0 ? (
          <div className="text-center py-16 bg-card border rounded-lg">
            <Target className="size-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No saving targets yet</p>
            <p className="text-md text-muted-foreground mt-1">
              Create your first savings target
            </p>
          </div>
        ) : (
          savingTargets.map((savingTarget) => {
            const percentage = (savingTarget.currentAmount / savingTarget.targetAmount) * 100;
            const isComplete = savingTarget.currentAmount >= savingTarget.targetAmount;

            return (
              <Card key={savingTarget.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-3 h-3 rounded-full mt-1 bg-blue-500" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{savingTarget.name}</h3>
                      {savingTarget.accountInfo && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {savingTarget.accountInfo.institutionName} - {savingTarget.accountInfo.accountName}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleEdit(savingTarget)}
                  >
                    <Edit2 className="size-3.5" />
                  </Button>
                </div>

                <div className="space-y-2 mb-3">
                  <Progress
                    value={Math.min(percentage, 100)}
                    className=" bg-gray-300"
                  />
                  <div className="flex justify-between text-md">
                    <span className={isComplete ? "text-green-600 font-medium" : "text-muted-foreground"}>
                      {percentage.toFixed(0)}% complete
                    </span>
                    <span className="font-medium">
                      ${savingTarget.currentAmount.toLocaleString()} / ${savingTarget.targetAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <div>
                    ${(savingTarget.targetAmount - savingTarget.currentAmount).toLocaleString()} remaining
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setProgressId(savingTarget.id);
                    setProgressAmount(0);
                  }}
                  disabled={isComplete}
                >
                  <Plus className="size-3.5 mr-1" />
                  Add Progress
                </Button>
              </Card>
            );
          })
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editingId !== null} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Saving Target</DialogTitle>
            <DialogDescription>Update your saving target details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Saving Target Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-target">Target Amount</Label>
              <Input
                id="edit-target"
                type="number"
                value={formData.targetAmount}
                onChange={(e) =>
                  setFormData({ ...formData, targetAmount: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-account">Select Account</Label>
              <select
                id="edit-account"
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
          <DialogFooter className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                if (editingId) {
                  onDeleteSavingTarget(editingId);
                  setEditingId(null);
                }
              }}
              className="flex-1"
            >
              <Trash2 className="size-4 mr-2" />
              Delete
            </Button>
            <Button onClick={handleUpdate} className="flex-1">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={progressId !== null} onOpenChange={(open) => !open && setProgressId(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>Add Progress</DialogTitle>
            <DialogDescription>How much did you save towards this target?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="progress-amount">Amount</Label>
              <Input
                id="progress-amount"
                type="number"
                placeholder="0"
                value={progressAmount || ""}
                onChange={(e) => setProgressAmount(Number(e.target.value))}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleProgressUpdate} className="w-full">
              Add ${progressAmount.toLocaleString()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
