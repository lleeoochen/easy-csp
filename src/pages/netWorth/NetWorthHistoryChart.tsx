import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/common/card';
import { useNetWorthHistory } from '@/hooks/api/useNetWorthHistory';
import { formatCurrency } from '@/utils/financialUtils';

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
  if (abs >= 1000) return 100;
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

export const NetWorthHistoryChart = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const { filtered, chartData, isLoading, error, availableYears } = useYearData(year);

  if (error) console.error('NetWorthHistory query error:', error);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><h2 className="text-lg">Net Worth History</h2></CardHeader>
        <CardContent><div className="h-48 animate-pulse bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader><h2 className="text-lg">Net Worth History</h2></CardHeader>
        <CardContent><p className="text-red-400 text-sm py-8 text-center">Error loading history: {(error as Error).message}</p></CardContent>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader><h2 className="text-lg">Net Worth History</h2></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm py-8 text-center">No history yet. Snapshots are recorded monthly.</p></CardContent>
      </Card>
    );
  }

  const ticks = generateTicks(filtered, 'netWorth');

  return (
    <div>
      <div className="flex justify-center"><YearSelector year={year} onChange={setYear} availableYears={availableYears} /></div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={filtered} margin={{ top: 20, bottom: 0 }}>
          <defs>
            <linearGradient id="nwGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis mirror tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 12 }} tickLine={false} ticks={ticks} domain={[ticks[0], ticks[ticks.length - 1]]} />
          <Tooltip formatter={(value: number) => [formatCurrency(value), '']} contentStyle={{ borderRadius: '0.5rem' }} />
          <Area type="monotone" dataKey="netWorth" name="Net Worth" stroke="#10b981" fill="url(#nwGradient)" strokeWidth={2} connectNulls />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const AssetsHistoryChart = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const { filtered, chartData, availableYears } = useYearData(year);
  if (!chartData || chartData.length === 0) return null;

  const ticks = generateTicks(filtered, 'assets');

  return (
    <div>
      <div className="flex justify-center"><YearSelector year={year} onChange={setYear} availableYears={availableYears} /></div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={filtered} margin={{ top: 20, bottom: 0 }}>
          <defs>
            <linearGradient id="assetsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis mirror tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 12 }} tickLine={false} ticks={ticks} domain={[ticks[0], ticks[ticks.length - 1]]} />
          <Tooltip formatter={(value: number) => [formatCurrency(value), '']} contentStyle={{ borderRadius: '0.5rem' }} />
          <Area type="monotone" dataKey="assets" name="Assets" stroke="#3b82f6" fill="url(#assetsGradient)" strokeWidth={2} connectNulls />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const LiabilitiesHistoryChart = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const { filtered, chartData, availableYears } = useYearData(year);
  if (!chartData || chartData.length === 0) return null;

  const ticks = generateTicks(filtered, 'liabilities');

  return (
    <div>
      <div className="flex justify-center"><YearSelector year={year} onChange={setYear} availableYears={availableYears} /></div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={filtered} margin={{ top: 20, bottom: 0 }}>
          <defs>
            <linearGradient id="liabilitiesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis mirror tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 12 }} tickLine={false} ticks={ticks} domain={[ticks[0], ticks[ticks.length - 1]]} />
          <Tooltip formatter={(value: number) => [formatCurrency(value), '']} contentStyle={{ borderRadius: '0.5rem' }} />
          <Area type="monotone" dataKey="liabilities" name="Liabilities" stroke="#ef4444" fill="url(#liabilitiesGradient)" strokeWidth={2} connectNulls />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
