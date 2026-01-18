import { useState, useEffect } from "react";
import { Plus, Edit2, Target } from "lucide-react";
import { Progress } from "../../components/common/progress";
import { Button } from "../../components/common/button";
import { Card, CardHeader } from "../../components/common/card";
import { useAppDispatch } from "../../hooks/useRedux";
import { fetchFinancialInstitutions } from "../../redux/thunks/financialInstitutionThunk";
import type { UI_SavingTargetAndBalance } from "../../types/uiTypes";
import type { ThunkProps_AddSavingTarget, ThunkProps_UpdateSavingTarget } from "../../redux/thunks/savingTargetsThunk";
import { formatCurrency } from "../../utils/financialUtils";
import { SavingTargetDialog } from "./SavingTargetDialog";

interface SavingTargetsContentProps {
  savingTargets: UI_SavingTargetAndBalance[];
  onAddSavingTarget: (savingTargetData: ThunkProps_AddSavingTarget) => void;
  onUpdateSavingTarget: (savingTargetData: ThunkProps_UpdateSavingTarget) => void;
  onDeleteSavingTarget: (id: string) => void;
}

export function SavingTargetsContent({
  savingTargets,
  onAddSavingTarget,
  onUpdateSavingTarget,
  onDeleteSavingTarget,
}: SavingTargetsContentProps) {
  const dispatch = useAppDispatch();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSavingTarget, setEditingSavingTarget] = useState<UI_SavingTargetAndBalance | undefined>(undefined);

  useEffect(() => {
    // Load financial institutions for account selection
    dispatch(fetchFinancialInstitutions());
  }, [dispatch]);

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
          variant="default"
          size="sm"
          className="bg-white hover:bg-white/70 active:bg-gray-300 ml-auto"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus />
        </Button>
      </div>

      {/* Saving Targets List */}
      <div className="space-y-3 mt-3">
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

            return (
              <Card key={savingTarget.id}>
                <CardHeader className="flex items-start justify-between px-4 py-2">
                  <div className="flex items-start gap-3 flex-1 m-auto">
                    <div className="font-semibold truncate">{savingTarget.name}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleEdit(savingTarget)}
                  >
                    <Edit2 className="size-3.5" />
                  </Button>
                </CardHeader>

                <div className="space-y-2 p-4">
                  {savingTarget && (
                    <p className="text-sm text-muted-foreground">
                      {savingTarget.institutionName} - {savingTarget.accountName}
                    </p>
                  )}
                  <Progress
                    value={Math.min(percentage, 100)}
                    className="bg-gray-200"
                    activeColorClass="bg-cardHeader"
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
              </Card>
            );
          })
        )}
      </div>

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
