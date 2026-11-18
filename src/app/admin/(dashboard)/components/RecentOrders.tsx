'use client';

import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { useRecentOrders } from '@/hooks/useDashboardData';
import { STATUS_COLOR_MAP } from '@/lib/chart-colors';
import { ChartWrapper } from './ChartWrapper';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  preparing: 'Disiapkan',
  ready: 'Siap',
  delivered: 'Dikirim',
  cancelled: 'Dibatalkan',
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  preparing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  ready: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

function RecentOrdersContent() {
  const { data, isLoading, error } = useRecentOrders(5);

  if (!data?.length) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-surface-variant mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <p className="text-text-muted">Belum ada pesanan baru</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((order) => (
        <Link
          key={order.id}
          href={`/admin/pesanan/${order.id}`}
          className="flex items-center gap-4 p-3 bg-surface-variant/30 rounded-xl hover:bg-surface-variant/50 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-text truncate">
                {order.customer_name || order.customer_email || 'Guest'}
              </span>
              <span className="text-xs text-text-muted font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <p className="text-xs text-text-muted truncate">{new Date(order.created_at).toLocaleString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="flex items-center gap-3 text-right">
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_BADGE_STYLES[order.status] || 'bg-surface-variant text-text-muted'}`}
            >
              {STATUS_LABELS[order.status] || order.status}
            </span>
            <span className="font-semibold text-text tabular-nums whitespace-nowrap">{formatCurrency(order.total)}</span>
            <svg className="w-4 h-4 text-surface-variant group-hover:text-text transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function RecentOrders() {
  return (
    <ChartWrapper
      id="recent-orders"
      title="Pesanan Terbaru"
      subtitle="5 pesanan terakhir"
      action={
        <Link
          href="/admin/pesanan"
          className="text-xs font-medium text-primary hover:text-primary-dark transition-colors"
        >
          Lihat semua →
        </Link>
      }
    >
      <RecentOrdersContent />
    </ChartWrapper>
  );
}