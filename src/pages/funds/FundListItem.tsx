import { formatCurrency } from '@/utils/financialUtils';
import type { UI_Fund } from '@/types/uiTypes';
import { useAccountsWithInfo } from '@/hooks/api/useAccounts';
import { useMemo } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/common/dropdown-menu';
import { useNavigate } from 'react-router-dom';

interface FundListItemProps {
  fund: UI_Fund;
  onDelete: (fund: UI_Fund) => void;
}

export const FundListItem = ({ fund, onDelete }: FundListItemProps) => {
  const navigate = useNavigate();
  const { data: accounts = [] } = useAccountsWithInfo();

  // Find the account associated with this fund
  const account = useMemo(() => {
    return accounts.find((acc) => acc.id === fund.accountId.toString());
  }, [accounts, fund.accountId]);

  // Calculate progress if target amount is set
  const progress = fund.targetAmount && account
    ? Math.min((account.balance / fund.targetAmount) * 100, 100)
    : undefined;

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="px-4 py-3">
            <div className="flex gap-4 items-center justify-between cursor-pointer hover:bg-accent/20 active:bg-accent/50 transition-colors w-full">
              {/* Left: Fund Info */}
              <div className="flex-1 min-w-0 space-y-1 grow shrink basis-2/3 truncate">
                <h4 className="font-medium truncate">{fund.name}</h4>

                {/* Account Info */}
                <div className="flex items-center gap-2 text-gray-400 text-sm truncate">
                  <span>{account?.displayName || 'Unknown Account'}</span>
                </div>

                {/* Progress Bar (if target amount is set) */}
                {fund.targetAmount && account && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{formatCurrency(account.balance, 0, false)}</span>
                      <span>{formatCurrency(fund.targetAmount, 0, false)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Current Balance */}
              {account && !fund.targetAmount && (
                <div className="text-sm font-semibold text-green-500">
                  {formatCurrency(account.balance, 0, false)}
                </div>
              )}
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => navigate(`/funds/${fund.id}/edit`)}>
            Edit Fund
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(fund)} className="text-red-600">
            Delete Fund
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
