'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';
import { useTopProducts } from '@/hooks/useDashboardData';
import { CHART_COLORS } from '@/lib/chart-colors';
import { ChartWrapper } from './ChartWrapper';
import Image from 'next/image';

interface TopProduct {
  id: string;
  name: string;
  image_url: string | null;
  total_sold: number;
  total_revenue: number;
  trend: number[];
}

type SortKey = 'total_sold' | 'total_revenue';
type SortDir = 'asc' | 'desc';

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const maxVal = Math.max(...data, 1);
  const minVal = Math.min(...data);
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={data.map((v, i) => ({ value: v, idx: i }))} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis type="number" dataKey="idx" axisLine={false} tickLine={false} tick={false} />
        <YAxis domain={[minVal * 0.8, maxVal * 1.2]} axisLine={false} tickLine={false} tick={false} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={false}
          fill="url(#sparkGradient)"
          fillOpacity={1}
          isAnimationActive={!window.matchMedia('(prefers-reduced-motion: reduce)').matches}
          animationDuration={600}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function TopProductsTableContent() {
  const { data, isLoading, error } = useTopProducts(10);
  const [sortKey, setSortKey] = useState<SortKey>('total_sold');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  if (!data?.length) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-surface-variant mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p className="text-text-muted">Belum ada produk terjual periode ini</p>
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" role="table">
        <thead>
          <tr className="border-b border-border">
            <th className="px-3 py-2 text-left font-medium text-text-muted">#</th>
            <th className="px-3 py-2 text-left font-medium text-text-muted">Produk</th>
            <th
              className="px-3 py-2 text-right font-medium text-text-muted cursor-pointer hover:text-text select-none"
              onClick={() => handleSort('total_sold')}
              aria-sort={sortKey === 'total_sold' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Terjual
              {sortKey === 'total_sold' && (sortDir === 'asc' ? ' ▲' : ' ▼')}
            </th>
            <th
              className="px-3 py-2 text-right font-medium text-text-muted cursor-pointer hover:text-text select-none"
              onClick={() => handleSort('total_revenue')}
              aria-sort={sortKey === 'total_revenue' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Pendapatan
              {sortKey === 'total_revenue' && (sortDir === 'asc' ? ' ▲' : ' ▼')}
            </th>
            <th className="px-3 py-2 text-left font-medium text-text-muted w-32">Tren 7H</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sortedData.map((product, index) => (
            <tr
              key={product.id}
              className="hover:bg-surface-variant/50 transition-colors"
              tabIndex={0}
            >
              <td className="px-3 py-3 text-text-muted font-medium">{index + 1}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-3">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="rounded-lg object-cover bg-surface-variant"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center">
                      <svg className="w-5 h-5 text-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <span className="font-medium text-text truncate max-w-[200px]">{product.name}</span>
                </div>
              </td>
              <td className="px-3 py-3 text-right font-semibold text-text tabular-nums">{product.total_sold.toLocaleString('id-ID')}</td>
              <td className="px-3 py-3 text-right font-semibold text-primary tabular-nums">{formatCurrency(product.total_revenue)}</td>
              <td className="px-3 py-3">
                <Sparkline data={product.trend} color={CHART_COLORS.revenue} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TopProductsTable() {
  return (
    <ChartWrapper
      id="top-products-table"
      title="Produk Terlaris"
      subtitle="Berdasarkan jumlah terjual 7 hari terakhir"
    >
      <TopProductsTableContent />
    </ChartWrapper>
  );
}