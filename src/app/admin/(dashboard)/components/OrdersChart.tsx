'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { CHART_COLORS, STATUS_COLOR_MAP } from '@/lib/chart-colors';
import { useOrdersSeries } from '@/hooks/useDashboardData';
import { ChartWrapper } from './ChartWrapper';

type Range = '7d' | '30d' | '90d';

const RANGE_LABELS: Record<Range, string> = { '7d': '7 Hari', '30d': '30 Hari', '90d': '90 Hari' };

const STATUS_CONFIG = [
  { key: 'pending', label: 'Pending', color: STATUS_COLOR_MAP.pending },
  { key: 'preparing', label: 'Disiapkan', color: STATUS_COLOR_MAP.preparing },
  { key: 'ready', label: 'Siap', color: STATUS_COLOR_MAP.ready },
  { key: 'delivered', label: 'Dikirim', color: STATUS_COLOR_MAP.delivered },
  { key: 'cancelled', label: 'Dibatalkan', color: STATUS_COLOR_MAP.cancelled },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 dark:bg-zinc-100 border border-zinc-700 dark:border-zinc-300 rounded-lg p-3 shadow-lg min-w-[200px]">
      <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium mb-2">{label}</p>
      {payload
        .filter((p: any) => p.value > 0)
        .map((entry: any, i: number) => {
          const status = STATUS_CONFIG.find((s) => s.key === entry.dataKey);
          return (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status?.color }} />
              <span className="text-white dark:text-zinc-900">{status?.label}: </span>
              <span className="font-bold text-white dark:text-zinc-900">{entry.value}</span>
            </div>
          );
        })}
    </div>
  );
}

function CustomLegend({ payload }: any) {
  return (
    <div className="flex flex-wrap gap-3 mt-2" role="list" aria-label="Status pesanan">
      {payload.map((entry: any, i: number) => (
        <button
          key={i}
          type="button"
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          style={{
            color: entry.inactive ? '#9CA3AF' : entry.color,
            backgroundColor: entry.inactive ? 'transparent' : `${entry.color}15`,
            border: entry.inactive ? '1px dashed #D1D5DB' : `1px solid ${entry.color}40`,
          }}
          onClick={() => {}}
          aria-pressed={!entry.inactive}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.value}
        </button>
      ))}
    </div>
  );
}

function OrdersChartContent({ range }: { range: Range }) {
  const { data, isLoading, error } = useOrdersSeries(range);

  const chartData = data || [];

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EB" horizontal={false} vertical={true} />
        <XAxis
          type="number"
          domain={[0, 'dataMax + 1']}
          tick={{ fontSize: 11, fill: '#6B7684', fontFamily: 'Poppins, sans-serif' }}
          axisLine={{ stroke: '#E4E7EB' }}
          tickLine={false}
          tickFormatter={(value) => value.toLocaleString('id-ID')}
        />
        <YAxis
          dataKey="label"
          type="category"
          width={50}
          tick={{ fontSize: 11, fill: '#6B7684', fontFamily: 'Poppins, sans-serif' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'none' }} />
        <Legend
          content={<CustomLegend />}
          wrapperStyle={{ paddingTop: 8 }}
        />
        {STATUS_CONFIG.map((status, i) => (
          <Bar
            key={status.key}
            dataKey={status.key}
            fill={status.color}
            radius={[0, 4, 4, 0]}
            maxBarSize={18}
            isAnimationActive={!window.matchMedia('(prefers-reduced-motion: reduce)').matches}
            animationDuration={600}
            animationEasing="ease-out"
          >
            {chartData.map((_entry, idx) => (
              <Cell key={`cell-${status.key}-${idx}`} fill={status.color} />
            ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function OrdersChart() {
  const [range, setRange] = useState<Range>('7d');

  return (
    <ChartWrapper
      id="orders-chart"
      title="Pesanan per Status"
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
      <OrdersChartContent range={range} />
    </ChartWrapper>
  );
}