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
import { Progress } from '@/components/common/progress';

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
            <div className="flex flex-col items-center justify-between cursor-pointer hover:bg-accent/20 active:bg-accent/50 transition-colors w-full">
              <div className="flex justify-between items-center w-full">
                {/* Left: Fund Info */}
                <div className="grow shrink basis-2/3 font-medium truncate">
                  {fund.name}
                </div>

                {/* Progress Bar (if target amount is set) */}
                {account && (
                  <Progress 
                    className="grow shrink basis-1/3"
                    value={progress}
                    activeColorClass='bg-green-700'
                  />
                )}
              </div>

              {account && (
                <div className="flex justify-between w-full">
                  <div className="text-gray-400 text-sm">
                    {fund.targetAmount ? `Target: ${formatCurrency(fund.targetAmount)}` : ''}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {
                      formatCurrency(account.balance)
                    }
                  </div>
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
