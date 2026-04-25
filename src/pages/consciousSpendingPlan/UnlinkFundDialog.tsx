import { DialogActionPanel } from '@/components/common/DialogActionPanel';
import { Checkbox } from '@/components/common/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/common/dialog';
import { useDeleteCSPItem } from '@/hooks/api/useCSP';
import { CSPBucket } from "@easy-csp/shared-types";
import { useState } from "react";
import { toast } from "react-hot-toast";

interface UnlinkFundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fundId: string;
  fundName: string;
  bucket: CSPBucket;
}

export const UnlinkFundDialog = ({
  open,
  onOpenChange,
  fundId,
  fundName,
  bucket
}: UnlinkFundDialogProps) => {
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [disableFundStatus, setDisableFundStatus] = useState(false);
  const deleteCSPItem = useDeleteCSPItem();

  const handleUnlink = async () => {
    setIsUnlinking(true);

    try {
      // Remove the CSP item (unlink from category)
      await deleteCSPItem.mutateAsync({
        bucket,
        category: fundId,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error unlinking fund:", error);
      toast.error("Failed to unlink fund");
    } finally {
      setIsUnlinking(false);
      setDisableFundStatus(false);
    }
  };

  const handleCancel = () => {
    setDisableFundStatus(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unlink {bucket === CSPBucket.Savings ? 'Savings' : 'Investment'} Fund</DialogTitle>
          <DialogDescription>
            This will remove "{fundName}" from your {bucket === CSPBucket.Savings ? 'savings' : 'investment'} bucket.
            Transactions will no longer be automatically categorized.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="disable-fund"
              checked={disableFundStatus}
              onCheckedChange={(checked) => setDisableFundStatus(checked === true)}
              disabled={isUnlinking}
            />
            <label
              htmlFor="disable-fund"
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Also disable fund fund status
              <p className="text-xs text-gray-500 mt-1">
                If unchecked, the fund will remain a fund fund and can still be used for fund allocation.
              </p>
            </label>
          </div>
        </div>

        <DialogActionPanel
          submit={{
            label: isUnlinking ? "Unlinking..." : "Unlink Fund",
            onClick: handleUnlink,
            disabled: isUnlinking,
          }}
          cancel={{
            label: "Cancel",
            onClick: handleCancel,
            disabled: isUnlinking,
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
