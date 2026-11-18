'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { CHART_COLORS, CHART_PALETTE } from '@/lib/chart-colors';
import { useRevenueSeries } from '@/hooks/useDashboardData';
import { ChartWrapper } from './ChartWrapper';

type Range = '7d' | '30d' | '90d';

const RANGE_LABELS: Record<Range, string> = { '7d': '7 Hari', '30d': '30 Hari', '90d': '90 Hari' };

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-zinc-900 dark:bg-zinc-100 border border-zinc-700 dark:border-zinc-300 rounded-lg p-3 shadow-lg min-w-[180px]">
      <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium mb-1">{label}</p>
      <p className="text-lg font-bold text-white dark:text-zinc-900">{formatCurrency(data.revenue)}</p>
      {data.change !== undefined && (
        <p className={`text-xs font-medium mt-1 ${data.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {data.change >= 0 ? '▲' : '▼'} {Math.abs(data.change).toFixed(1)}% vs hari sebelumnya
        </p>
      )}
    </div>
  );
}

function RevenueChartContent({ range }: { range: Range }) {
  const { data, isLoading, error } = useRevenueSeries(range);

  const chartData = data?.map((d, i, arr) => {
    const prev = arr[i - 1]?.revenue || 0;
    const change = prev > 0 ? ((d.revenue - prev) / prev) * 100 : 0;
    return { ...d, change };
  }) || [];

  const revenues = chartData.map((d) => d.revenue).filter((r) => r > 0);
  const dataMin = revenues.length > 0 ? Math.min(...revenues) : 0;
  const dataMax = revenues.length > 0 ? Math.max(...revenues) : 1;
  const yMin = dataMin > 0 ? dataMin * 0.7 : 0;
  const yMax = dataMax * 1.15;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.revenueGradient[0]} stopOpacity={0.4} />
            <stop offset="50%" stopColor={CHART_COLORS.revenueGradient[1]} stopOpacity={0.15} />
            <stop offset="100%" stopColor={CHART_COLORS.revenueGradient[2]} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#E4E7EB"
          vertical={false}
          horizontal={true}
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#6B7684', fontFamily: 'Poppins, sans-serif' }}
          axisLine={{ stroke: '#E4E7EB' }}
          tickLine={false}
          interval={0}
        />
        <YAxis
          domain={[yMin, yMax]}
          tick={{ fontSize: 11, fill: '#6B7684', fontFamily: 'Poppins, sans-serif' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => formatCurrency(value)}
          width={50}
        />
        <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'none' }} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={CHART_COLORS.revenue}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#revenueGradient)"
          connectNulls
          isAnimationActive={!window.matchMedia('(prefers-reduced-motion: reduce)').matches}
          animationDuration={800}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RevenueChart() {
  const [range, setRange] = useState<Range>('7d');

  return (
    <ChartWrapper
      id="revenue-chart"
      title="Tren Pendapatan"
      subtitle={`Periode: ${RANGE_LABELS[range]}`}
      action={
        <div className="flex items-center gap-1 bg-surface-variant rounded-lg p-1" role="tablist" aria-label="Pilih rentang waktu">
          {(['7d', '30d', '90d'] as Range[]).map((r) => (
            <button
              key={r}
              role="tab"
              aria-selected={range === r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                range === r
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      }
    >
      <RevenueChartContent range={range} />
    </ChartWrapper>
  );
}