import { Card, CardHeader, CardContent } from '@/components/common/card';
import { Button } from '@/components/common/button';
import { AccountListItem } from './AccountListItem';
import { useUnarchiveFinancialAccount } from '@/hooks/api/useAccounts';
import { getAccountDisplayName } from '@/utils/netWorthUtils';
import { formatCurrency } from '@/utils/financialUtils';
import { toast } from 'react-hot-toast';
import type { UI_FinancialAccount } from '@/types/uiTypes';
import type { ReactNode } from 'react';

interface AccountListCardProps {
  title: string;
  subtitle?: ReactNode;
  accounts: UI_FinancialAccount[];
  archivedAccounts?: UI_FinancialAccount[];
  onDelete: (account: UI_FinancialAccount) => void;
  headerContent?: ReactNode;
  emptyMessage?: string;
}

export const AccountListCard = ({
  title,
  subtitle,
  accounts,
  archivedAccounts,
  onDelete,
  headerContent,
  emptyMessage,
}: AccountListCardProps) => {
  const unarchiveMutation = useUnarchiveFinancialAccount();

  const handleRestore = async (account: UI_FinancialAccount) => {
    try {
      await unarchiveMutation.mutateAsync({ accountId: account.id });
      toast.success(`${account.displayName} restored`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to restore account');
    }
  };

  return (
    <Card className="md:h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg tracking-wide">{title}</h3>
            {subtitle}
          </div>
          {headerContent}
        </div>
      </CardHeader>
      <CardContent className="p-0! divide-y divide-gray-200  min-h-32 md:min-h-48 md:h-full">
        {accounts.length === 0 && (!archivedAccounts || archivedAccounts.length === 0) ? (
          <p className="text-gray-500 text-sm p-4">{emptyMessage || 'No accounts found.'}</p>
        ) : (
          <>
            {accounts.map((account) => (
              <div key={account.id}>
                <AccountListItem account={account} onDelete={onDelete} />
              </div>
            ))}
            {archivedAccounts && archivedAccounts.length > 0 && (
              archivedAccounts.map((account) => (
                <div key={account.id} className="px-4 py-2 opacity-50">
                  <div className="flex gap-4 items-center justify-between w-full">
                    <div className="flex-1 min-w-0 truncate">
                      <h4 className="font-medium truncate">{getAccountDisplayName(account)}</h4>
                      <span className="text-gray-400 text-xs">Archived</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(account.balance, 0, false)}
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => handleRestore(account)}
                      disabled={unarchiveMutation.isPending}
                      className="text-xs px-2 py-1 h-auto"
                    >
                      Restore
                    </Button>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
