import { useState } from "react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./dialog";
import { cn } from "./utils";

interface ActionConfig {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  className?: string;
  title?: string;
  confirmation?: {
    title: string;
    message: string;
  };
}

interface DeleteActionConfig extends Omit<ActionConfig, 'variant'> {
  confirmation?: {
    title: string;
    message: string;
  };
}

interface DialogActionPanelProps {
  cancel?: Omit<ActionConfig, 'variant'>;
  submit?: Omit<ActionConfig, 'variant'>;
  delete?: DeleteActionConfig;
  customActions?: ActionConfig[];
  isLoading?: boolean;
  className?: string;
}

export function DialogActionPanel({
  cancel,
  submit,
  delete: deleteAction,
  customActions,
  isLoading,
  className
}: DialogActionPanelProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmingActionIndex, setConfirmingActionIndex] = useState<number | null>(null);

  const handleDeleteClick = () => {
    if (deleteAction?.confirmation) {
      setShowDeleteConfirm(true);
    } else {
      deleteAction?.onClick?.();
    }
  };

  const handleDeleteConfirm = () => {
    deleteAction?.onClick?.();
    setShowDeleteConfirm(false);
  };

  const handleCustomActionClick = (action: ActionConfig, index: number) => {
    if (action.confirmation) {
      setConfirmingActionIndex(index);
    } else {
      action.onClick?.();
    }
  };

  const handleCustomActionConfirm = () => {
    if (confirmingActionIndex !== null && customActions) {
      customActions[confirmingActionIndex]?.onClick?.();
      setConfirmingActionIndex(null);
    }
  };

  return (
    <>
      {/* Delete Confirmation Dialog */}
      {deleteAction?.confirmation && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="z-60">
            <DialogHeader>
              <DialogTitle>{deleteAction.confirmation.title}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600 py-4">
              {deleteAction.confirmation.message}
            </p>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteConfirm}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Custom Action Confirmation Dialog */}
      {confirmingActionIndex !== null && customActions?.[confirmingActionIndex]?.confirmation && (
        <Dialog open={true} onOpenChange={() => setConfirmingActionIndex(null)}>
          <DialogContent className="z-60">
            <DialogHeader>
              <DialogTitle>{customActions[confirmingActionIndex].confirmation!.title}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600 py-4">
              {customActions[confirmingActionIndex].confirmation!.message}
            </p>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setConfirmingActionIndex(null)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCustomActionConfirm}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Action Panel */}
      <div className={cn("flex items-center justify-between", className)}>
        <div className="flex items-center gap-2">
          {deleteAction && (
            <Button
              variant="secondary"
              onClick={handleDeleteClick}
              disabled={deleteAction.disabled || isLoading}
              className={cn("bg-red-400! text-white!", deleteAction.className)}
              title={deleteAction.title}
            >
              {deleteAction.label}
            </Button>
          )}
          {customActions?.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'secondary'}
              onClick={() => handleCustomActionClick(action, index)}
              disabled={action.disabled || isLoading}
              className={action.className}
              title={action.title}
            >
              {action.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {
            cancel
            ? <Button
                variant="secondary"
                onClick={cancel.onClick}
                disabled={cancel.disabled || isLoading}
                className={cancel.className}
                title={cancel.title}
              >
                {cancel.label}
              </Button>
            : undefined
          }
          
          {
            submit
            ? <Button
                variant="primary"
                onClick={submit.onClick}
                disabled={submit.disabled || isLoading}
                className={submit.className}
                title={submit.title}
              >
                {submit.label}
              </Button>
            : undefined
          }
        </div>
      </div>
    </>
  );
}
