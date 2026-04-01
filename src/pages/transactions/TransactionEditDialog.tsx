import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/common/dialog";
import { Button } from "../../components/common/button";
import { Label } from "../../components/common/label";
import { Input } from "../../components/common/input";
import { DatePicker } from "../../components/common/DatePicker";
import { CategorySelector } from "../../components/common/CategorySelector";
import { SavingTargetSelector } from "../../components/common/SavingTargetSelector";
import { TransactionSplitDialog } from "./TransactionSplitDialog";
import type { Transaction } from "@easy-csp/shared-types";
import { CSPCategory } from "@easy-csp/shared-types";
import { upperCaseToSentence } from "../../utils/stringUtils";
import { useFinancialInstitutions } from "../../hooks/api/useFinancialInstitutions";
import { useUpdateTransaction } from "../../hooks/api/useTransactions";
import "../../components/common/datepicker.css";
import { formatCurrency, getTransactionSignPrefix } from "../../utils/financialUtils";

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
  const [selectedFund, setSelectedFund] = useState<string>(
    transaction?.savingTargetId || ''
  );
  const [nickname, setNickname] = useState<string>(
    transaction?.nickname || ''
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);

  const isAlreadySplit = !!(transaction?.splitParentId);

  // Update state when transaction changes
  useEffect(() => {
    if (transaction) {
      setSelectedCategory(transaction.category);
      setSelectedFund(transaction.savingTargetId || '');
      setNickname(transaction.nickname || '');
      setSelectedDate(new Date(transaction.datetime));
    }
  }, [transaction]);

  const handleSave = async () => {
    if (!transaction) return;

    setIsLoading(true);
    try {
      // Build updates object
      const updates: Partial<Transaction> = {
        category: selectedCategory,
        savingTargetId: selectedFund,
        nickname: nickname,
      };

      // Convert date to epoch timestamp if changed
      const newTimestamp = selectedDate.getTime();
      if (newTimestamp !== transaction.datetime) {
        updates.datetime = newTimestamp;
      }

      await updateTransaction.mutateAsync({
        transactionId: transaction.id,
        updates,
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
      setSelectedFund(transaction.savingTargetId || '');
      setNickname(transaction.nickname || '');
      setSelectedDate(new Date(transaction.datetime));
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

  const hasChanges = selectedCategory !== transaction.category ||
                     (selectedFund || null) !== (transaction.savingTargetId || null) ||
                     nickname !== (transaction.nickname || '') ||
                     selectedDate.getTime() !== transaction.datetime;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{transaction.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Amount</Label>
                <p className="text-sm text-gray-500">{getTransactionSignPrefix(transaction.amount)}{formatCurrency(transaction.amount)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Account</Label>
                <p className="text-sm text-gray-500">{institution?.institutionName} - {account?.accountName}</p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Plaid Label</Label>
              <p className="text-sm text-gray-500">{upperCaseToSentence(transaction.plaidCategory)}</p>
            </div>
            <div>
              <Label htmlFor="nickname" className="text-sm font-medium text-gray-700">Nickname (Optional)</Label>
              <Input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Add a custom name..."
              />
            </div>
            <DatePicker
              id="date"
              label="Date"
              value={selectedDate}
              onChange={setSelectedDate}
            />
            <CategorySelector
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              label="Category"
              disabled={false}
              includeAllOption={false}
            />
            <SavingTargetSelector
              value={selectedFund}
              onValueChange={setSelectedFund}
              label="Fund (Optional)"
              placeholder="Excluded from funds"
              includeNoneOption={true}
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
              variant="secondary"
              onClick={() => setSplitDialogOpen(true)}
              disabled={isLoading || isAlreadySplit}
              title={isAlreadySplit ? "Transaction is already split" : "Split this transaction"}
            >
              Split
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isLoading || !hasChanges}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TransactionSplitDialog
        open={splitDialogOpen}
        onOpenChange={(open) => {
          setSplitDialogOpen(open);
          if (!open) onOpenChange(false);
        }}
        transaction={transaction}
      />
    </>
  );
};
