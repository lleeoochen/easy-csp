import type { AccountType } from '@easy-csp/shared-types';
import { AccountListCard } from './AccountListCard';
import { getAccountTypeDisplay, isLiabilityAccount } from '@/utils/netWorthUtils';
import { formatCurrency } from '@/utils/financialUtils';
import type { UI_FinancialAccount } from '@/types/uiTypes';
import { cn } from '@/components/common/utils';

interface AccountListByTypeCardsProps {
  title: string;
  accounts: UI_FinancialAccount[];
  subtotal: number;
  onDelete: (account: UI_FinancialAccount) => void;
}

export const AccountListByTypeCards = ({
  accounts,
  onDelete,
}: AccountListByTypeCardsProps) => {
  if (accounts.length === 0) {
    return null;
  }

  // Group accounts by type
  const accountsByType = accounts.reduce((acc, account) => {
    const type = account.accountType;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(account);
    return acc;
  }, {} as Record<AccountType, UI_FinancialAccount[]>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Object.entries(accountsByType).map(([type, typeAccounts]) => {
        const typeSum = typeAccounts.reduce((sum, account) => sum + account.balance, 0);

        const isLiability = isLiabilityAccount(type as AccountType);
        const isHealthy = isLiability ? typeSum < 0 : typeSum >= 0;
        return (
          <AccountListCard
            key={type}
            title={getAccountTypeDisplay(type as AccountType)}
            accounts={typeAccounts}
            onDelete={onDelete}
            headerContent={
              <div className={cn('text-lg font-bold', {
                "text-green-300": isHealthy,
                "text-red-300": !isHealthy,
              })}>
                {formatCurrency(typeSum, 0, false)}
              </div>
            }
          />
        );
      })}
    </div>
  );
};
