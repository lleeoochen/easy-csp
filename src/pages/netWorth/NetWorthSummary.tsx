import { TrendingUp, PiggyBank, CreditCard, LineChart, Landmark, Wallet } from 'lucide-react';
import type { NetWorthBreakdown } from '../../services/netWorthService';

interface NetWorthSummaryProps {
  breakdown: NetWorthBreakdown;
}

export const NetWorthSummary = ({ breakdown }: NetWorthSummaryProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const accountTypes = [
    { label: 'Checking', value: breakdown.checking, icon: Wallet, color: 'text-blue-500' },
    { label: 'Savings', value: breakdown.savings, icon: PiggyBank, color: 'text-green-500' },
    { label: 'Investment', value: breakdown.investment, icon: LineChart, color: 'text-purple-500' },
    { label: 'Credit', value: breakdown.credit, icon: CreditCard, color: 'text-orange-500' },
    { label: 'Loan', value: breakdown.loan, icon: Landmark, color: 'text-red-500' },
    { label: 'Other', value: breakdown.other, icon: Wallet, color: 'text-gray-500' },
  ].filter(account => account.value !== 0);

  return (
    <div className="space-y-4">
      <div className="bg-primary-bg rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium opacity-90">Total Net Worth</span>
          <TrendingUp className="w-5 h-5 opacity-90" />
        </div>
        <div className="text-3xl font-bold">{formatCurrency(breakdown.total)}</div>
      </div>

      {accountTypes.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {accountTypes.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card rounded-lg p-4 shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(value)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
