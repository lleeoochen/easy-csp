import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { NetWorthBreakdown } from '../../services/netWorthService';
import { Card, CardContent, CardHeader } from '../../components/common/card';
import type { RectRadius } from 'recharts/types/shape/Rectangle';
import { formatCurrency } from '../../utils/financialUtils';

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
  // Single data point with all account types as properties
  const data = [
    {
      name: 'Accounts',
      Checking: breakdown.checking,
      Savings: breakdown.savings,
      Investment: breakdown.investment,
      Other: breakdown.other,
      Credit: breakdown.credit,
      Loan: breakdown.loan,
    }
  ];

  // Determine which bars are visible
  const visibleBars = [
    { key: 'checking', value: breakdown.checking },
    { key: 'credit', value: breakdown.credit },
    { key: 'investment', value: breakdown.investment },
    { key: 'loan', value: breakdown.loan },
    { key: 'other', value: breakdown.other },
    { key: 'savings', value: breakdown.savings },
  ].filter(bar => bar.value);

  const getRadius = (key: string): RectRadius | undefined => {
    if (visibleBars.length === 0) return 0;
    const isFirst = visibleBars[0].key === key;
    const isLast = visibleBars[visibleBars.length - 1].key === key;

    if (isFirst && isLast) return 8; // Single bar, round all corners
    if (isFirst) return [8, 0, 0, 8]; // First bar, round left
    if (isLast) return [0, 8, 8, 0]; // Last bar, round right
    return 0; // Middle bars, no rounding
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h2 className="text-lg">Total Net Worth</h2>
        <div className={`text-lg font-bold ${breakdown.total >= 0 ? 'text-green-300' : 'text-red-300'}`}>{formatCurrency(breakdown.total, 0)}</div>
      </CardHeader>
      <CardContent className='lg:w-full'>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              tickFormatter={formatCurrency}
              tick={false}
              height={0}
              domain={['dataMin', 'dataMax']}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={false}
              width={0}
            />
            <Legend iconType="circle" />
            {breakdown.checking   && (<Bar dataKey="Checking" stackId="a" fill={COLORS.checking} radius={getRadius('checking')} />)}
            {breakdown.credit     && (<Bar dataKey="Credit" stackId="a" fill={COLORS.credit} radius={getRadius('credit')} />)}
            {breakdown.investment && (<Bar dataKey="Investment" stackId="a" fill={COLORS.investment} radius={getRadius('investment')} />)}
            {breakdown.loan       && (<Bar dataKey="Loan" stackId="a" fill={COLORS.loan} radius={getRadius('loan')} />)}
            {breakdown.other      && (<Bar dataKey="Other" stackId="a" fill={COLORS.other} radius={getRadius('other')} />)}
            {breakdown.savings    && (<Bar dataKey="Savings" stackId="a" fill={COLORS.savings} radius={getRadius('savings')} />)}
            <Tooltip
              formatter={(value) => formatCurrency(value as number)}
              contentStyle={{
                borderRadius: "1rem"
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
