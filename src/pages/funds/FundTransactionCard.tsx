import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, AlertCircle } from 'lucide-react';
import type { Transaction } from '@easy-csp/shared-types';
import { Card, CardContent } from '../../components/common/card';
import { Button } from '../../components/common/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/common/dialog';
import { useUpdateFundAllocation } from '../../hooks/api/useFundAccounts';
import { useCategoryMap } from '../../hooks/useCategoryMap';
import { formatCurrency, getTransactionSignPrefix } from '../../utils/financialUtils';
import { cn } from '../../components/common/utils';
import toast from 'react-hot-toast';

interface FundTransactionCardProps {
  transaction: Transaction;
  fundId: string;
}

export const FundTransactionCard = ({ transaction, fundId }: FundTransactionCardProps) => {
  const navigate = useNavigate();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { mutate: updateAllocation, isPending } = useUpdateFundAllocation();
  const categoryMap = useCategoryMap();

  const categoryText = categoryMap[transaction.category] ?? transaction.category;
  const displayName = transaction.nickname || transaction.name;

  const handleRemoveAllocation = () => {
    updateAllocation(
      {
        transactionId: transaction.id,
        allocatedFundId: null,
      },
      {
        onSuccess: () => {
          toast.success('Allocation removed');
          setShowConfirmDialog(false);
        },
        onError: (error) => {
          toast.error(`Failed to remove allocation: ${error.message}`);
        },
      }
    );
  };

  const handleCardClick = () => {
    navigate(`/transactions/${transaction.id}/edit`);
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Left side - Transaction details (clickable) */}
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={handleCardClick}
            >
              <div className="font-medium truncate mb-1">{displayName}</div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-gray-500">
                <span className="truncate">{categoryText}</span>
                <span className="hidden sm:inline">•</span>
                <span>
                  {new Date(transaction.datetime).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Right side - Amount and remove button */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div
                  className={cn(
                    'font-bold text-lg',
                    transaction.amount < 0 ? 'text-green-600' : 'text-gray-900'
                  )}
                >
                  {getTransactionSignPrefix(transaction.amount) + formatCurrency(transaction.amount)}
                </div>
              </div>
              <Button
                variant="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirmDialog(true);
                }}
                disabled={isPending}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Remove allocation"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Remove Fund Allocation?
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to remove this transaction from the fund? The transaction will remain in your account but will no longer be allocated to this fund.
            </p>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="font-medium">{displayName}</div>
              <div className="text-sm text-gray-500">{formatCurrency(transaction.amount)}</div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRemoveAllocation}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? 'Removing...' : 'Remove Allocation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
