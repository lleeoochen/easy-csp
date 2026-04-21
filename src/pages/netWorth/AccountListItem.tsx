import { getAccountDisplayName } from '@/utils/netWorthUtils';
import { formatCurrency } from '@/utils/financialUtils';
import { formatDistanceToNow } from 'date-fns';
import { Wallet, Eye } from 'lucide-react';
import type { UI_FinancialAccount } from '@/types/uiTypes';
import { Progress } from '@/components/common/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/common/dropdown-menu';
import { useNavigate } from 'react-router-dom';

interface AccountListItemProps {
  account: UI_FinancialAccount;
  onDelete: (account: UI_FinancialAccount) => void;
}

export const AccountListItem = ({ account, onDelete }: AccountListItemProps) => {
  const navigate = useNavigate();
  const displayName = getAccountDisplayName(account);
  const isPositive = account.balance >= 0;

  // Calculate progress percentage if target amount is set
  // NOTE: Progress is based on account.balance only.
  // Fund allocations (transaction.allocatedFundId) do NOT affect account balance.
  const progressPercentage = account.targetAmount
    ? Math.min((account.balance / account.targetAmount) * 100, 100)
    : undefined;

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center justify-between z-50 px-4 py-2 cursor-pointer hover:bg-accent/20 active:bg-accent/50 transition-colors w-full">
            {/* Left: Account Info */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                {account.isFundAccount && (
                  <span className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded flex items-center gap-1">
                    <Wallet className="w-3 h-3" />
                    Fund
                  </span>
                )}
                <h4 className="font-medium truncate">{displayName}</h4>
              </div>

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

              {/* Target Amount Progress */}
              {account.targetAmount && progressPercentage !== undefined && (
                <div className="space-y-1 max-w-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Goal: {formatCurrency(account.targetAmount, 2, true)}</span>
                    <span>{progressPercentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-1.5" />
                </div>
              )}
            </div>

            {/* Right: Balance */}
            {/* NOTE: This displays account.balance only.
                Fund allocations are tracked separately and do NOT affect this balance. */}
            <div className="flex items-center gap-3 ml-4">
              <div className="text-right">
                <p className={`font-bold text-md ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(account.balance, 0, false)}
                </p>
              </div>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {account.isFundAccount && (
            <DropdownMenuItem onClick={() => navigate(`/transactions?fund=${encodeURIComponent(account.id)}`)}>
              <Eye className="w-4 h-4 mr-2" />
              View Transactions
            </DropdownMenuItem>
          )}
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
