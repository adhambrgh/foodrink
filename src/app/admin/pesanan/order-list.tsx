'use client';

import { useMemo, useState } from 'react';
import { CheckCircle, ChevronDown, ChevronLeft, ChevronRight, Clock, CreditCard, Filter, Package, Search, Trash2, Truck, QrCode } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import OrderStatusButton from './status-button';
import DeleteOrderButton from '@/components/admin/delete-order-button';
import { usePagination } from '@/components/admin/pagination';

export interface Order {
  id: string;
  user_id: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total: number;
  address: string | null;
  notes: string | null;
  created_at: string;
  profiles: { name?: string | null; email?: string | null; role?: string | null } | { name?: string | null; email?: string | null; role?: string | null }[] | null;
  order_items: any[];
}

type PaymentMethod = 'all' | 'qris' | 'cod';
type DateFilter = 'today' | 'week' | 'month' | 'all';

export default function OrderList({ orders: initialOrders }: { orders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredOrders = useMemo(() => orders.filter((order) => {
    if (search) {
      const query = search.toLowerCase();
      const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
      const matchesSearch = [order.id, profile?.name, profile?.email]
        .some((value) => value?.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }
    if (paymentFilter !== 'all' && order.payment_method !== paymentFilter) return false;
    if (dateFilter !== 'all') {
      const now = new Date();
      const orderDate = new Date(order.created_at);
      const start = dateFilter === 'today'
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
        : dateFilter === 'month'
          ? new Date(now.getFullYear(), now.getMonth(), 1)
          : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (orderDate < start) return false;
    }
    return true;
  }), [orders, search, paymentFilter, dateFilter]);

  const { page: currentPage, setPage, pagedItems, pageCount, hasPrev, hasNext } = usePagination(filteredOrders);

  // Generate sequence number per page (1-based)
  const pageSize = usePagination(filteredOrders).pageSize || 10;
  const startIndex = (currentPage - 1) * pageSize;

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-text">Pesanan Masuk</h1>
          <p className="mt-0.5 text-sm text-text-muted">Kelola semua pesanan yang masuk</p>
        </div>
        <button
          onClick={() => setShowFilters((value) => !value)}
          className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-surface-variant"
        >
          <Filter className="h-4 w-4" /> Filter
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          placeholder="Cari ID, nama pelanggan, atau email..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
        />
      </div>

      {showFilters && (
        <div className="rounded-xl border border-border bg-surface-card p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FilterGroup label="Metode Pembayaran">
              {(['all', 'qris', 'cod'] as const).map((method) => (
                <FilterButton key={method} active={paymentFilter === method} onClick={() => setPaymentFilter(method)}>
                  {method === 'all' ? 'Semua' : method === 'qris' ? 'QRIS DANA' : 'COD'}
                </FilterButton>
              ))}
            </FilterGroup>
            <FilterGroup label="Periode Waktu">
              {(['all', 'today', 'week', 'month'] as const).map((period) => (
                <FilterButton key={period} active={dateFilter === period} onClick={() => setDateFilter(period)}>
                  {period === 'all' ? 'Semua Waktu' : period === 'today' ? 'Hari Ini' : period === 'week' ? '7 Hari Terakhir' : 'Bulan Ini'}
                </FilterButton>
              ))}
            </FilterGroup>
          </div>
        </div>
      )}

      {pagedItems.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-card py-16 text-center">
          <Package className="mx-auto mb-3 h-12 w-12 text-text-muted/30" />
          <p className="text-sm text-text-muted">{orders.length ? 'Tidak ada pesanan yang cocok dengan filter' : 'Belum ada pesanan'}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
<thead>
                  <tr className="border-b border-border bg-surface-variant/40 text-left text-text-muted">
                    <th className="px-4 py-3 text-center font-medium">No.</th>
                    <th className="px-4 py-3 font-medium">ID</th>
                    <th className="px-4 py-3 font-medium">Pelanggan</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                    <th className="px-4 py-3 text-center font-medium">Status</th>
                    <th className="px-4 py-3 text-center font-medium">Bayar</th>
                    <th className="px-4 py-3 text-center font-medium">Metode</th>
                    <th className="px-4 py-3 text-center font-medium">Waktu</th>
                    <th className="px-4 py-3 text-center font-medium">Aksi</th>
                  </tr>
                </thead>
               <tbody>
                  {pagedItems.map((order, i) => {
                    const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
                    const isPaid = order.status === 'selesai' || order.payment_status === 'paid';
                    return (
<tr key={order.id} className="border-b border-border/50 last:border-0 hover:bg-surface-variant/30">
                          <td className="px-4 py-3 text-center font-mono text-xs">{startIndex + i + 1}</td>
                          <td className="px-4 py-3 font-mono text-xs text-text-muted">#{order.id.slice(0, 8)}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-text">{profile?.name || '-'}</div>
                            <div className="text-xs text-text-muted">{profile?.email || ''}</div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-text">{formatCurrency(order.total)}</td>
                          <td className="px-4 py-3 text-center"><StatusBadge status={order.status} /></td>
                          <td className="px-4 py-3 text-center">
                            {isPaid ? <CheckCircle className="mx-auto h-5 w-5 text-success" /> : <Clock className="mx-auto h-5 w-5 text-yellow-500" />}
                          </td>
                          <td className="px-4 py-3 text-center"><PaymentBadge method={order.payment_method} /></td>
                          <td className="whitespace-nowrap px-4 py-3 text-center text-xs text-text-muted">
                            {new Date(order.created_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              <OrderStatusButton orderId={order.id} currentStatus={order.status} />
                              <Link href={`/admin/pesanan/${order.id}`} className="inline-flex rounded-lg p-1.5 text-primary hover:bg-primary/10" title="Detail">
                                <Package className="h-4 w-4" />
                              </Link>
                              <DeleteOrderButton orderId={order.id} />
                            </div>
                          </td>
                        </tr>
                      );
                  })}
                </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={!hasPrev}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-text hover:bg-surface-variant disabled:opacity-40"
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" /> Sebelum
          </button>
          {pageNumbers(currentPage, pageCount).map((number, index) =>
            typeof number === 'number' ? (
              <button
                key={index}
                onClick={() => setPage(number)}
                aria-current={number === currentPage ? 'page' : undefined}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${number === currentPage ? 'bg-primary text-white' : 'border border-border bg-white text-text hover:bg-surface-variant'}`}
              >
                {number}
              </button>
            ) : (
              <span key={index} className="inline-flex w-10 items-center justify-center text-text-muted">…</span>
            )
          )}
          <button
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            disabled={!hasNext}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-text hover:bg-surface-variant disabled:opacity-40"
            aria-label="Halaman selanjutnya"
          >
            Sesudah <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}

function pageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1) as (number | 'ellipsis')[];
  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) pages.push('ellipsis');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-2 block text-sm font-medium text-text">{label}</label><div className="flex flex-wrap gap-2">{children}</div></div>;
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`rounded-full px-3 py-1.5 text-sm font-medium ${active ? 'bg-primary text-white' : 'border border-border bg-white text-text hover:bg-surface-variant'}`}>{children}</button>;
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    selesai: { label: 'Selesai', class: 'bg-success/10 text-success' },
    dikirim: { label: 'Dikirim', class: 'bg-blue-100 text-blue-700' },
    diproses: { label: 'Diproses', class: 'bg-yellow-100 text-yellow-700' },
  };
  const { label, class: cls } = config[status as keyof typeof config] || config.diproses;
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{label}</span>;
}

function PaymentBadge({ method }: { method: string }) {
  const isCod = method === 'cod';
  const isQris = method === 'qris';
  return <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${isCod ? 'bg-orange-100 text-orange-700' : isQris ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
    {isCod ? <Truck className="mr-1 h-3 w-3" /> : isQris ? <QrCode className="mr-1 h-3 w-3" /> : <CreditCard className="mr-1 h-3 w-3" />}
    {isCod ? 'COD' : isQris ? 'QRIS' : method}
  </span>;
}