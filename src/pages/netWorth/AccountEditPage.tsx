import { Page } from '@/components/Page';
import { Button } from '@/components/common/button';
import { Card, CardContent, CardHeader } from '@/components/common/card';
import { Input } from '@/components/common/input';
import { Label } from '@/components/common/label';
import {
  useAccountsWithInfo, useUpdateAccountNickname,
  useUpdateManualAccount
} from '@/hooks/api/useAccounts';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

const AccountEditPage = () => {
  const navigate = useNavigate();
  const { accountId } = useParams<{ accountId: string }>();

  const { data: accounts, isLoading: accountsLoading } = useAccountsWithInfo();
  const account = accounts?.find(acc => acc.id === accountId);

  // Form state - initialized from account prop, will reset when account.id changes via key
  const [nickname, setNickname] = useState(account?.nickname ?? '');
  const [balance, setBalance] = useState(account?.balance.toString() ?? '');

  const updateNicknameMutation = useUpdateAccountNickname();
  const updateManualAccountMutation = useUpdateManualAccount();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!account) return;

    try {
      if (account.isManual) {
        await handleManualAccountSubmit();
      } else {
        await handleNicknameSubmit();
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

        <form onSubmit={handleSubmit}>
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

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate('/net-worth')}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={updateNicknameMutation.isPending || updateManualAccountMutation.isPending}
                    className="flex-1"
                  >
                    {(updateNicknameMutation.isPending || updateManualAccountMutation.isPending) ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
        </form>

        {/* Spacer for fixed button on mobile */}
        <div className="h-20 md:hidden" />
      </Page>
    </>
  );
};

export default AccountEditPage;
