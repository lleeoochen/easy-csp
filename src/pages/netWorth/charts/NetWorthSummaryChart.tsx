import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { NetWorthBreakdown } from '@/services/netWorthService';
import { formatCurrency, formatCurrencyAbbreviated } from '@/utils/financialUtils';

interface NetWorthSummaryChartProps {
  breakdown: NetWorthBreakdown;
}

const COLORS = {
  Checking: '#3b82f6',
  Savings: '#10b981',
  Investment: '#8b5cf6',
  Credit: '#f97316',
  Loan: '#ef4444',
  Other: '#6b7280',
};

export const NetWorthSummaryChart = ({ breakdown }: NetWorthSummaryChartProps) => {
  const data = [
    { name: 'Checking', value: breakdown.checking },
    { name: 'Savings', value: breakdown.savings },
    { name: 'Investment', value: breakdown.investment },
    { name: 'Credit', value: breakdown.credit },
    { name: 'Loan', value: breakdown.loan },
    { name: 'Other', value: breakdown.other },
  ].filter(d => d.value);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          fontSize={12}
          label={({ name, value }) => `${name}: ${formatCurrencyAbbreviated(value, 0)}`}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(value as number)} contentStyle={{ borderRadius: "1rem" }} />
        <Legend iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
};
