import { Card, CardHeader, CardContent } from '@/components/common/card';
import { AccountListItem } from './AccountListItem';
import type { UI_FinancialAccount } from '@/types/uiTypes';
import type { ReactNode } from 'react';

interface AccountListCardProps {
  title: string;
  subtitle?: ReactNode;
  accounts: UI_FinancialAccount[];
  onDelete: (account: UI_FinancialAccount) => void;
  headerContent?: ReactNode;
  emptyMessage?: string;
}

export const AccountListCard = ({
  title,
  subtitle,
  accounts,
  onDelete,
  headerContent,
  emptyMessage,
}: AccountListCardProps) => {
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
      <CardContent className="p-0! divide-y divide-gray-200 md:h-full">
        {accounts.length === 0 ? (
          <p className="text-gray-500 text-sm p-4">{emptyMessage || 'No accounts found.'}</p>
        ) : (
          accounts.map((account) => (
            <div key={account.id}>
              <AccountListItem account={account} onDelete={onDelete} />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
