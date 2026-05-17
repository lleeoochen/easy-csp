import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/common/dialog';
import { Button } from '@/components/common/button';
import type { UI_FinancialAccount } from '@/types/uiTypes';
import { useDeleteManualAccount, useArchiveFinancialAccount } from '@/hooks/api/useAccounts';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/utils/financialUtils';

interface DeleteAccountDialogProps {
  open: boolean;
  account: UI_FinancialAccount | null;
  onClose: () => void;
}

export const DeleteAccountDialog = ({ open, account, onClose }: DeleteAccountDialogProps) => {
  const deleteMutation = useDeleteManualAccount();
  const archiveMutation = useArchiveFinancialAccount();

  const handleConfirm = async () => {
    if (!account) return;

    try {
      if (account.isManual) {
        await deleteMutation.mutateAsync({ accountId: account.id });
        toast.success('Account deleted successfully');
      } else {
        await archiveMutation.mutateAsync({ accountId: account.id });
        toast.success('Account archived');
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
    }
  };

  if (!account) return null;

  const isPending = deleteMutation.isPending || archiveMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{account.isManual ? 'Delete Account' : 'Archive Account'}</DialogTitle>
          <DialogDescription>
            {account.isManual
              ? 'Are you sure you want to delete this account? This action cannot be undone.'
              : 'Linked accounts can only be archived, not permanently deleted. To fully remove it, delete the institution.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2">
          <div className="p-4 bg-muted rounded-lg">
            <div className="font-semibold">{account.displayName}</div>
            {account.institutionName && (
              <div className="text-sm text-muted-foreground">{account.institutionName}</div>
            )}
            <div className="text-lg font-bold mt-2">{formatCurrency(account.balance, 2, true)}</div>
          </div>

          <p className="text-sm text-muted-foreground">
            {account.isManual
              ? 'This will permanently delete the account and all associated data.'
              : 'The account will be hidden and stop syncing. Transactions will be kept. You can restore it later.'}
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending
              ? (account.isManual ? 'Deleting...' : 'Archiving...')
              : (account.isManual ? 'Delete Account' : 'Archive Account')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
