import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/common/card';
import { useNetWorthHistory } from '@/hooks/api/useNetWorthHistory';
import { formatCurrency, formatCurrencyAbbreviated } from '@/utils/financialUtils';

type FilteredDataList = {
    month: string;
    [key: string]: number | string | undefined;
}[];

function getTickInterval(range: number): number {
  if (range === 0) return 1000;
  // Target 3 data ticks — ±1 buffer brings total to ~5
  const rawInterval = range / 3;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval)));
  const nice = [1, 2, 2.5, 5, 10];
  const normalized = rawInterval / magnitude;
  const chosen = nice.find(n => n >= normalized) ?? 10;
  return chosen * magnitude;
}

function generateTicks(data: FilteredDataList, dataKeys: string[]): { ticks: number[]; interval: number } {
  const values = data.flatMap(d => dataKeys.map(k => d[k])).filter((v): v is number => v != null && typeof v === 'number');
  if (values.length === 0) return { ticks: [], interval: 1000 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const interval = getTickInterval(range);
  const start = Math.floor(min / interval - 1) * interval;
  const end = Math.ceil(max / interval + 1) * interval;
  const ticks: number[] = [];
  for (let t = start; t <= end; t += interval) ticks.push(t);
  return { ticks, interval };
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

  const filtered = useMemo((): FilteredDataList => {
    return MONTHS.map((month, i) => {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`;
      const point = chartData?.find(d => d.date === key);
      if (!point) return { month };
      return { month, ...point } as FilteredDataList[number];
    });
  }, [chartData, year]);

  return { filtered, chartData, isLoading, error, availableYears };
}

export type ChartConfig = { dataKey: string; name: string; color: string; gradientId: string; title: string };

export type MultiChartProps =
  | { config: ChartConfig; configs?: never; title?: never }
  | { configs: ChartConfig[]; title: string; config?: never };

export const HistoryChart = (props: MultiChartProps) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [soloSeries, setSoloSeries] = useState<string | null>(null);
  const { filtered, chartData, isLoading, error, availableYears } = useYearData(year);

  const title = props.config?.title ?? props.title!;

  // For multi-series, filter to only those with data
  const activeSeries = useMemo(() => {
    const series = props.config ? [props.config] : props.configs;
    return series.filter(s => filtered.some(d => d[s.dataKey] != null && d[s.dataKey] !== 0));
  }, [filtered, props.config, props.configs]);

  const handleLegendClick = (dataKey: string) => {
    setSoloSeries(prev => prev === dataKey ? null : dataKey);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><h2 className="text-lg">{title}</h2></CardHeader>
        <CardContent><div className="h-48 animate-pulse bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader><h2 className="text-lg">{title}</h2></CardHeader>
        <CardContent><p className="text-red-400 text-sm py-8 text-center">Error loading history: {(error as Error).message}</p></CardContent>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader><h2 className="text-lg">{title}</h2></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm py-8 text-center">No history yet. Snapshots are recorded monthly.</p></CardContent>
      </Card>
    );
  }

  const visibleSeries = soloSeries ? activeSeries.filter(s => s.dataKey === soloSeries) : activeSeries;
  const { ticks, interval } = generateTicks(filtered, visibleSeries.map(s => s.dataKey));
  const tickFormatter = (v: number) => {
    // Use 1 decimal for sub-million intervals so e.g. $1.1M/$1.2M don't collapse to $1M
    const absMax = Math.max(...ticks.map(Math.abs));
    const unit = absMax >= 1e9 ? 1e9 : absMax >= 1e6 ? 1e6 : 1e3;
    const decimals = interval < unit ? 2 : 0;
    return formatCurrencyAbbreviated(v, decimals);
  };

  return (
    <div>
      <div className="flex justify-center"><YearSelector year={year} onChange={setYear} availableYears={availableYears} /></div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={filtered} margin={{ top: 20 }}>
          <defs>
            {activeSeries.map(s => (
              <linearGradient key={s.gradientId} id={s.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <XAxis dataKey="month" tick={{ fontSize: 12 }} padding={{ left: 10, right: 10 }} />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#99a1af" opacity={0.5} />
          <YAxis mirror width="auto" dy={-10} dx={-5} axisLine={false} tickFormatter={tickFormatter} tick={{ fontSize: 12 }} tickLine={false} ticks={ticks} domain={[ticks[0], ticks[ticks.length - 1]]} />
          <Tooltip formatter={(value: number) => [formatCurrency(value), '']} contentStyle={{ borderRadius: '0.5rem' }} />
          {activeSeries.length > 1 && <Legend iconType="circle" onClick={p => p.dataKey && handleLegendClick(p.dataKey as string)} />}
          {activeSeries.map(s => (
            <Area key={s.dataKey} type="monotone" dataKey={s.dataKey} name={s.name} stroke={s.color} fill={`url(#${s.gradientId})`} strokeWidth={2} connectNulls dot={{ r: 3, fill: s.color }} hide={soloSeries !== null && soloSeries !== s.dataKey} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
