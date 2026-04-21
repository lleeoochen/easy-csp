import type { AccountType } from '@easy-csp/shared-types';
import { Card, CardHeader, CardContent } from '@/components/common/card';
import { AccountListItem } from './AccountListItem';
import { getAccountTypeDisplay } from '@/utils/netWorthUtils';
import { formatCurrency } from '@/utils/financialUtils';
import type { UI_FinancialAccount } from '@/types/uiTypes';

interface AccountSectionProps {
  title: string;
  accounts: UI_FinancialAccount[];
  subtotal: number;
  onDelete: (account: UI_FinancialAccount) => void;
}

export const AccountSection = ({
  accounts,
  onDelete,
}: AccountSectionProps) => {
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
      {/* Accounts grouped by type - each type in a Card */}
      {Object.entries(accountsByType).map(([type, typeAccounts]) => {
        const typeSum = typeAccounts.reduce((sum, account) => sum + account.balance, 0);

        return (
          <Card key={type} className='md:h-full'>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-lg tracking-wide">
                  {getAccountTypeDisplay(type as AccountType)}
                </h3>
                <div className={`text-lg font-bold ${typeSum >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {formatCurrency(typeSum, 0, false)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0! divide-y divide-gray-200 md:h-full">
              {typeAccounts.map((account) => (
                <div key={account.id}>
                  <AccountListItem
                    account={account}
                    onDelete={onDelete}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
