import { Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Page } from '@/components/Page';
import { Button } from '@/components/common/button';
import { useAccountsWithInfo } from '@/hooks/api/useAccounts';
import { useFinancialInstitutions, useRefreshFinancialInstitutions } from '@/hooks/api/useFinancialInstitutions';
import { AccountListByInstitutionCards } from './AccountListByInstitutionCards';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import { DeleteInstitutionDialog } from './DeleteInstitutionDialog';
import { Toaster } from 'react-hot-toast';
import { cn } from '@/components/common/utils';
import { LastSynced } from '@/components/LastSynced';
import { useState } from 'react';
import type { UI_FinancialAccount } from '@/types/uiTypes';
import type { FinancialInstitution } from '@easy-csp/shared-types';

const ManageAccountsPage = () => {
  const navigate = useNavigate();
  const { data: accounts, isLoading, error } = useAccountsWithInfo();
  const { data: institutions = [] } = useFinancialInstitutions();
  const { mutate: refreshInstitutions, isPending: isRefreshing } = useRefreshFinancialInstitutions();

  const [deleteAccount, setDeleteAccount] = useState<UI_FinancialAccount | null>(null);
  const [deleteInstitution, setDeleteInstitution] = useState<{ institution: FinancialInstitution; accounts: UI_FinancialAccount[] } | null>(null);

  if (isLoading) {
    return (
      <Page title="Manage Accounts" maxWidth="half" showBack>
        <div className="p-8 text-center">
          <div className="animate-pulse">Loading accounts...</div>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Manage Accounts" maxWidth="half" showBack>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">Error loading accounts: {(error as Error).message}</p>
        </div>
      </Page>
    );
  }

  const activeAccounts = (accounts || []).filter(acc => !acc.archived);
  const archivedAccounts = (accounts || []).filter(acc => acc.archived);

  const accountsByInstitution = activeAccounts.reduce((acc, account) => {
    if (account.institutionId) {
      if (!acc[account.institutionId]) acc[account.institutionId] = [];
      acc[account.institutionId].push(account);
    }
    return acc;
  }, {} as Record<string, UI_FinancialAccount[]>);

  const archivedAccountsByInstitution = archivedAccounts.reduce((acc, account) => {
    if (account.institutionId) {
      if (!acc[account.institutionId]) acc[account.institutionId] = [];
      acc[account.institutionId].push(account);
    }
    return acc;
  }, {} as Record<string, UI_FinancialAccount[]>);

  return (
    <Page
      title="Manage Accounts"
      maxWidth="half"
      showBack
      actions={
        <div className="flex flex-col">
          <div className="flex flex-row items-center gap-2">
            <Button
              variant="primary"
              onClick={() => refreshInstitutions()}
              disabled={isRefreshing}
              className="flex items-center gap-2 h-fit"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              Sync
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/net-worth/add-account')}
              className="flex items-center gap-2 h-fit"
            >
              <Plus className="w-4 h-4" />
              Account
            </Button>
          </div>
          <LastSynced institutions={institutions} />
        </div>
      }
    >
      <AccountListByInstitutionCards
          institutions={institutions}
          accountsByInstitution={accountsByInstitution}
          archivedAccountsByInstitution={archivedAccountsByInstitution}
          onDelete={setDeleteAccount}
          onDeleteInstitution={(inst, accts) => setDeleteInstitution({ institution: inst, accounts: accts })}
      />

      <DeleteAccountDialog
        open={!!deleteAccount}
        account={deleteAccount}
        onClose={() => setDeleteAccount(null)}
      />

      <DeleteInstitutionDialog
        open={!!deleteInstitution}
        institution={deleteInstitution?.institution ?? null}
        accounts={deleteInstitution?.accounts ?? []}
        onClose={() => setDeleteInstitution(null)}
      />

      <Toaster position="top-right" />
    </Page>
  );
};

export default ManageAccountsPage;
