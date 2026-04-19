import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye } from 'lucide-react';
import { Page } from '../../components/Page';
import { Card, CardHeader, CardContent } from '../../components/common/card';
import { Button } from '../../components/common/button';
import { Input } from '../../components/common/input';
import { Label } from '../../components/common/label';
import { Switch } from '../../components/common/switch';
import { DialogActionPanel } from '../../components/common/DialogActionPanel';
import { SegmentedControl } from '../../components/common/SegmentedControl';
import { AccountType } from '@easy-csp/shared-types';
import { useAccountsWithInfo } from '../../hooks/api/useAccounts';
import {
  useUpdateAccountNickname,
  useUpdateManualAccount,
  useUpdateAccountTargetAmount
} from '../../hooks/api/useAccounts';
import { useUpdateFundStatus } from '../../hooks/api/useFundAccounts';
import { FundAccountWarningDialog } from '../../components/common/FundAccountWarningDialog';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/financialUtils';
import { getAccountDisplayName } from '../../utils/netWorthUtils';

type TabType = 'details' | 'goal' | 'fund';

/**
 * Determines if an account type is eligible to be a fund account
 * Only asset accounts can be fund accounts
 */
const isAssetAccountType = (accountType: AccountType): boolean => {
  return [
    AccountType.Checking,
    AccountType.Savings,
    AccountType.Investment,
    AccountType.Other,
  ].includes(accountType);
};

/**
 * Gets explanatory text for fund account toggle based on account type
 */
const getFundAccountExplanation = (accountType: AccountType): string => {
  if (isAssetAccountType(accountType)) {
    return 'Enable this account as a fund account to track transaction allocations for budgeting purposes';
  }
  return 'Only asset accounts (checking, savings, investment, other) can be fund accounts';
};

