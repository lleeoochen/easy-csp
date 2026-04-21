import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/common/dialog';
import { DialogActionPanel } from '@/components/common/DialogActionPanel';
import { AccountSelector } from '@/components/common/AccountSelector';
import { CSPBucket, AccountType } from "@easy-csp/shared-types";
import { useAddCSPItem, useCSP } from '@/hooks/api/useCSP';
import { useAccountsWithInfo, ACCOUNTS_QUERY_KEY, ACCOUNTS_WITH_INFO_QUERY_KEY } from '@/hooks/api/useAccounts';
import { AccountService } from '@/services/accountService';
import { toast } from "react-hot-toast";

interface LinkAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bucket: CSPBucket;
}

export const LinkAccountDialog = ({ open, onOpenChange, bucket }: LinkAccountDialogProps) => {
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const queryClient = useQueryClient();
  const addCSPItem = useAddCSPItem();
  const { data: accounts = [] } = useAccountsWithInfo();
  const { data: csp } = useCSP();

  // Filter out accounts that are already linked to Savings or Investment buckets
  const availableAccounts = accounts.filter(account => {
    if (!csp) return true;
    const savingsItems = csp[CSPBucket.Savings] || [];
    const investmentItems = csp[CSPBucket.Investment] || [];
    const allLinkedAccountIds = [...savingsItems, ...investmentItems]
      .filter(item => item.isTrackingAccount)
      .map(item => item.category);
    return !allLinkedAccountIds.includes(account.id);
  });

  const handleSave = async () => {
    if (!selectedAccountId) {
      return;
    }

    setIsLinking(true);

    try {
      // Find the selected account
      const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
      if (!selectedAccount) {
        toast.error("Selected account not found");
        return;
      }

      // Validate account type for Savings/Investment buckets
      if (bucket === CSPBucket.Savings || bucket === CSPBucket.Investment) {
        const liabilityTypes: AccountType[] = [AccountType.Credit, AccountType.Loan];
        if (liabilityTypes.includes(selectedAccount.accountType)) {
          toast.error("Only asset accounts can be linked to savings/investment categories");
          return;
        }
      }

      // Add the account as a CSP tracking item
      await addCSPItem.mutateAsync({
        bucket,
        category: selectedAccountId,
        amount: 0,
        isTrackingAccount: true,
        name: selectedAccount.displayName
      });

      // Handle automatic fund enablement for Savings/Investment buckets
      try {
        const result = await AccountService.handleCSPCategoryLinking(selectedAccountId, bucket);

        // Invalidate accounts cache to reflect updated fund status
        queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: ACCOUNTS_WITH_INFO_QUERY_KEY });

        if (result.success) {
          if (result.message === "Fund account status enabled") {
            toast.success(`Account linked to ${bucket === CSPBucket.Savings ? 'Savings' : 'Investment'} and enabled as fund account`);
          } else {
            toast.success(`Account linked to ${bucket === CSPBucket.Savings ? 'Savings' : 'Investment'}`);
          }
        }
      } catch (error) {
        // If fund enablement fails, still show success for the link but warn about fund status
        console.error("Fund enablement error:", error);
        toast.success(`Account linked to ${bucket === CSPBucket.Savings ? 'Savings' : 'Investment'}`);
        toast.error("Could not enable fund status. Please enable manually in Account Settings.");
      }

      setSelectedAccountId("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error linking account:", error);
      // Extract error message from Error object or use default
      let errorMessage = "Failed to link account";

      if (error instanceof Error) {
        if (error.message.includes("Category already exists")) {
          errorMessage = "This account is already linked to this bucket";
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
    setSelectedAccountId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link Account</DialogTitle>
          <DialogDescription>
            Select an account to link to your {bucket === CSPBucket.Savings ? 'savings' : 'investment'} bucket.
            Transactions from this account will automatically be categorized.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <AccountSelector
            value={selectedAccountId}
            onValueChange={setSelectedAccountId}
            label="Account"
            placeholder="Select an account"
            disabled={isLinking}
            accounts={availableAccounts}
          />
          {availableAccounts.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              All accounts are already linked to this bucket.
            </p>
          )}
        </div>

        <DialogActionPanel
          submit={{
            label: isLinking ? "Linking..." : "Link Account",
            onClick: handleSave,
            disabled: !selectedAccountId || isLinking,
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
