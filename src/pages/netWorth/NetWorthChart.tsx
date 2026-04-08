import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { NetWorthBreakdown } from '../../services/netWorthService';

interface NetWorthChartProps {
  breakdown: NetWorthBreakdown;
}

const COLORS = {
  checking: '#3b82f6',    // blue
  savings: '#10b981',     // green
  investment: '#8b5cf6',  // purple
  credit: '#f97316',      // orange
  loan: '#ef4444',        // red
  other: '#6b7280',       // gray
};

const LABELS = {
  checking: 'Checking',
  savings: 'Savings',
  investment: 'Investment',
  credit: 'Credit',
  loan: 'Loan',
  other: 'Other',
};

export const NetWorthChart = ({ breakdown }: NetWorthChartProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Convert breakdown to chart data, filtering out zero values and total
  const chartData = Object.entries(breakdown)
    .filter(([key, value]) => key !== 'total' && value !== 0)
    .map(([key, value]) => ({
      name: LABELS[key as keyof typeof LABELS],
      value: Math.abs(value), // Use absolute value for chart display
      actualValue: value,
      color: COLORS[key as keyof typeof COLORS],
    }));

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow mb-6">
      <h2 className="text-lg font-semibold mb-4">Account Distribution</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(_, name: string, props) => [
              formatCurrency(props.payload.actualValue),
              name
            ]}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
