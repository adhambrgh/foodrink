'use client';

import { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useOrderStatusBreakdown } from '@/hooks/useDashboardData';
import { STATUS_COLOR_MAP, STATUS_FILL_MAP } from '@/lib/chart-colors';
import { ChartWrapper } from './ChartWrapper';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  preparing: 'Disiapkan',
  ready: 'Siap',
  delivered: 'Dikirim',
  cancelled: 'Dibatalkan',
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const total = payload.reduce((sum: number, p: any) => sum + p.value, 0);
  const percent = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0';
  return (
    <div className="bg-zinc-900 dark:bg-zinc-100 border border-zinc-700 dark:border-zinc-300 rounded-lg p-3 shadow-lg min-w-[180px]">
      <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium mb-1">{STATUS_LABELS[data.name] || data.name}</p>
      <p className="text-lg font-bold text-white dark:text-zinc-900">{data.value.toLocaleString('id-ID')} pesanan</p>
      <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">{percent}% dari total</p>
    </div>
  );
}

function CustomLegend({ payload }: any) {
  const total = payload.reduce((sum: number, p: any) => sum + p.value, 0);
  return (
    <div className="space-y-2" role="list" aria-label="Status pesanan">
      {payload.map((entry: any, i: number) => {
        const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
        return (
          <button
            key={i}
            type="button"
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-all hover:bg-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-pressed="false"
          >
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text truncate">{STATUS_LABELS[entry.value] || entry.value}</p>
              <p className="text-xs text-text-muted">{entry.payload.count?.toLocaleString('id-ID') || entry.value?.toLocaleString('id-ID')} pesanan · {percent}%</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function OrderStatusDonutContent({ range }: { range: '7d' | '30d' | '90d' }) {
  const { data, isLoading, error } = useOrderStatusBreakdown(range);

  const chartData = data?.map((d) => ({
    name: d.status,
    value: d.count,
    fill: STATUS_COLOR_MAP[d.status] || '#6B7684',
  })) || [];

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      <div className="relative w-full max-w-xs mx-auto lg:mx-0">
        <ResponsiveContainer width="100%" aspect={1}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              label={false}
              isAnimationActive={!window.matchMedia('(prefers-reduced-motion: reduce)').matches}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {chartData.map((_entry, i) => (
                <Cell key={`cell-${i}`} fill={chartData[i].fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'none' }} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-3xl font-bold text-text font-heading">{total.toLocaleString('id-ID')}</p>
            <p className="text-xs text-text-muted mt-1">Total Pesanan</p>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-64 flex-shrink-0">
        <Legend
          content={<CustomLegend />}
          wrapperStyle={{ paddingTop: 0 }}
        />
      </div>
    </div>
  );
}

export function OrderStatusDonut() {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('7d');

  const RANGE_LABELS: Record<'7d' | '30d' | '90d', string> = { '7d': '7 Hari', '30d': '30 Hari', '90d': '90 Hari' };

  return (
    <ChartWrapper
      id="status-donut"
      title="Distribusi Status Pesanan"
      subtitle={`Periode: ${RANGE_LABELS[range as '7d' | '30d' | '90d']}`}
      action={
        <div className="flex items-center gap-1 bg-surface-variant rounded-lg p-1" role="tablist" aria-label="Pilih rentang waktu">
          {(['7d', '30d', '90d'] as const).map((r) => (
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
      <OrderStatusDonutContent range={range} />
    </ChartWrapper>
  );
}