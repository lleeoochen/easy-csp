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
import { useUpdateTransaction, useDeleteTransaction, useCreateTransaction } from "../../hooks/api/useTransactions";
import "../../components/common/datepicker.css";
import { formatCurrency, getTransactionSignPrefix } from "../../utils/financialUtils";
import { Split } from "lucide-react";

interface TransactionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  prefilledSavingTargetId?: string;
}

export const TransactionEditDialog = ({ open, onOpenChange, transaction, prefilledSavingTargetId }: TransactionEditDialogProps) => {
  const { data: institutions = [] } = useFinancialInstitutions();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const createTransaction = useCreateTransaction();

  const isCreateMode = transaction === null;
  // Manual transaction detection: create mode OR transaction has no institutionId
  const isManual = isCreateMode || !transaction?.institutionId;

  const [selectedCategory, setSelectedCategory] = useState<string>(
    transaction?.category || CSPCategory.Others
  );
  const [selectedFund, setSelectedFund] = useState<string>(
    prefilledSavingTargetId || transaction?.savingTargetId || ''
  );
  const [nickname, setNickname] = useState<string>(
    transaction?.nickname || ''
  );
  const [selectedDate, setSelectedDate] = useState<Date>(
    transaction ? new Date(transaction.datetime) : new Date()
  );
  const [transactionName, setTransactionName] = useState<string>(
    transaction?.name || ''
  );
  const [transactionAmount, setTransactionAmount] = useState<string>(
    transaction ? Math.abs(transaction.amount).toString() : ''
  );
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>(
    transaction ? (transaction.amount < 0 ? 'income' : 'expense') : 'expense'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    amount?: string;
    date?: string;
  }>({});

  const isAlreadySplit = !!(transaction?.splitParentId);
  const isSplitParent = transaction?.splitParentId === transaction?.id;

  // Validation function
  const validateFields = (): boolean => {
    const errors: typeof validationErrors = {};

    if (isManual) {
      // Validate name
      if (!transactionName || transactionName.trim() === '') {
        errors.name = 'Transaction name is required';
      }

      // Validate amount
      const amount = parseFloat(transactionAmount);
      if (isNaN(amount) || amount === 0) {
        errors.amount = 'Amount must be non-zero';
      }

      // Validate date
      if (isNaN(selectedDate.getTime())) {
        errors.date = 'Please enter a valid date';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Update state when transaction changes
  useEffect(() => {
    if (transaction) {
      setSelectedCategory(transaction.category);
      setSelectedFund(transaction.savingTargetId || '');
      setNickname(transaction.nickname || '');
      setSelectedDate(new Date(transaction.datetime));
      setTransactionName(transaction.name);
      setTransactionAmount(Math.abs(transaction.amount).toString());
      setTransactionType(transaction.amount < 0 ? 'income' : 'expense');
    } else {
      // Reset for create mode
      setSelectedCategory(CSPCategory.Others);
      setSelectedFund(prefilledSavingTargetId || '');
      setNickname('');
      setSelectedDate(new Date());
      setTransactionName('');
      setTransactionAmount('');
      setTransactionType('expense');
    }
  }, [transaction, prefilledSavingTargetId]);

  const handleSave = async () => {
    if (isCreateMode) {
      // Create mode - validate and create new manual transaction
      if (!validateFields()) return;

      setIsLoading(true);
      try {
        const absoluteAmount = parseFloat(transactionAmount);
        const finalAmount = transactionType === 'income' ? -absoluteAmount : absoluteAmount;

        const newTransaction: Omit<Transaction, 'id' | 'uid'> = {
          name: transactionName,
          amount: finalAmount,
          datetime: selectedDate.getTime(),
          category: selectedCategory,
          savingTargetId: selectedFund || undefined,
          nickname: nickname || undefined,
          institutionId: null as unknown as string, // Manual transaction
          accountId: null as unknown as string, // Manual transaction
          plaidCategory: 'Manual',
          hidden: false,
        };

        await createTransaction.mutateAsync(newTransaction);
        onOpenChange(false);
      } catch (error) {
        console.error('Error creating transaction:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Edit mode - update existing transaction
      if (!transaction) return;

      setIsLoading(true);
      try {
        // Build updates object
        const updates: Partial<Transaction> = {
          category: selectedCategory,
          savingTargetId: selectedFund || undefined,
          nickname: nickname || undefined,
        };

        // For manual transactions, allow updating name, amount, and date
        if (isManual) {
          if (!validateFields()) {
            setIsLoading(false);
            return;
          }
          const absoluteAmount = parseFloat(transactionAmount);
          const finalAmount = transactionType === 'income' ? -absoluteAmount : absoluteAmount;

          updates.name = transactionName;
          updates.amount = finalAmount;
          updates.datetime = selectedDate.getTime();
        } else {
          // For Plaid transactions, only update datetime if changed
          const newTimestamp = selectedDate.getTime();
          if (newTimestamp !== transaction.datetime) {
            updates.datetime = newTimestamp;
          }
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
    }
  };

  const handleCancel = () => {
    if (transaction) {
      setSelectedCategory(transaction.category);
      setSelectedFund(transaction.savingTargetId || '');
      setNickname(transaction.nickname || '');
      setSelectedDate(new Date(transaction.datetime));
      setTransactionName(transaction.name);
      setTransactionAmount(Math.abs(transaction.amount).toString());
      setTransactionType(transaction.amount < 0 ? 'income' : 'expense');
    } else {
      // Reset for create mode
      setSelectedCategory(CSPCategory.Miscellaneous);
      setSelectedFund(prefilledSavingTargetId || '');
      setNickname('');
      setSelectedDate(new Date());
      setTransactionName('');
      setTransactionAmount('');
      setTransactionType('expense');
    }
    setShowDeleteConfirm(false);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!transaction || !isManual) return;

    setIsLoading(true);
    try {
      await deleteTransaction.mutateAsync(transaction.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const institution = useMemo(() => {
    return institutions.find(institution => institution.institutionId === transaction?.institutionId);
  }, [institutions, transaction?.institutionId]);

  const account = useMemo(() => {
    return institution?.accounts.find(account => account.accountId === transaction?.accountId);
  }, [institution?.accounts, transaction?.accountId]);

  if (!transaction && !isCreateMode) return null;

  const hasChanges = isCreateMode ? true : (
    selectedCategory !== transaction.category ||
    (selectedFund || null) !== (transaction.savingTargetId || null) ||
    nickname !== (transaction.nickname || '') ||
    selectedDate.getTime() !== transaction.datetime ||
    parseFloat(transactionAmount) !== Math.abs(transaction.amount) ||
    transactionType !== (transaction.amount < 0 ? 'income' : 'expense')
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isCreateMode ? 'Add Transaction' : transaction.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!isCreateMode && isAlreadySplit && (
              <div className="bg-primary-bg rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-primary-fg">
                  <Split size={18} strokeWidth={2.5} />
                  <span className="font-medium">
                    {isSplitParent ? 'Split Parent Transaction' : 'Split Transaction'}
                  </span>
                </div>
                <p className="text-xs text-white/90 mt-1">
                  {isSplitParent
                    ? 'This transaction has been split into multiple parts'
                    : 'This is part of a split transaction'}
                </p>
              </div>
            )}

            {!isCreateMode && !isManual && (
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Transaction Name</Label>
                <p className="text-sm text-gray-500">{transaction.name}</p>
              </div>
            )}

            {(isCreateMode || isManual) && (
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Transaction Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={transactionName}
                  onChange={(e) => setTransactionName(e.target.value)}
                  placeholder="Enter transaction name..."
                />
                {validationErrors.name && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.name}</p>
                )}
              </div>
            )}

            {(isCreateMode || isManual) && (
              <div>
                <Label className="text-sm font-medium text-gray-700">Type</Label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setTransactionType('expense')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      transactionType === 'expense'
                        ? 'bg-primary-bg text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionType('income')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      transactionType === 'income'
                        ? 'bg-primary-bg text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount" className="text-sm font-medium text-gray-700">Amount</Label>
                {isManual ? (
                  <>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={transactionAmount}
                      onChange={(e) => setTransactionAmount(e.target.value)}
                      placeholder="0.00"
                    />
                    {validationErrors.amount && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.amount}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">{getTransactionSignPrefix(transaction.amount)}{formatCurrency(transaction.amount)}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Account</Label>
                {isManual ? (
                  <p className="text-sm text-gray-500">Manual Entry</p>
                ) : (
                  <p className="text-sm text-gray-500">{institution?.institutionName} - {account?.accountName}</p>
                )}
              </div>
            </div>

            {!isCreateMode && !isManual && (
              <div>
                <Label className="text-sm font-medium text-gray-700">Plaid Label</Label>
                <p className="text-sm text-gray-500">{upperCaseToSentence(transaction.plaidCategory)}</p>
              </div>
            )}

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
            <div>
              <DatePicker
                id="date"
                label="Date"
                value={selectedDate}
                onChange={setSelectedDate}
                disabled={!isManual}
              />
              {validationErrors.date && (
                <p className="text-xs text-red-600 mt-1">{validationErrors.date}</p>
              )}
            </div>
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
            {showDeleteConfirm ? (
              <div className="flex flex-col">
                <div className="text-sm text-red-600 mr-auto">Are you sure you want to delete this transaction?</div>
                <div className="flex flex-row justify-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isLoading ? 'Deleting...' : 'Confirm'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                {!isCreateMode && isManual && (
                  <Button
                    variant="secondary"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                )}
                {!isCreateMode && !isManual && (
                  <Button
                    variant="secondary"
                    onClick={() => setSplitDialogOpen(true)}
                    disabled={isLoading || isAlreadySplit}
                    title={isAlreadySplit ? "Transaction is already split" : "Split this transaction"}
                  >
                    Split
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={isLoading || !hasChanges}
                >
                  {isLoading ? 'Saving...' : (isCreateMode ? 'Create' : 'Save')}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!isCreateMode && transaction && (
        <TransactionSplitDialog
          open={splitDialogOpen}
          onOpenChange={(open) => {
            setSplitDialogOpen(open);
            if (!open) onOpenChange(false);
          }}
          transaction={transaction}
        />
      )}
    </>
  );
};
