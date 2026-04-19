import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './dialog';
import { DialogActionPanel } from './DialogActionPanel';
import { useFundTransactions } from '../../hooks/api/useFundAccounts';

interface FundAccountWarningDialogProps {
  open: boolean;
  fundAccountId: string | null;
  fundAccountName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const FundAccountWarningDialog = ({
  open,
  fundAccountId,
  fundAccountName,
  onConfirm,
  onCancel,
  isLoading = false,
}: FundAccountWarningDialogProps) => {
  // Query transactions allocated to this fund to get count
  const { data: transactions = [], isLoading: isLoadingTransactions } = useFundTransactions(
    fundAccountId || '',
    undefined
  );

  const transactionCount = transactions.length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Disable Fund Account?</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            This account currently has{' '}
            <span className="font-semibold text-secondary-fg">
              {isLoadingTransactions ? '...' : transactionCount}
            </span>{' '}
            {transactionCount === 1 ? 'transaction' : 'transactions'} allocated to it.
          </p>

          <p className="text-sm text-muted-foreground">
            Disabling fund account status will not delete these allocations, but they will become
            invalid. You can re-enable fund status later to restore functionality.
          </p>

          <p className="text-sm font-medium text-secondary-fg">
            Are you sure you want to disable fund account status for "{fundAccountName}"?
          </p>
        </div>

        <DialogFooter className="gap-2">
          <DialogActionPanel
            cancel={{
              label: 'Cancel',
              onClick: onCancel,
            }}
            submit={{
              label: isLoading ? 'Disabling...' : 'Disable Anyway',
              onClick: onConfirm,
              disabled: isLoading || isLoadingTransactions,
              variant: 'destructive',
            }}
            isLoading={isLoading}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
