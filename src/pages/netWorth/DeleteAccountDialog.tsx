import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/common/dialog';
import { Button } from '@/components/common/button';
import type { UI_FinancialAccount } from '@/types/uiTypes';
import { useDeleteManualAccount } from '@/hooks/api/useAccounts';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/utils/financialUtils';

interface DeleteAccountDialogProps {
  open: boolean;
  account: UI_FinancialAccount | null;
  onClose: () => void;
}

export const DeleteAccountDialog = ({ open, account, onClose }: DeleteAccountDialogProps) => {
  const deleteMutation = useDeleteManualAccount();

  const handleDelete = async () => {
    if (!account) return;

    try {
      await deleteMutation.mutateAsync({ accountId: account.id });
      toast.success('Account deleted successfully');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
    }
  };

  if (!account || !account.isManual) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this account? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2">
          <div className="p-4 bg-muted rounded-lg">
            <div className="font-semibold">{account.displayName}</div>
            <div className="text-sm text-muted-foreground">{account.accountName}</div>
            <div className="text-lg font-bold mt-2">{formatCurrency(account.balance, 2, true)}</div>
          </div>

          <p className="text-sm text-muted-foreground">
            This will permanently delete the account and all associated data.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
