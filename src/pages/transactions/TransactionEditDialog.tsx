import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/common/dialog";
import { Button } from "../../components/common/button";
import { Label } from "../../components/common/label";
import { CategorySelector } from "../../components/common/CategorySelector";
import type { Transaction } from "@easy-csp/shared-types";
import { CSPCategory } from "@easy-csp/shared-types";
import { upperCaseToSentence } from "../../utils/stringUtils";
import { useFinancialInstitutions } from "../../hooks/api/useFinancialInstitutions";
import { useUpdateTransaction } from "../../hooks/api/useTransactions";

interface TransactionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

export const TransactionEditDialog = ({ open, onOpenChange, transaction }: TransactionEditDialogProps) => {
  const { data: institutions = [] } = useFinancialInstitutions();
  const updateTransaction = useUpdateTransaction();
  const [selectedCategory, setSelectedCategory] = useState<string>(
    transaction?.category || CSPCategory.Miscellaneous
  );
  const [isLoading, setIsLoading] = useState(false);

  // Update selectedCategory when transaction changes
  useEffect(() => {
    if (transaction) {
      setSelectedCategory(transaction.category);
    }
  }, [transaction]);

  const handleSave = async () => {
    if (!transaction) return;

    setIsLoading(true);
    try {
      await updateTransaction.mutateAsync({
        transactionId: transaction.id,
        updates: { category: selectedCategory },
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (transaction) {
      setSelectedCategory(transaction.category);
    }
    onOpenChange(false);
  };

  const institution = useMemo(() => {
    return institutions.find(institution => institution.institutionId === transaction?.institutionId);
  }, [institutions, transaction?.institutionId]);

  const account = useMemo(() => {
    return institution?.accounts.find(account => account.accountId === transaction?.accountId);
  }, [institution?.accounts, transaction?.accountId]);

  if (!transaction) return null;


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{transaction.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3">
            <div>
              <Label className="text-sm font-medium text-gray-700">Amount</Label>
              <p className="text-sm text-gray-500">${transaction.amount.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Date</Label>
              <p className="text-sm text-gray-500">{new Date(transaction.datetime).toLocaleDateString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Hidden</Label>
              <p className="text-sm text-gray-500">{transaction.hidden.toString()}</p>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Account</Label>
            <p className="text-sm text-gray-500">{institution?.institutionName} - {account?.accountName}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Plaid Label</Label>
            <p className="text-sm text-gray-500">{upperCaseToSentence(transaction.plaidCategory)}</p>
          </div>
          <CategorySelector
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          />
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isLoading || selectedCategory === transaction.category}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
