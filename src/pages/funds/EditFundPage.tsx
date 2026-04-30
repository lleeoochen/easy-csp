/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Page } from '@/components/Page';
import { Button } from '@/components/common/button';
import { Input } from '@/components/common/input';
import { Label } from '@/components/common/label';
import { Select } from '@/components/common/select';
import { BackButton } from '@/components/common/BackButton';
import { AccountSelector } from '@/components/common/AccountSelector';
import { useFunds, useUpdateFund } from '@/hooks/api/useFunds';
import { useAccountsWithInfo } from '@/hooks/api/useAccounts';
import { toast } from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { AccountType } from '@easy-csp/shared-types';

// Only asset accounts can be fund accounts
const assetAccountTypes: AccountType[] = [
  AccountType.Checking,
  AccountType.Savings,
  AccountType.Investment,
  AccountType.Other,
];

const EditFundPage = () => {
  const navigate = useNavigate();
  const { fundId } = useParams<{ fundId: string }>();
  const { data: funds = [] } = useFunds();
  const { data: accounts = [] } = useAccountsWithInfo();
  const updateFund = useUpdateFund();

  const [name, setName] = useState('');
  const [type, setType] = useState<'saving' | 'investment'>('saving');
  const [accountId, setAccountId] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fund = funds.find((f) => f.id === fundId);

  // Filter out accounts already associated with other funds
  const availableAccounts = accounts.filter((account) => {
    // Include the current fund's account
    if (fund && account.id === fund.accountId) {
      return true;
    }
    if (!assetAccountTypes.includes(account.accountType)) {
      return false;
    }
    // Exclude accounts already linked to other funds
    return !funds.some((f) => f.id !== fundId && f.accountId === account.id);
  });

  useEffect(() => {
    if (fund) {
      setName(fund.name);
      setType(fund.type);
      setAccountId(fund.accountId.toString());
      setTargetAmount(fund.targetAmount?.toString() || '');
      setIsLoading(false);
    }
  }, [fund]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fundId) {
      toast.error('Fund ID is missing');
      return;
    }

    if (!name.trim()) {
      toast.error('Fund name is required');
      return;
    }

    if (!accountId) {
      toast.error('Please select an account');
      return;
    }

    try {
      const target = targetAmount ? parseFloat(targetAmount) : undefined;

      if (targetAmount && (isNaN(target!) || target! <= 0)) {
        toast.error('Target amount must be a positive number');
        return;
      }

      await updateFund.mutateAsync({
        fundId,
        updates: {
          name: name.trim(),
          type,
          accountId: accountId,
          targetAmount: target,
        },
      });

      toast.success('Fund updated successfully');
      navigate('/funds');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update fund');
    }
  };

  if (isLoading) {
    return (
      <Page title="Edit Fund" maxWidth="half">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Loading fund...</p>
        </div>
      </Page>
    );
  }

  if (!fund) {
    return (
      <Page title="Edit Fund" maxWidth="half">
        <div className="flex flex-col gap-6">
          <div className="mr-auto">
            <BackButton to="/funds" />
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600">Fund not found</p>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Edit Fund" maxWidth="cozy">
      <div className="flex flex-col gap-6">
        <div className="mr-auto">
          <BackButton to="/funds" />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Edit Fund</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Fund Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Emergency Fund"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Fund Type *</Label>
              <Select
                options={[
                  { value: 'saving', label: 'Saving' },
                  { value: 'investment', label: 'Investment' },
                ]}
                value={type}
                onValueChange={(value) => setType(value as 'saving' | 'investment')}
              />
            </div>

            <AccountSelector
              value={accountId}
              onValueChange={setAccountId}
              label="Linked Account *"
              placeholder="Select an account"
              accounts={availableAccounts}
            />

            <div className="space-y-2">
              <Label htmlFor="targetAmount">Target Amount (optional)</Label>
              <Input
                id="targetAmount"
                type="number"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/funds')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={updateFund.isPending}
                className="flex-1"
              >
                {updateFund.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <Toaster position="top-right" />
    </Page>
  );
};

export default EditFundPage;
