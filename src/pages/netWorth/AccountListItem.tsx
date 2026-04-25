import { getAccountDisplayName, isLiabilityAccount } from '@/utils/netWorthUtils';
import { formatCurrency } from '@/utils/financialUtils';
import { formatDistanceToNow } from 'date-fns';
import type { UI_FinancialAccount } from '@/types/uiTypes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/common/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/components/common/utils';

interface AccountListItemProps {
  account: UI_FinancialAccount;
  onDelete: (account: UI_FinancialAccount) => void;
}

export const AccountListItem = ({ account, onDelete }: AccountListItemProps) => {
  const navigate = useNavigate();
  const displayName = getAccountDisplayName(account);

  // For liability accounts (credit/loan), positive balance = debt (bad/red)
  // For asset accounts, negative balance = deficit (bad/red)
  const isLiability = isLiabilityAccount(account.accountType);
  const isHealthy = isLiability ? account.balance < 0 : account.balance >= 0;

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className='px-4 py-2 '>
            <div className="flex gap-4 items-center justify-between z-50 cursor-pointer hover:bg-accent/20 active:bg-accent/50 transition-colors w-full">
              {/* Left: Account Info */}
              <div className="flex-1 min-w-0 space-y-1 grow shrink basis-2/3 truncate">
                <h4 className="font-medium truncate">{displayName}</h4>
                {/* Institution Info (for linked accounts) */}
                <div className="flex items-center gap-2 text-gray-400 text-sm truncate">
                  <span>
                    {account.isManual ? 'Manual' : account.institutionName}
                  </span>
                  {account.lastSyncTimestamp && (
                    <>
                      <span>
                        •
                      </span>
                      <span>
                        Updated {formatDistanceToNow(new Date(account.lastSyncTimestamp), { addSuffix: true })}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Balance */}
              <div className={cn("text-sm font-semibold", {
                "text-green-500": isHealthy,
                "text-red-400": !isHealthy,
              })}>
                {formatCurrency(account.balance, 0, false)}
              </div>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => navigate(`/net-worth/account/${account.id}/edit`)}>
            Edit Account
          </DropdownMenuItem>
          {account.isManual && (
            <DropdownMenuItem onClick={() => onDelete(account)} className="text-red-600">
              Delete Account
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
