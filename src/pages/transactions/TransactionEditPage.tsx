import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Page } from '@/components/Page';
import { Card, CardHeader, CardContent } from '@/components/common/card';
import { Label } from '@/components/common/label';
import { Input } from '@/components/common/input';
import { DatePicker } from '@/components/common/DatePicker';
import { CategorySelector } from '@/components/common/CategorySelector';
import { FundSelector } from '@/components/common/FundSelector';
import { DialogActionPanel } from '@/components/common/DialogActionPanel';
import type { Transaction } from "@easy-csp/shared-types";
import { CSPCategory } from "@easy-csp/shared-types";
import { upperCaseToSentence } from '@/utils/stringUtils';
import { useFinancialInstitutions } from '@/hooks/api/useFinancialInstitutions';
import { useUpdateTransaction, useDeleteTransaction, useCreateTransaction, useTransaction } from '@/hooks/api/useTransactions';
import { useAccounts } from '@/hooks/api/useAccounts';
import "@/components/common/datepicker.css";
import { formatCurrency, getTransactionSignPrefix } from '@/utils/financialUtils';
import { ArrowLeft, Split } from "lucide-react";
import { TransactionSplitDialog } from "./TransactionSplitDialog";
import { Button } from '@/components/common/button';

const TransactionEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isCreateMode = id === 'new';

  const { data: transaction, isLoading: loadingTransaction } = useTransaction(isCreateMode ? null : id!);
  const { data: institutions = [] } = useFinancialInstitutions();
  const { data: accounts = [] } = useAccounts();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const createTransaction = useCreateTransaction();

  const account = transaction?.accountId
    ? accounts.find(acc => acc.id === transaction.accountId)
    : null;
  const isManual = isCreateMode || account?.isManual;

  const [selectedCategory, setSelectedCategory] = useState<string>(CSPCategory.Others);
  const [nickname, setNickname] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [transactionName, setTransactionName] = useState<string>('');
  const [transactionAmount, setTransactionAmount] = useState<string>('');
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [allocatedFundId, setAllocatedFundId] = useState<string>('');
  const [hidden, setHidden] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
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
      if (!transactionName || transactionName.trim() === '') {
        errors.name = 'Transaction name is required';
      }

      const amount = parseFloat(transactionAmount);
      if (isNaN(amount) || amount === 0) {
        errors.amount = 'Amount must be non-zero';
      }

      if (isNaN(selectedDate.getTime())) {
        errors.date = 'Please enter a valid date';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Update state when transaction loads
  useEffect(() => {
    if (transaction) {
      setSelectedCategory(transaction.category);
      setNickname(transaction.nickname || '');
      setSelectedDate(new Date(transaction.datetime));
      setTransactionName(transaction.name);
      setTransactionAmount(Math.abs(transaction.amount).toString());
      setTransactionType(transaction.amount < 0 ? 'income' : 'expense');
      setAllocatedFundId(transaction.allocatedFundId || '');
      setHidden(transaction.hidden);
    }
  }, [transaction]);

  const handleSave = async () => {
    if (isCreateMode) {
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
          nickname: nickname || undefined,
          accountId: null as unknown as string,
          plaidCategory: 'Manual',
          hidden: hidden,
          allocatedFundId: allocatedFundId || undefined,
        };

        await createTransaction.mutateAsync(newTransaction);
        navigate('/transactions');
      } catch (error) {
        console.error('Error creating transaction:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!transaction) return;

      setIsLoading(true);
      try {
        const updates: Partial<Transaction> = {
          category: selectedCategory,
          nickname: nickname || undefined,
          allocatedFundId: allocatedFundId || undefined,
          hidden: hidden,
        };

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
          const newTimestamp = selectedDate.getTime();
          if (newTimestamp !== transaction.datetime) {
            updates.datetime = newTimestamp;
          }
        }

        await updateTransaction.mutateAsync({
          transactionId: transaction.id,
          updates,
        });
        navigate('/transactions');
      } catch (error) {
        console.error('Error updating transaction:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!transaction) return;

    setIsLoading(true);
    try {
      await deleteTransaction.mutateAsync(transaction.id);
      navigate('/transactions');
    } catch (error) {
      console.error('Error deleting transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const institution = account?.institutionId
    ? institutions.find(inst => inst.institutionId === account.institutionId)
    : null;

  if (loadingTransaction) {
    return (
      <Page maxWidth="cozy" title="Edit Transaction">
        <div className="animate-pulse">Loading...</div>
      </Page>
    );
  }

  if (!isCreateMode && !transaction) {
    return (
      <Page maxWidth="cozy" title="Edit Transaction">
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Transaction not found</p>
          <Button
            variant="secondary"
            onClick={() => navigate('/transactions')}
            className="text-primary-fg hover:text-primary-fg/80"
          >
            Back to Transactions
          </Button>
        </div>
      </Page>
    );
  }

  const hasChanges = isCreateMode ? true : (
    selectedCategory !== transaction!.category ||
    nickname !== (transaction!.nickname || '') ||
    allocatedFundId !== (transaction!.allocatedFundId || '') ||
    hidden !== transaction!.hidden ||
    selectedDate.getTime() !== transaction!.datetime ||
    (isManual && (
      transactionName !== transaction!.name ||
      parseFloat(transactionAmount) !== Math.abs(transaction!.amount) ||
      transactionType !== (transaction!.amount < 0 ? 'income' : 'expense')
    ))
  );

  return (
    <>
      <Page maxWidth="cozy" title="Edit Transaction">
        {/* Header with back button */}
        <div className="mb-6">
          <Button
            variant="secondary"
            onClick={() => navigate('/transactions')}
            className="flex items-center gap-2 text-primary-fg hover:text-primary-fg/80 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back to Transactions</span>
          </Button>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              {isCreateMode ? 'Add Transaction' : (isManual ? transactionName : transaction!.name)}
            </h2>
          </CardHeader>
          <CardContent className="space-y-6 py-4">
            <Label htmlFor="nickname" className="text-sm font-medium text-gray-700">Nickname (Optional)</Label>
            <Input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Add a custom name..."
              className="mt-1"
            />
            {/* Transaction Name - Only for manual/create mode */}
            {(isCreateMode || isManual) && (
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Transaction Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={transactionName}
                  onChange={(e) => setTransactionName(e.target.value)}
                  placeholder="Enter transaction name..."
                  className="mt-1"
                />
                {validationErrors.name && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.name}</p>
                )}
              </div>
            )}

          {/* Type Selector - Manual transactions only */}
          {(isCreateMode || isManual) && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Type</Label>
              <div className="flex gap-2 mt-1">
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
              </div>
            </div>
          )}

          {/* Two Column Layout: Amount, Account, Plaid Label */}
          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
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
                    className="mt-1"
                  />
                  {validationErrors.amount && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.amount}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500 mt-1">
                  {getTransactionSignPrefix(transaction!.amount)}{formatCurrency(transaction!.amount)}
                </p>
              )}
            </div>

            {/* Account */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Account</Label>
              {isManual ? (
                <p className="text-sm text-gray-500 mt-1">Manual Entry</p>
              ) : (
                <p className="text-sm text-gray-500 mt-1">
                  {institution?.institutionName} - {account?.accountName}
                </p>
              )}
            </div>

            {/* Date Picker */}
            <div>
              <DatePicker
                id="date"
                label="Date"
                value={selectedDate}
                onChange={setSelectedDate}
                disabled={false}
              />
              {validationErrors.date && (
                <p className="text-xs text-red-600 mt-1">{validationErrors.date}</p>
              )}
            </div>

            {/* Plaid Label - Only for non-manual transactions */}
            {!isCreateMode && !isManual && (
              <div>
                <Label className="text-sm font-medium text-gray-700">Plaid Label</Label>
                <p className="text-sm text-gray-500 mt-1">{upperCaseToSentence(transaction!.plaidCategory)}</p>
              </div>
            )}
          </div>

          {/* Category Selector */}
          <CategorySelector
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            label="Category"
            disabled={false}
            includeAllOption={false}
          />

          {/* Fund Selector */}
          <FundSelector
            value={allocatedFundId}
            onValueChange={setAllocatedFundId}
            label="Allocated Fund (Optional)"
            placeholder="Select a fund to allocate to..."
            disabled={false}
            includeNoneOption={true}
          />

          {/* Hidden Status Toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <Label htmlFor="hidden-toggle" className="text-sm font-medium text-gray-700">
                Hidden
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                Hide this transaction from calculations and summaries
              </p>
            </div>
            <button
              id="hidden-toggle"
              type="button"
              role="switch"
              aria-checked={hidden}
              onClick={() => setHidden(!hidden)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-bg focus:ring-offset-2 ${
                hidden ? 'bg-primary-bg' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  hidden ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          </CardContent>
        </Card>

        {/* Split Status Banner */}
        {!isCreateMode && isAlreadySplit && (
          <Card className="bg-card p-4 mt-2">
            <div className="flex items-center gap-2 text-sm">
              <Split size={18} strokeWidth={2.5} />
              <span className="font-medium">
                {isSplitParent ? 'Split Transaction (Parent)' : 'Split Transaction'}
              </span>
            </div>
            <p className="text-xs mt-1">
              {isSplitParent
                ? 'This transaction has been split into multiple parts.'
                : 'This is part of a split transaction.'}
            </p>
          </Card>
        )}

        {/* Action buttons - Fixed at bottom on mobile */}
        <Card className="bg-card p-4 mt-2">
          <DialogActionPanel
            cancel={{
              label: 'Cancel',
              onClick: () => navigate('/transactions'),
              disabled: isLoading
            }}
            submit={{
              label: isLoading ? 'Saving...' : (isCreateMode ? 'Create' : 'Save'),
              onClick: handleSave,
              disabled: isLoading || !hasChanges
            }}
            delete={!isCreateMode ? {
              label: 'Delete',
              onClick: handleDelete,
              disabled: isLoading,
              confirmation: {
                title: 'Delete Transaction',
                message: 'Are you sure you want to delete this transaction? This action cannot be undone.'
              }
            } : undefined}
            customActions={!isCreateMode ? [{
              label: 'Split',
              onClick: () => setSplitDialogOpen(true),
              disabled: isLoading || isAlreadySplit,
              variant: 'secondary',
              title: isAlreadySplit ? "Transaction is already split" : "Split this transaction"
            }] : undefined}
            isLoading={isLoading}
          />
        </Card>

        {/* Spacer for fixed button on mobile */}
        <div className="h-20 md:hidden" />
      </Page>

      {!isCreateMode && transaction && (
        <TransactionSplitDialog
          open={splitDialogOpen}
          onOpenChange={setSplitDialogOpen}
          transaction={transaction}
        />
      )}
    </>
  );
};

export default TransactionEditPage;
