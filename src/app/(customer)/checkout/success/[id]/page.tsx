'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { CheckCircle2, Home, Package, ArrowLeft, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import LoadingScreen from '@/components/ui/LoadingScreen';

interface OrderDetail {
  id: string;
  total: number;
  address: string;
  notes: string | null;
  status: string;
  payment_status: string;
  created_at: string;
  order_items: OrderItem[];
}

interface OrderItem {
  product_id: string;
  qty: number;
  price_snapshot: number;
  name_snapshot: string;
}

interface OrderResponse {
  order: OrderDetail;
}

export default function CheckoutSuccessPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 40; // ~120s total with backoff

  useEffect(() => {
    const fetchOrder = async () => {
      const { search } = window.location;
      if (search.includes('payment_failed=true')) {
        setPaymentFailed(true);
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/orders/${params.id}`, { cache: 'no-store' });
      const data = await res.json();

      if (res.ok && data.order) {
        setOrder(data.order);
        setLoading(false);

        // Keep polling while still pending to catch webhook status change
        if (data.order.payment_status === 'pending' && attempts < MAX_ATTEMPTS) {
          const backoff = Math.min(2 ** attempts * 500, 3000);
          const timer = setTimeout(() => {
            setAttempts(a => a + 1);
            fetchOrder();
          }, backoff);
          return () => clearTimeout(timer);
        }
        return;
      }

      setError(data.error || 'Pesanan tidak ditemukan');
      setLoading(false);
    };

    fetchOrder();
  }, [params.id, attempts]);

  if (loading) {
    return <div className="min-h-screen bg-surface flex items-center justify-center"><LoadingScreen /></div>;
  }

  if (paymentFailed) {
    return (
      <main className="flex min-h-screen flex-col bg-surface px-4 pb-28 pt-safe pt-4">
        <div className="flex-1 flex items-center justify-center text-center">
          <h1 className="font-display text-xl text-text mb-2">Pembayaran Gagal / Pending</h1>
          <p className="text-sm text-text-muted mb-4">Transaksi tidak berhasil diproses. Anda dapat mencobanya lagi.</p>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/beranda"
              className="py-3 rounded-lg bg-surface-variant text-text font-medium text-center hover:bg-surface-hover transition-colors"
            >
              <Home className="w-4 h-4 inline-block mr-1" /> Beranda
            </Link>
            <Link
              href="/pesanan"
              className="py-3 rounded-lg bg-primary text-white font-medium text-center hover:bg-primary-dark transition-colors"
            >
              <Package className="w-4 h-4 inline-block mr-1" /> Pesanan Saya
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="flex min-h-screen flex-col bg-surface px-4 pb-28 pt-safe pt-4">
        <div className="flex-1 flex items-center justify-center text-center">
          <ArrowLeft className="h-5 w-5 text-text-muted mx-auto mb-3" />
          <p className="text-red-600">{error}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              href="/beranda"
              className="py-3 rounded-lg bg-surface-variant text-text font-medium text-center hover:bg-surface-hover transition-colors"
            >
              <Home className="w-4 h-4 inline-block mr-1" /> Beranda
            </Link>
            <Link
              href="/pesanan"
              className="py-3 rounded-lg bg-primary text-white font-medium text-center hover:bg-primary-dark transition-colors"
            >
              <Package className="w-4 h-4 inline-block mr-1" /> Pesanan Saya
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isPaid = order.payment_status === 'paid';
  const statusLabel = isPaid ? 'Pembayaran Berhasil' : 'Menunggu Pembayaran';
  const statusColor = isPaid ? 'bg-success/10 text-success' : 'bg-orange-100 text-orange-800';

  return (
    <main className="flex min-h-screen flex-col bg-surface px-4 pb-28 pt-safe pt-4">
      <header className="mb-5 flex items-center justify-between border-b border-black/5 pb-3">
        <div className="w-10" />
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Foodrink</p>
          <h1 className="font-display text-lg leading-tight text-text">Struk Pembayaran</h1>
        </div>
        <div className="w-10" />
      </header>

      <div className="flex-1 space-y-4">
        <div className="bg-white rounded-lg p-4 border border-gray-100 text-center">
          <CheckCircle2 className={`w-12 h-12 mx-auto mb-3 ${isPaid ? 'text-success' : 'text-orange-500'}`} />
          <h2 className="font-display text-xl text-text">{statusLabel}</h2>
          <p className="mt-1 text-sm text-text-muted">
            Pesanan Anda <span className="font-medium">#{order.id.slice(0, 8)}</span> telah dikonfirmasi
          </p>
          <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
            {isPaid ? 'Lunas' : 'Menunggu Bayar'}
          </span>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <h3 className="font-medium text-text mb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-text-muted" /> Detail Pesanan
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Tanggal</span>
              <span className="text-text">{new Date(order.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Alamat</span>
              <span className="text-text text-right max-w-[60%]">{order.address}</span>
            </div>
            {order.notes && (
              <div className="flex justify-between">
                <span className="text-text-muted">Catatan</span>
                <span className="text-text text-right max-w-[60%]">{order.notes}</span>
              </div>
            )}
          </div>

          <div className="mt-4 border-t pt-4">
            <h4 className="font-medium text-text mb-2">Item Pesanan</h4>
            <div className="space-y-2">
              {order.order_items.map((item: OrderItem, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <div className="flex-1 mr-2">
                    <p className="font-medium text-text">{item.name_snapshot}</p>
                    <p className="text-xs text-text-muted">{item.qty} × {formatCurrency(item.price_snapshot)}</p>
                  </div>
                  <span className="font-medium text-text">{formatCurrency(item.price_snapshot * item.qty)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-primary mb-1">Selanjutnya?</p>
              <p className="text-text-muted">
                {isPaid
                  ? 'Pesanan akan diproses oleh admin. Anda akan mendapat notifikasi saat status berubah.'
                  : 'Selesaikan pembayaran untuk memproses pesanan.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-black/5 p-4 sticky bottom-0">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/beranda"
            className="py-3 rounded-lg bg-surface-variant text-text font-medium text-center hover:bg-surface-hover transition-colors"
          >
            <Home className="w-4 h-4 inline-block mr-1" /> Beranda
          </Link>
          <Link
            href="/pesanan"
            className="py-3 rounded-lg bg-primary text-white font-medium text-center hover:bg-primary-dark transition-colors"
          >
            <Package className="w-4 h-4 inline-block mr-1" /> Pesanan Saya
          </Link>
        </div>
      </div>
    </main>
  );
}
