import { useState } from "react";
import { Plus, Edit2, Target } from "lucide-react";
import { Progress } from "../../components/common/progress";
import { Button } from "../../components/common/button";
import { Card, CardContent, CardHeader } from "../../components/common/card";
import type { UI_SavingTargetAndBalance } from "../../types/uiTypes";
import { formatCurrency } from "../../utils/financialUtils";
import { SavingTargetDialog } from "./SavingTargetDialog";

interface SavingTargetsContentProps {
  savingTargets: UI_SavingTargetAndBalance[];
  onAddSavingTarget: (data: { name: string; targetAmount: number; selectedAccount: string }) => void;
  onUpdateSavingTarget: (data: { id: string; name: string; targetAmount: number; selectedAccount: string }) => void;
  onDeleteSavingTarget: (id: string) => void;
}

export function SavingTargetsContent({
  savingTargets,
  onAddSavingTarget,
  onUpdateSavingTarget,
  onDeleteSavingTarget,
}: SavingTargetsContentProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSavingTarget, setEditingSavingTarget] = useState<UI_SavingTargetAndBalance | undefined>(undefined);

  const handleEdit = (savingTarget: UI_SavingTargetAndBalance) => {
    setEditingSavingTarget(savingTarget);
  };

  const handleCloseEditDialog = () => {
    setEditingSavingTarget(undefined);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="primary"
          className="bg-white hover:bg-white/70 active:bg-gray-300 ml-auto"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus />
        </Button>
      </div>

      {/* Saving Targets List */}
      <Card className="mt-3">
        <CardHeader>
          Saving Funds
        </CardHeader>
        <CardContent className=" p-0! divide-y divide-gray-200">
          {savingTargets.length === 0 ? (
            <div className="text-center py-16 bg-card border rounded-lg">
              <Target className="size-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No saving targets yet</p>
              <p className="text-muted-foreground mt-1">
                Create your first savings target
              </p>
            </div>
          ) : (
            savingTargets.map((savingTarget) => {
              const percentage = (savingTarget.currentAmount / savingTarget.targetAmount) * 100;

              return (
                <div key={savingTarget.id}>
                  <div className="space-y-2 p-4">
                    <div className="flex gap-5">
                      <div className="flex flex-col items-start flex-1 m-auto truncate">
                        <div className="font-semibold">{savingTarget.name}</div>
                        {savingTarget && (
                          <p className="text-sm text-gray-400 text-muted-foreground">
                            {savingTarget.institutionName} - {savingTarget.accountName}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="secondary"
                        className="h-8 w-8 p-0 flex"
                        onClick={() => handleEdit(savingTarget)}
                      >
                        <Edit2 className="size-3.5 m-auto" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Progress
                        value={Math.min(percentage, 100)}
                        className="bg-gray-200"
                        activeColorClass="bg-primary-bg"
                      />
                      <div className="flex justify-between">
                        <div className={"text-gray-800 text-sm font-bold"}>
                          {formatCurrency(savingTarget.currentAmount)}
                        </div>
                        <div className="text-gray-400 text-sm">
                          Target: {formatCurrency(savingTarget.targetAmount)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <SavingTargetDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        mode="add"
        onAdd={onAddSavingTarget}
        onUpdate={onUpdateSavingTarget}
        onDelete={onDeleteSavingTarget}
      />

      {/* Edit Dialog */}
      <SavingTargetDialog
        open={editingSavingTarget !== undefined}
        onOpenChange={(open) => !open && handleCloseEditDialog()}
        mode="edit"
        existingSavingTarget={editingSavingTarget}
        onAdd={onAddSavingTarget}
        onUpdate={onUpdateSavingTarget}
        onDelete={onDeleteSavingTarget}
      />
    </div>
  );
}
