import { useState } from 'react';
import { RefreshCw, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Page } from '@/components/Page';
import { Button } from '@/components/common/button';
import { useAccountsWithInfo } from '@/hooks/api/useAccounts';
import { useRefreshFinancialInstitutions } from '@/hooks/api/useFinancialInstitutions';
import { NetWorthSummaryChart } from './charts/NetWorthSummaryChart';
import { NetWorthHistoryChart, AssetsHistoryChart, LiabilitiesHistoryChart } from './charts';
import { AccountListByTypeCards } from './AccountListByTypeCards';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import { calculateNetWorth, isAssetAccount } from '@/utils/netWorthUtils';
import { Toaster } from 'react-hot-toast';
import { cn } from '@/components/common/utils';
import { Carousel, CarouselContent, CarouselItem, CarouselDots } from '@/components/common/carousel';
import type { UI_FinancialAccount } from '@/types/uiTypes';
import { Card, CardContent, CardHeader } from '@/components/common/card';

const NetWorthPage = () => {
  const navigate = useNavigate();
  const { data: accounts, isLoading, error } = useAccountsWithInfo();
  const { mutate: refreshInstitutions, isPending: isRefreshing } = useRefreshFinancialInstitutions();

  const [deleteAccount, setDeleteAccount] = useState<UI_FinancialAccount | null>(null);

  if (isLoading) {
    return (
      <Page title="Net Worth" maxWidth="full">
        <div className="p-8 text-center">
          <div className="animate-pulse">Loading net worth data...</div>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Net Worth" maxWidth="full">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">Error loading net worth: {(error as Error).message}</p>
        </div>
      </Page>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <Page title="Net Worth" maxWidth="full">
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <h2 className="text-2xl font-bold mb-2">No Accounts Yet</h2>
          <p className="text-muted-foreground mb-6">
            Add a manual account or link your financial institutions to get started
          </p>
          <Button onClick={() => navigate('/net-worth/manage-accounts')}>
            <Settings2 className="w-4 h-4 mr-2" />
            Manage Accounts
          </Button>
        </div>
        <Toaster position="top-right" />
      </Page>
    );
  }

  const activeAccounts = accounts.filter(acc => !acc.archived);
  const netWorthSummary = calculateNetWorth(activeAccounts);

  const breakdown = {
    checking: netWorthSummary.assets.checking,
    savings: netWorthSummary.assets.savings,
    investment: netWorthSummary.assets.investment,
    other: netWorthSummary.assets.other,
    credit: netWorthSummary.liabilities.credit,
    loan: netWorthSummary.liabilities.loan,
    total: netWorthSummary.netWorth,
  };

  const assetAccounts = activeAccounts.filter(acc => isAssetAccount(acc.accountType));
  const liabilityAccounts = activeAccounts.filter(acc => !isAssetAccount(acc.accountType));

  return (
    <Page
      title="Net Worth"
      maxWidth="half"
      actions={<>
        <Button
          variant="primary"
          onClick={() => refreshInstitutions()}
          disabled={isRefreshing}
          className='flex items-center gap-2 h-fit'
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          Sync
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate('/net-worth/manage-accounts')}
          className='flex items-center gap-2 h-fit'
        >
          <Settings2 className="w-4 h-4" />
          Manage
        </Button>
      </>}
    >
      <div className="flex flex-col gap-3 m-auto md:flex-row">
        <div className='m-auto w-full flex flex-col gap-3'>
          {/* Net Worth Chart Carousel */}
          <Card>
            <CardHeader>
              <h2 className="text-lg">Net Worth</h2>
            </CardHeader>
            <CardContent>
              <Carousel opts={{ align: 'center' }}>
                <CarouselContent>
                  <CarouselItem><NetWorthSummaryChart breakdown={breakdown} /></CarouselItem>
                  <CarouselItem><NetWorthHistoryChart /></CarouselItem>
                  <CarouselItem><AssetsHistoryChart /></CarouselItem>
                  <CarouselItem><LiabilitiesHistoryChart /></CarouselItem>
                </CarouselContent>
                <CarouselDots count={4} />
              </Carousel>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {assetAccounts.length > 0 && (
              <AccountListByTypeCards
                title="Assets"
                accounts={assetAccounts}
                subtotal={netWorthSummary.assets.total}
                onDelete={setDeleteAccount}
              />
            )}
            {liabilityAccounts.length > 0 && (
              <AccountListByTypeCards
                title="Liabilities"
                accounts={liabilityAccounts}
                subtotal={netWorthSummary.liabilities.total}
                onDelete={setDeleteAccount}
              />
            )}
          </div>
        </div>
      </div>

      <DeleteAccountDialog
        open={!!deleteAccount}
        account={deleteAccount}
        onClose={() => setDeleteAccount(null)}
      />

      <Toaster position="top-right" />
    </Page>
  );
};

export default NetWorthPage;
