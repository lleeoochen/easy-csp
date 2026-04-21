import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Page } from '@/components/Page';
import { Button } from '@/components/common/button';
import { useAccountsWithInfo } from '@/hooks/api/useAccounts';
import { useFinancialInstitutions, useRefreshFinancialInstitutions } from '@/hooks/api/useFinancialInstitutions';
import { NetWorthGroupedBarChart } from './NetWorthGroupedBarChart';
import { AccountSection } from './AccountSection';
import { InstitutionSection } from './InstitutionSection';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import { calculateNetWorth, isAssetAccount } from '@/utils/netWorthUtils';
import { Toaster } from 'react-hot-toast';
import { cn } from '@/components/common/utils';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import type { UI_FinancialAccount } from '@/types/uiTypes';

type ViewMode = 'type' | 'institution';

const NetWorthPage = () => {
  const navigate = useNavigate();
  const { data: accounts, isLoading, error } = useAccountsWithInfo();
  const { data: institutions = [] } = useFinancialInstitutions();
  const { mutate: refreshInstitutions, isPending: isRefreshing } = useRefreshFinancialInstitutions();

  const [viewMode, setViewMode] = useState<ViewMode>('type');
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
          <Button onClick={() => navigate('/net-worth/add-account')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </div>
        <Toaster position="top-right" />
      </Page>
    );
  }

  const netWorthSummary = calculateNetWorth(accounts);

  // Convert to breakdown format for chart
  const breakdown = {
    checking: netWorthSummary.assets.checking,
    savings: netWorthSummary.assets.savings,
    investment: netWorthSummary.assets.investment,
    other: netWorthSummary.assets.other,
    credit: netWorthSummary.liabilities.credit,
    loan: netWorthSummary.liabilities.loan,
    total: netWorthSummary.netWorth,
  };

  // Separate assets and liabilities
  const assetAccounts = accounts.filter(acc => isAssetAccount(acc.accountType));
  const liabilityAccounts = accounts.filter(acc => !isAssetAccount(acc.accountType));

  // Group accounts by institution
  const accountsByInstitution = accounts.reduce((acc, account) => {
    if (account.institutionId) {
      if (!acc[account.institutionId]) {
        acc[account.institutionId] = [];
      }
      acc[account.institutionId].push(account);
    }
    return acc;
  }, {} as Record<string, UI_FinancialAccount[]>);

  return (
    <Page
      title="Net Worth"
      maxWidth="half"
    >
      <div className="flex flex-col gap-3 m-auto">
        {/* Action Buttons */}
        <div className="flex gap-2 ml-auto">
          <Button
            variant="primary"
            onClick={() => refreshInstitutions()}
            disabled={isRefreshing}
            className='flex items-center gap-2'
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            Sync
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/net-worth/add-account')}
            className='flex items-center gap-2'
          >
            <Plus className="w-4 h-4" />
            Add Account
          </Button>
        </div>

        {/* Net Worth Chart */}
        <NetWorthGroupedBarChart breakdown={breakdown} />

        {/* View Mode Tabs */}
        <SegmentedControl<ViewMode>
          options={[
            { value: 'type', label: 'By Account Type' },
            { value: 'institution', label: 'By Institution' },
          ]}
          value={viewMode}
          onChange={setViewMode}
          className="mx-auto mt-10"
        />

        {/* Content based on view mode */}
        <div className='m-auto w-full flex flex-col gap-3'>
          {viewMode === 'type' ? (
            <>
              {/* Assets Section */}
              {assetAccounts.length > 0 && (
                <AccountSection
                  title="Assets"
                  accounts={assetAccounts}
                  subtotal={netWorthSummary.assets.total}
                  onDelete={setDeleteAccount}
                />
              )}

              {/* Liabilities Section */}
              {liabilityAccounts.length > 0 && (
                <AccountSection
                  title="Liabilities"
                  accounts={liabilityAccounts}
                  subtotal={netWorthSummary.liabilities.total}
                  onDelete={setDeleteAccount}
                />
              )}
            </>
          ) : (
            <InstitutionSection
              institutions={institutions}
              accountsByInstitution={accountsByInstitution}
              onDelete={setDeleteAccount}
            />
          )}
        </div>
      </div>

      {/* Modals */}
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
