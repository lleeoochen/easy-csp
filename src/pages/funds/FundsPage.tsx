import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFunds } from '@/hooks/api/useFunds';
import { Button } from '@/components/common/button';
import { FundListCard } from './FundListCard';
import { DeleteFundDialog } from './DeleteFundDialog';
import { Toaster } from 'react-hot-toast';
import { Page } from '@/components/Page';
import type { UI_Fund } from '@/types/uiTypes';

export const FundsPage = () => {
  const navigate = useNavigate();
  const { data: funds = [], isLoading } = useFunds();
  const [deleteFund, setDeleteFund] = useState<UI_Fund | null>(null);

  if (isLoading) {
    return (
      <Page title='Funds'>
        <p className="text-gray-500">Loading funds...</p>
      </Page>
    );
  }

  // Separate funds by type
  const savingFunds = funds.filter((fund) => fund.type === 'saving');
  const investmentFunds = funds.filter((fund) => fund.type === 'investment');

  return (
    <Page title='Funds'>
      <div className='flex flex-col gap-2'>
        <Button
          variant="primary"
          onClick={() => navigate('/funds/add')}
          className="flex items-center gap-2 ml-auto"
        >
          <Plus className="w-4 h-4" />
          Create Fund
        </Button>

        {/* Saving Funds Card */}
        <FundListCard
          title="Saving Funds"
          funds={savingFunds}
          onDelete={setDeleteFund}
          emptyMessage="No saving funds yet."
        />

        {/* Investment Funds Card */}
        <FundListCard
          title="Investment Funds"
          funds={investmentFunds}
          onDelete={setDeleteFund}
          emptyMessage="No investment funds yet."
        />

        <DeleteFundDialog
          open={!!deleteFund}
          fund={deleteFund}
          onClose={() => setDeleteFund(null)}
        />

        <Toaster position="top-right" />
      </div>
    </Page>
  );
};
