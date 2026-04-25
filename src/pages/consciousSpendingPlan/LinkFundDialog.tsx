import { DialogActionPanel } from '@/components/common/DialogActionPanel';
import { FundSelector } from '@/components/common/FundSelector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/common/dialog';
import { useAddCSPItem, useCSP } from '@/hooks/api/useCSP';
import { useFunds } from '@/hooks/api/useFunds';
import { CSPBucket } from "@easy-csp/shared-types";
import { useState } from "react";
import { toast } from "react-hot-toast";

interface LinkFundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bucket: CSPBucket;
}

export const LinkFundDialog = ({ open, onOpenChange, bucket }: LinkFundDialogProps) => {
  const [selectedFundId, setSelectedFundId] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const addCSPItem = useAddCSPItem();
  const { data: funds = [] } = useFunds();
  const { data: csp } = useCSP();

  const savingsItems = csp?.[CSPBucket.Savings] || [];
  const investmentItems = csp?.[CSPBucket.Investment] || [];

  const allLinkedFundIds = [...savingsItems, ...investmentItems]
    .filter(item => item.isTrackingFund)
    .map(item => item.category);

  // Filter out funds that are already linked to Savings or Investment buckets
  const availableFunds = funds.filter(fund => {
    return !allLinkedFundIds.includes(fund.id);
  });

  const handleSave = async () => {
    if (!selectedFundId) {
      return;
    }

    setIsLinking(true);

    try {
      // Find the selected fund
      const selectedFund = funds.find(acc => acc.id === selectedFundId);
      if (!selectedFund) {
        toast.error("Selected fund not found");
        return;
      }

      // Add the fund as a CSP tracking item
      await addCSPItem.mutateAsync({
        bucket,
        category: selectedFundId,
        amount: 0,
        isTrackingFund: true,
        name: selectedFund.name
      });

      setSelectedFundId("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error linking fund:", error);
      // Extract error message from Error object or use default
      let errorMessage = "Failed to link fund";

      if (error instanceof Error) {
        if (error.message.includes("Category already exists")) {
          errorMessage = "This fund is already linked to this bucket";
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsLinking(false);
    }
  };

  const handleCancel = () => {
    setSelectedFundId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link Fund</DialogTitle>
          <DialogDescription>
            Select an fund to link to your {bucket === CSPBucket.Savings ? 'savings' : 'investment'} bucket.
            Transactions from this fund will automatically be categorized.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <FundSelector
            value={selectedFundId}
            onValueChange={setSelectedFundId}
            label="Fund"
            placeholder="Select an fund"
            disabled={isLinking}
            funds={availableFunds}
          />
          {availableFunds.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              All funds are already linked to this bucket.
            </p>
          )}
        </div>

        <DialogActionPanel
          submit={{
            label: isLinking ? "Linking..." : "Link Fund",
            onClick: handleSave,
            disabled: !selectedFundId || isLinking,
          }}
          cancel={{
            label: "Cancel",
            onClick: handleCancel,
            disabled: isLinking,
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
