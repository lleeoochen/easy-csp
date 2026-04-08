import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import type { NetWorthBreakdown } from '../../services/netWorthService';

interface NetWorthGroupedBarChartProps {
  breakdown: NetWorthBreakdown;
}

const COLORS = {
  checking: '#3b82f6',
  savings: '#10b981',
  investment: '#8b5cf6',
  credit: '#f97316',
  loan: '#ef4444',
  other: '#6b7280',
};

export const NetWorthGroupedBarChart = ({ breakdown }: NetWorthGroupedBarChartProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const data = [
    { name: 'Checking', value: breakdown.checking, color: COLORS.checking },
    { name: 'Savings', value: breakdown.savings, color: COLORS.savings },
    { name: 'Invest', value: breakdown.investment, color: COLORS.investment },
    { name: 'Other', value: breakdown.other, color: COLORS.other },
    { name: 'Credit', value: breakdown.credit, color: COLORS.credit },
    { name: 'Loan', value: breakdown.loan, color: COLORS.loan },
  ].filter(item => item.value !== 0);

  return (
    <div className="bg-white rounded-lg p-4 shadow lg:min-w-[500px]">
      <h2 className="text-lg font-semibold mb-4">Account Balances</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            type="number"
            tickFormatter={formatCurrency}
            tick={{ fontSize: 12 }}
          />
          <Tooltip formatter={(value) => formatCurrency(value as number)} />
          <ReferenceLine y={0} stroke="#666" strokeWidth={2} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
