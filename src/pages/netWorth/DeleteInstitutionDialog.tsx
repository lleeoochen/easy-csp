import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/common/dialog';
import { Button } from '@/components/common/button';
import { Input } from '@/components/common/input';
import type { FinancialInstitution } from '@easy-csp/shared-types';
import type { UI_FinancialAccount } from '@/types/uiTypes';
import { useDeleteFinancialInstitution } from '@/hooks/api/useFinancialInstitutions';
import { toast } from 'react-hot-toast';

interface DeleteInstitutionDialogProps {
  open: boolean;
  institution: FinancialInstitution | null;
  accounts: UI_FinancialAccount[];
  onClose: () => void;
}

export const DeleteInstitutionDialog = ({ open, institution, accounts, onClose }: DeleteInstitutionDialogProps) => {
  const [confirmText, setConfirmText] = useState('');
  const deleteMutation = useDeleteFinancialInstitution();

  const institutionName = institution?.institutionName ?? '';
  const isConfirmed = confirmText === institutionName;

  const handleDelete = async () => {
    if (!institution || !isConfirmed) return;

    try {
      await deleteMutation.mutateAsync({ institutionId: institution.institutionId });
      toast.success(`${institutionName} removed`);
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove institution';
      toast.error(message);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  if (!institution) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove Institution</DialogTitle>
          <DialogDescription>
            This will permanently disconnect from {institutionName} and delete all linked accounts. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <div className="p-4 bg-muted rounded-lg space-y-1">
            <div className="font-semibold">{institutionName}</div>
            <div className="text-sm text-muted-foreground">
              {accounts.length} account{accounts.length !== 1 ? 's' : ''} will be deleted:
            </div>
            <ul className="text-sm text-muted-foreground list-disc list-inside">
              {accounts.map((a) => (
                <li key={a.id}>{a.displayName}</li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-muted-foreground">
            Transactions will be kept but no longer associated with an active account.
          </p>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              Type <span className="font-bold">{institutionName}</span> to confirm
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={institutionName}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleDelete}
            disabled={!isConfirmed || deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Removing...' : 'Remove Institution'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
