import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '@/components/Page';
import { Button } from '@/components/common/button';
import { Input } from '@/components/common/input';
import { Label } from '@/components/common/label';
import { Select } from '@/components/common/select';
import { BackButton } from '@/components/common/BackButton';
import { useCreateFund } from '@/hooks/api/useFunds';
import { useAccountsWithInfo } from '@/hooks/api/useAccounts';
import { toast } from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

const AddFundPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [type, setType] = useState<'saving' | 'investment'>('saving');
  const [accountId, setAccountId] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  const createFund = useCreateFund();
  const { data: accounts = [] } = useAccountsWithInfo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

      await createFund.mutateAsync({
        name: name.trim(),
        type,
        accountId: accountId,
        targetAmount: target,
      });

      toast.success('Fund created successfully');
      navigate('/funds');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create fund');
    }
  };

  return (
    <Page title="Add Fund" maxWidth="half">
      <div className="flex flex-col gap-6">
        <div className="mr-auto">
          <BackButton to="/funds" />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Create New Fund</h2>
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

            <div className="space-y-2">
              <Label htmlFor="account">Linked Account *</Label>
              <Select
                options={accounts.map((acc) => ({
                  value: acc.id,
                  label: acc.displayName,
                }))}
                value={accountId}
                onValueChange={setAccountId}
                placeholder="Select an account"
              />
            </div>

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
                disabled={createFund.isPending}
                className="flex-1"
              >
                {createFund.isPending ? 'Creating...' : 'Create Fund'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <Toaster position="top-right" />
    </Page>
  );
};

export default AddFundPage;
