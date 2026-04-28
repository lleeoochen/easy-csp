import { useState, useEffect, useMemo } from "react";
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
import { useUpdateTransaction, useDeleteTransaction, useCreateTransaction, useTransaction, useTransactions, useUnsplitTransaction } from '@/hooks/api/useTransactions';
import { useAccounts } from '@/hooks/api/useAccounts';
import "@/components/common/datepicker.css";
import { formatCurrency, getTransactionSignPrefix } from '@/utils/financialUtils';
import { ArrowLeft } from "lucide-react";
import { TransactionSplitDialog } from "./TransactionSplitDialog";
import { Button } from '@/components/common/button';
import { cn } from "@/components/common/utils";

const MANUAL_ACCOUNT = "MANUAL_ACCOUNT";

const TransactionEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isCreateMode = id === 'new';

  const { data: transaction, isLoading: loadingTransaction } = useTransaction(isCreateMode ? null : id!);
  const { data: splittedTransactionPages } = useTransactions(
    {
      splitParentId: transaction?.splitParentId,
      orderBy: {
        direction: "asc",
        field: "datetime"
      }
    },
    !!transaction?.splitParentId // enabled when transaction was splitted
  );

  const splittedTransactions = useMemo(() =>
    splittedTransactionPages?.pages.flatMap(p => p.transactions ?? []) ?? [],
    [splittedTransactionPages]
  );

  const { data: institutions = [] } = useFinancialInstitutions();
  const { data: accounts = [] } = useAccounts();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const createTransaction = useCreateTransaction();
  const unsplitTransaction = useUnsplitTransaction();

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
          accountId: MANUAL_ACCOUNT,
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

  const handleUnsplit = async () => {
    if (!transaction) return;

    setIsLoading(true);
    try {
      const result = await unsplitTransaction.mutateAsync(transaction.id);
      if (result.success) {
        navigate('/transactions');
      } else {
        console.error('Error unsplitting transaction:', result.message);
      }
    } catch (error) {
      console.error('Error unsplitting transaction:', error);
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
            <div className="text-lg">
              {isCreateMode ? 'Add Transaction' : (isManual ? transactionName : transaction!.name)}
              {transaction?.plaidPending ? ' (Pending)' : ''}
            </div>
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
              disabled={transaction?.plaidPending}
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
                disabled={transaction?.plaidPending}
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
            disabled={transaction?.plaidPending}
            includeAllOption={false}
          />

          {/* Fund Selector */}
          <FundSelector
            value={allocatedFundId}
            onValueChange={setAllocatedFundId}
            label="Allocated Fund (Optional)"
            placeholder="Select a fund to allocate to..."
            disabled={transaction?.plaidPending}
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
              disabled={transaction?.plaidPending}
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

        {/* Action buttons - Fixed at bottom on mobile */}
          <DialogActionPanel
            cancel={{
              label: 'Cancel',
              onClick: () => navigate('/transactions'),
              disabled: isLoading
            }}
            submit={{
              label: isLoading ? 'Saving...' : (isCreateMode ? 'Create' : 'Save'),
              onClick: handleSave,
              disabled: isLoading || !hasChanges || transaction?.plaidPending
            }}
            delete={!isCreateMode ? {
              label: 'Delete',
              onClick: handleDelete,
              disabled: isLoading || transaction?.plaidPending,
              confirmation: {
                title: 'Delete Transaction',
                message: 'Are you sure you want to delete this transaction? This action cannot be undone.'
              }
            } : undefined}
            isLoading={isLoading}
          />
          </CardContent>
        </Card>

        {!isCreateMode && (
          <Card className="mt-4">
            <CardHeader>
              <div className="text-lg">
                Split Transactions
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex justify-between my-2">
                <span>You can split transactions into multiple future transactions.</span>
                <DialogActionPanel
                  className="ml-auto"
                  customActions={!isCreateMode ? [
                    {
                      label: 'Split',
                      onClick: () => setSplitDialogOpen(true),
                      disabled: isLoading || isAlreadySplit || transaction?.plaidPending,
                      variant: 'secondary' as const,
                      title: isAlreadySplit ? "Transaction is already split" : "Split this transaction",
                      className: isAlreadySplit ? "hidden" : ""
                    },
                    {
                      label: 'Unsplit',
                      onClick: handleUnsplit,
                      disabled: isLoading || !isAlreadySplit || transaction?.plaidPending,
                      variant: 'secondary' as const,
                      title: !isAlreadySplit ? "Transaction is not split" : "Remove all splits and restore to single transaction",
                      confirmation: {
                        title: 'Unsplit Transactions',
                        message: 'Are you sure you want to unsplit the transactions? All child transactions will be deleted and cannot be recovered.'
                      },
                      className: isAlreadySplit ? "" : "hidden"
                    }
                  ] : undefined}
                  isLoading={isLoading}
                />
              </div>
              <div className="flex flex-col divide-y divide-gray-100">
                {
                  splittedTransactions.map(splittedTransaction => {
                    const isSplitParent = splittedTransaction.id === splittedTransaction.splitParentId;
                    const isCurrentTransaction = splittedTransaction.id === transaction?.id;

                    return (
                      <div
                        key={splittedTransaction.id}
                        className={
                          cn("flex justify-between py-3 px-4 rounded-2xl cursor-pointer hover:bg-accent/20 items-center", {
                            "bg-yellow-100": isCurrentTransaction
                          })
                        }
                        onClick={() => navigate(`/transactions/${splittedTransaction.id}/edit`)}
                      >
                        <div className={cn("flex gap-3 items-center", { "": !isSplitParent, "font-semibold": isCurrentTransaction })}>
                          {!isSplitParent ? <span className="text-gray-400 text-2xl">╰</span> : undefined}
                          <span>{splittedTransaction.name}</span>
                        </div>
                        <div>
                          {new Date(splittedTransaction.datetime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </CardContent>
          </Card>
        )}

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
