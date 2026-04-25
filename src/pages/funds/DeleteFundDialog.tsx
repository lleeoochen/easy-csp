import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/common/dialog';
import { DialogActionPanel } from '@/components/common/DialogActionPanel';
import { useDeleteFund } from '@/hooks/api/useFunds';
import type { UI_Fund } from '@/types/uiTypes';
import { toast } from 'react-hot-toast';

interface DeleteFundDialogProps {
  open: boolean;
  fund: UI_Fund | null;
  onClose: () => void;
}

export const DeleteFundDialog = ({ open, fund, onClose }: DeleteFundDialogProps) => {
  const deleteFund = useDeleteFund();

  const handleDelete = async () => {
    if (!fund) return;

    try {
      await deleteFund.mutateAsync(fund.id);
      toast.success('Fund deleted successfully');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete fund');
    }
  };

  if (!fund) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Fund</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{fund.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogActionPanel
          submit={{
            label: deleteFund.isPending ? 'Deleting...' : 'Delete Fund',
            onClick: handleDelete,
            disabled: deleteFund.isPending,
            className: 'bg-red-400!'
          }}
          cancel={{
            label: 'Cancel',
            onClick: onClose,
            disabled: deleteFund.isPending,
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
