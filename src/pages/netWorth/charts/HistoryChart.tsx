import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/common/card';
import { useNetWorthHistory } from '@/hooks/api/useNetWorthHistory';
import { formatCurrency, formatCurrencyAbbreviated } from '@/utils/financialUtils';

type FilteredDataList = {
    month: string;
    netWorth: number | undefined;
    assets: number | undefined;
    liabilities: number | undefined;
}[];

function getTickInterval(max: number): number {
  const abs = Math.abs(max);
  if (abs >= 100000) return 10000;
  if (abs >= 10000) return 1000;
  return 100;
}

function generateTicks(data: FilteredDataList, dataKey: string): number[] {
  const values = data.map(d => d[dataKey]).filter((v): v is number => v != null);
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const interval = getTickInterval(Math.max(Math.abs(min), Math.abs(max)));
  const start = Math.floor(min / interval - 1) * interval;
  const end = Math.ceil(max / interval + 1) * interval;
  const ticks: number[] = [];
  for (let t = start; t <= end; t += interval) ticks.push(t);
  return ticks;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const YearSelector = ({ year, onChange, availableYears }: { year: number; onChange: (y: number) => void; availableYears: Set<number> }) => (
  <div className="flex items-center gap-2">
    <button type="button" onClick={() => onChange(year - 1)} disabled={!availableYears.has(year - 1)} className="p-1 cursor-pointer disabled:opacity-30 disabled:cursor-default"><ChevronLeft className="w-4 h-4" /></button>
    <span className="text-sm font-medium">{year}</span>
    <button type="button" onClick={() => onChange(year + 1)} disabled={!availableYears.has(year + 1)} className="p-1 cursor-pointer disabled:opacity-30 disabled:cursor-default"><ChevronRight className="w-4 h-4" /></button>
  </div>
);

function useYearData(year: number) {
  const { data: chartData, isLoading, error } = useNetWorthHistory();

  const availableYears = useMemo(() => {
    if (!chartData) return new Set<number>();
    return new Set(chartData.map(d => parseInt(d.date.split('-')[0])));
  }, [chartData]);

  const filtered = useMemo(() => {
    return MONTHS.map((month, i) => {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`;
      const point = chartData?.find(d => d.date === key);
      return { month, netWorth: point?.netWorth, assets: point?.assets, liabilities: point?.liabilities };
    });
  }, [chartData, year]);

  return { filtered, chartData, isLoading, error, availableYears };
}

export type ChartConfig = { dataKey: string; name: string; color: string; gradientId: string; title: string };

export const HistoryChart = ({ config }: { config: ChartConfig }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const { filtered, chartData, isLoading, error, availableYears } = useYearData(year);

  if (error) console.error(`${config.title} query error:`, error);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><h2 className="text-lg">{config.title}</h2></CardHeader>
        <CardContent><div className="h-48 animate-pulse bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader><h2 className="text-lg">{config.title}</h2></CardHeader>
        <CardContent><p className="text-red-400 text-sm py-8 text-center">Error loading history: {(error as Error).message}</p></CardContent>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader><h2 className="text-lg">{config.title}</h2></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm py-8 text-center">No history yet. Snapshots are recorded monthly.</p></CardContent>
      </Card>
    );
  }

  const ticks = generateTicks(filtered, config.dataKey);

  return (
    <div>
      <div className="flex justify-center"><YearSelector year={year} onChange={setYear} availableYears={availableYears} /></div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={filtered} margin={{ top: 20 }}>
          <defs>
            <linearGradient id={config.gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={config.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tick={{ fontSize: 12 }} padding={{ left: 10, right: 10 }} />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#99a1af" opacity={0.5} />
          <YAxis mirror width="auto" dy={-10} dx={-5} axisLine={false} tickFormatter={(v) => formatCurrencyAbbreviated(v, 0)} tick={{ fontSize: 12 }} tickLine={false} ticks={ticks} domain={[ticks[0], ticks[ticks.length - 1]]} />
          <Tooltip formatter={(value: number) => [formatCurrency(value), '']} contentStyle={{ borderRadius: '0.5rem' }} />
          <Area type="monotone" dataKey={config.dataKey} name={config.name} stroke={config.color} fill={`url(#${config.gradientId})`} strokeWidth={2} connectNulls />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
