import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/common/dialog";
import { DialogActionPanel } from "../../components/common/DialogActionPanel";
import { CSPBucket } from "@easy-csp/shared-types";
import { useDeleteCSPItem } from "../../hooks/api/useCSP";
import { ACCOUNTS_QUERY_KEY, ACCOUNTS_WITH_INFO_QUERY_KEY } from "../../hooks/api/useAccounts";
import { AccountService } from "../../services/accountService";
import { toast } from "react-hot-toast";
import { Checkbox } from "../../components/common/checkbox";

interface UnlinkAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  accountName: string;
  bucket: CSPBucket;
}

export const UnlinkAccountDialog = ({
  open,
  onOpenChange,
  accountId,
  accountName,
  bucket
}: UnlinkAccountDialogProps) => {
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [disableFundStatus, setDisableFundStatus] = useState(false);
  const queryClient = useQueryClient();
  const deleteCSPItem = useDeleteCSPItem();

  const handleUnlink = async () => {
    setIsUnlinking(true);

    try {
      // Remove the CSP item (unlink from category)
      await deleteCSPItem.mutateAsync({
        bucket,
        category: accountId,
      });

      // If user wants to disable fund status, do it
      if (disableFundStatus) {
        try {
          await AccountService.updateFundAccountStatus(accountId, false);

          // Invalidate accounts cache to reflect updated fund status
          queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
          queryClient.invalidateQueries({ queryKey: ACCOUNTS_WITH_INFO_QUERY_KEY });

          toast.success(`Account unlinked and fund status disabled`);
        } catch (error) {
          console.error("Failed to disable fund status:", error);
          toast.success(`Account unlinked from ${bucket === CSPBucket.Savings ? 'Savings' : 'Investment'}`);
          toast.error("Could not disable fund status. Please disable manually in Account Settings.");
        }
      } else {
        toast.success(`Account unlinked from ${bucket === CSPBucket.Savings ? 'Savings' : 'Investment'}`);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error unlinking account:", error);
      toast.error("Failed to unlink account");
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
          <DialogTitle>Unlink {bucket === CSPBucket.Savings ? 'Savings' : 'Investment'} Account</DialogTitle>
          <DialogDescription>
            This will remove "{accountName}" from your {bucket === CSPBucket.Savings ? 'savings' : 'investment'} bucket.
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
              Also disable fund account status
              <p className="text-xs text-gray-500 mt-1">
                If unchecked, the account will remain a fund account and can still be used for fund allocation.
              </p>
            </label>
          </div>
        </div>

        <DialogActionPanel
          submit={{
            label: isUnlinking ? "Unlinking..." : "Unlink Account",
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
