import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '../../components/Page';
import { Button } from '../../components/common/button';
import { Input } from '../../components/common/input';
import { Label } from '../../components/common/label';
import { Select } from '../../components/common/select';
import { BackButton } from '../../components/common/BackButton';
import { AccountType } from '@easy-csp/shared-types';
import { useCreateManualAccount } from '../../hooks/api/useAccounts';
import LinkFinancialInstitutionButton from '../../components/LinkFinancialInstitutionButton';
import { toast } from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

const AddAccountPage = () => {
  const navigate = useNavigate();
  const [accountName, setAccountName] = useState('');
  const [nickname, setNickname] = useState('');
  const [accountType, setAccountType] = useState<AccountType>(AccountType.Savings);
  const [initialBalance, setInitialBalance] = useState('');

  const createMutation = useCreateManualAccount();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!accountName.trim()) {
      toast.error('Account name is required');
      return;
    }

    const balance = parseFloat(initialBalance);
    if (isNaN(balance)) {
      toast.error('Please enter a valid balance');
      return;
    }

    try {
      await createMutation.mutateAsync({
        accountName: accountName.trim(),
        accountType,
        initialBalance: balance,
        nickname: nickname.trim() || undefined,
      });

      toast.success('Manual account created successfully');
      navigate('/net-worth');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create account');
    }
  };

  return (
    <Page title="Add Account" maxWidth="half">
      <div className="flex flex-col gap-6">
        <div className='mr-auto'>
          <BackButton to="/net-worth" />
        </div>
        {/* Link Account Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Link Financial Institution</h2>
          <p className="text-sm text-gray-600 mb-4">
            Connect your bank, credit card, or investment accounts automatically
          </p>
          <LinkFinancialInstitutionButton buttonText="Link Account" />
        </div>

        {/* Divider */}
        <span className="px-4 text-primary-fg text-center">--- or ---</span>

        {/* Manual Account Form */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Add Manual Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name *</Label>
              <Input
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g., Emergency Account"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname (optional)</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g., Rainy Day Account"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountType">Account Type *</Label>
              <Select
                options={[
                  { value: AccountType.Checking, label: 'Checking' },
                  { value: AccountType.Savings, label: 'Savings' },
                  { value: AccountType.Credit, label: 'Credit Card' },
                  { value: AccountType.Investment, label: 'Investment' },
                  { value: AccountType.Loan, label: 'Loan' },
                  { value: AccountType.Other, label: 'Other' },
                ]}
                value={accountType}
                onValueChange={(value) => setAccountType(value as AccountType)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialBalance">Initial Balance *</Label>
              <Input
                id="initialBalance"
                type="number"
                step="0.01"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

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
                disabled={createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Account'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <Toaster position="top-right" />
    </Page>
  );
};

export default AddAccountPage;
