import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/common/button';
import { Card, CardContent } from '@/components/common/card';
import { useUnarchiveFinancialAccount } from '@/hooks/api/useAccounts';
import { getAccountDisplayName, isLiabilityAccount } from '@/utils/netWorthUtils';
import { formatCurrency } from '@/utils/financialUtils';
import { toast } from 'react-hot-toast';
import type { UI_FinancialAccount } from '@/types/uiTypes';
import { cn } from '@/components/common/utils';

interface ArchivedAccountsSectionProps {
  accounts: UI_FinancialAccount[];
}

export const ArchivedAccountsSection = ({ accounts }: ArchivedAccountsSectionProps) => {
  const [expanded, setExpanded] = useState(false);
  const unarchiveMutation = useUnarchiveFinancialAccount();

  if (accounts.length === 0) return null;

  const handleRestore = async (account: UI_FinancialAccount) => {
    try {
      await unarchiveMutation.mutateAsync({ accountId: account.id });
      toast.success(`${account.displayName} restored`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to restore account');
    }
  };

  return (
    <Card>
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-4 py-3 text-secondary-fg transition-colors cursor-pointer bg-secondary-bg rounded-2xl",
          expanded && "rounded-b-none"
        )}
      >
        <div>Archived Accounts ({accounts.length})</div>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expanded && (
        <CardContent className="p-0! divide-y divide-gray-200">
          {accounts.map((account) => {
            const displayName = getAccountDisplayName(account);
            const isLiability = isLiabilityAccount(account.accountType);
            const isHealthy = isLiability ? account.balance < 0 : account.balance >= 0;

            return (
              <div key={account.id} className="px-4 py-2">
                <div className="flex gap-4 items-center justify-between w-full">
                  <div className="flex-1 min-w-0 space-y-1 grow shrink basis-2/3 truncate">
                    <h4 className="font-medium truncate">{displayName}</h4>
                    <div className="flex items-center gap-2 text-gray-400 text-sm truncate">
                      <span>{account.institutionName}</span>
                    </div>
                  </div>
                  <div className={cn("text-sm font-semibold", {
                    "text-green-500": isHealthy,
                    "text-red-400": !isHealthy,
                  })}>
                    {formatCurrency(account.balance, 0, false)}
                  </div>
                  <Button
                    variant="icon"
                    onClick={() => handleRestore(account)}
                    disabled={unarchiveMutation.isPending}
                    title="Restore account"
                  >
                    Restore
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
};