const AccountEditPage = () => {
  const navigate = useNavigate();
  const { accountId } = useParams<{ accountId: string }>();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) || 'details';

  const { data: accounts, isLoading: accountsLoading } = useAccountsWithInfo();
  const account = accounts?.find(acc => acc.id === accountId);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Form state - initialized from account prop, will reset when account.id changes via key
  const [nickname, setNickname] = useState(account?.nickname ?? '');
  const [balance, setBalance] = useState(account?.balance.toString() ?? '');
  const [targetAmount, setTargetAmount] = useState(account?.targetAmount?.toString() ?? '');

  // Fund account warning state
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [pendingFundStatus, setPendingFundStatus] = useState<boolean | null>(null);

  const updateNicknameMutation = useUpdateAccountNickname();
  const updateManualAccountMutation = useUpdateManualAccount();
  const updateTargetAmountMutation = useUpdateAccountTargetAmount();
  const updateFundStatusMutation = useUpdateFundStatus();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!account) return;

    try {
      if (activeTab === 'details') {
        if (account.isManual) {
          await handleManualAccountSubmit();
        } else {
          await handleNicknameSubmit();
        }
      } else if (activeTab === 'goal') {
        await handleTargetAmountSubmit();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update account');
    }
  };

  const handleNicknameSubmit = async () => {
    if (!account) return;

    await updateNicknameMutation.mutateAsync({
      accountId: account.id,
      nickname: nickname.trim() || null,
    });

    toast.success(nickname.trim() ? 'Nickname updated' : 'Nickname cleared');
    navigate('/net-worth');
  };

  const handleManualAccountSubmit = async () => {
    if (!account) return;

    const newBalance = parseFloat(balance);
    if (isNaN(newBalance)) {
      toast.error('Please enter a valid balance');
      return;
    }

    const newNickname = nickname.trim() || null;

    // Check if anything changed
    const balanceChanged = newBalance !== account.balance;
    const nicknameChanged = newNickname !== account.nickname;

    if (!balanceChanged && !nicknameChanged) {
      toast.success('No changes to save');
      navigate('/net-worth');
      return;
    }

    await updateManualAccountMutation.mutateAsync({
      accountId: account.id,
      ...(balanceChanged && { balance: newBalance }),
      ...(nicknameChanged && { nickname: newNickname }),
    });

    toast.success('Account updated successfully');
    navigate('/net-worth');
  };

  const handleTargetAmountSubmit = async () => {
    if (!account) return;

    const amount = targetAmount.trim() ? parseFloat(targetAmount) : null;

    if (amount !== null && (isNaN(amount) || amount <= 0)) {
      toast.error('Target amount must be a positive number');
      return;
    }

    await updateTargetAmountMutation.mutateAsync({
      accountId: account.id,
      targetAmount: amount,
    });

    toast.success(amount ? 'Goal set successfully' : 'Goal cleared');
    navigate('/net-worth');
  };

  // Fund account handlers
  const handleFundStatusToggle = (newStatus: boolean) => {
    if (!account) return;

    // If disabling, show warning
    if (!newStatus && account.isFundAccount) {
      setPendingFundStatus(newStatus);
      setShowWarningDialog(true);
      return;
    }

    // Otherwise, update immediately
    updateFundStatus(newStatus);
  };

  const updateFundStatus = async (newStatus: boolean) => {
    if (!account) return;

    try {
      await updateFundStatusMutation.mutateAsync({
        accountId: account.id,
        isFundAccount: newStatus,
      });

      toast.success(
        newStatus
          ? 'Fund account status enabled'
          : 'Fund account status disabled'
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update fund account status'
      );
    }
  };

  const handleWarningConfirm = () => {
    if (pendingFundStatus !== null) {
      updateFundStatus(pendingFundStatus);
    }
    setShowWarningDialog(false);
    setPendingFundStatus(null);
  };

  const handleWarningCancel = () => {
    setShowWarningDialog(false);
    setPendingFundStatus(null);
  };

  if (accountsLoading) {
    return (
      <Page maxWidth="cozy">
        <div className="animate-pulse">Loading account...</div>
      </Page>
    );
  }

  if (!account) {
    return (
      <Page maxWidth="cozy">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Account not found</p>
          <Button onClick={() => navigate('/net-worth')}>
            Back to Net Worth
          </Button>
        </div>
      </Page>
    );
  }

  const isSaving =
    updateNicknameMutation.isPending ||
    updateManualAccountMutation.isPending ||
    updateTargetAmountMutation.isPending;

  const progressPercentage = account.targetAmount
    ? Math.min((account.balance / account.targetAmount) * 100, 100)
    : 0;

  const isEligibleForFund = isAssetAccountType(account.accountType);
  const fundExplanationText = getFundAccountExplanation(account.accountType);
  const displayName = getAccountDisplayName(account);

  return (
    <>
      <Page maxWidth="cozy" title="Edit Account" key={account?.id}>
        {/* Header with back button */}
        <div className="mb-6">
          <Button
            variant="secondary"
            onClick={() => navigate('/net-worth')}
            className="flex items-center gap-2 text-primary-fg hover:text-primary-fg/80 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back to Net Worth</span>
          </Button>
        </div>

        {/* Tabs */}
        <SegmentedControl<TabType>
          options={[
            { value: 'details', label: 'Details' },
            { value: 'goal', label: 'Goal' },
            { value: 'fund', label: 'Fund' },
          ]}
          value={activeTab}
          onChange={setActiveTab}
          fullWidth
          className="mb-4"
        />

        <form onSubmit={handleSubmit}>
          {/* Details Tab */}
          {activeTab === 'details' && (
            <Card>
              <CardHeader>Account Details</CardHeader>
              <CardContent className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    value={account.accountName}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nickname">
                    Nickname {account.isManual && '(optional)'}
                  </Label>
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Enter a custom name"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use the original account name
                  </p>
                </div>

                {account.isManual && (
                  <div className="space-y-2">
                    <Label htmlFor="balance">Balance *</Label>
                    <Input
                      id="balance"
                      type="number"
                      step="0.01"
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Goal Tab */}
          {activeTab === 'goal' && (
            <Card>
              <CardHeader>Savings Goal</CardHeader>
              <CardContent className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="accountNameGoal">Account</Label>
                  <Input
                    id="accountNameGoal"
                    value={account.displayName}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentBalance">Current Balance</Label>
                  <Input
                    id="currentBalance"
                    value={formatCurrency(account.balance, 2, true)}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAmount">Target Amount</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="Enter goal amount"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to remove the goal
                  </p>
                </div>

                {account.targetAmount && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium mb-1">Current Progress</div>
                    <div className="text-2xl font-bold text-primary">
                      {progressPercentage.toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(account.balance, 2, true)} of {formatCurrency(account.targetAmount, 2, true)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Fund Tab */}
          {activeTab === 'fund' && (
            <Card>
              <CardHeader>Fund Account Settings</CardHeader>
              <CardContent className="space-y-4 py-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{fundExplanationText}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="fund-account-toggle" className="text-sm font-medium">
                      Fund Account Status
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {account.isFundAccount ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>

                  <Switch
                    id="fund-account-toggle"
                    checked={account.isFundAccount}
                    onCheckedChange={handleFundStatusToggle}
                    disabled={!isEligibleForFund || updateFundStatusMutation.isPending}
                  />
                </div>

                {!isEligibleForFund && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground">
                      This account type ({account.accountType}) cannot be used as a fund account.
                      Only asset accounts can track transaction allocations.
                    </p>
                  </div>
                )}

                {account.isFundAccount && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate(`/transactions?fund=${encodeURIComponent(account.id)}`)}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Transactions
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          {activeTab !== 'fund' && (
            <Card className="bg-white p-4 mt-2">
              <DialogActionPanel
                cancel={{
                  label: 'Cancel',
                  onClick: () => navigate('/net-worth'),
                  disabled: isSaving
                }}
                submit={{
                  label: isSaving ? 'Saving...' : 'Save',
                  onClick: handleSubmit,
                  disabled: isSaving
                }}
                isLoading={isSaving}
              />
            </Card>
          )}
        </form>

        {/* Spacer for fixed button on mobile */}
        <div className="h-20 md:hidden" />
      </Page>

      <FundAccountWarningDialog
        open={showWarningDialog}
        fundAccountId={account.id}
        fundAccountName={displayName}
        onConfirm={handleWarningConfirm}
        onCancel={handleWarningCancel}
        isLoading={updateFundStatusMutation.isPending}
      />
    </>
  );
};

export default AccountEditPage;
