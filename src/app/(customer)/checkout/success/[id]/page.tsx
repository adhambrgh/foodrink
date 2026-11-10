'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { motion } from 'framer-motion';
import {
  ReceiptHeroCard,
  ReceiptItemRow,
  ReceiptDetailGrid,
  ReceiptNextSteps,
  ReceiptActions,
} from '@/components/ui';

interface OrderDetail {
  id: string;
  total: number;
  address: string;
  notes: string | null;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  order_items: OrderItem[];
}

interface OrderItem {
  product_id: string;
  qty: number;
  price_snapshot: number;
  name_snapshot: string;
}

type Variant = 'cod' | 'paid' | 'pending' | 'failed';

export default function CheckoutSuccessPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 20;

  const receiptRef = useRef<HTMLDivElement>(null);

  const getVariant = (paymentMethod: string, paymentStatus: string): Variant => {
    if (paymentMethod === 'cod') return 'cod';
    if (paymentStatus === 'paid') return 'paid';
    if (paymentStatus === 'pending') return 'pending';
    return 'failed';
  };

  const variant = order ? getVariant(order.payment_method, order.payment_status) : 'pending';

  useEffect(() => {
    const fetchOrder = async () => {
      const { search } = window.location;
      if (search.includes('payment_failed=true')) {
        setPaymentFailed(true);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/orders/${params.id}`, { cache: 'no-store' });
        const data = await res.json();

        if (res.ok && data.order) {
          const fetchedOrder = data.order;
          setOrder(fetchedOrder);
          setLoading(false);

          const isCod = fetchedOrder.payment_method === 'cod';
          const shouldPoll = !isCod && fetchedOrder.payment_status === 'pending';

          if (shouldPoll && attempts < MAX_ATTEMPTS) {
            const backoff = Math.min(1000 + attempts * 500, 3000);
            const timer = setTimeout(() => {
              setAttempts((a) => a + 1);
              fetchOrder();
            }, backoff);
            return () => clearTimeout(timer);
          }
          return;
        }

        setError(data.error || 'Pesanan tidak ditemukan');
        setLoading(false);
      } catch {
        setError('Gagal memuat data pesanan');
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.id, attempts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <LoadingScreen />
      </div>
    );
  }

  if (paymentFailed) {
    return (
      <main className="flex min-h-screen flex-col bg-surface px-4 pb-28 pt-safe pt-4">
        <div id="receipt-content" ref={receiptRef} className="flex-1 flex items-center justify-center text-center">
          <div className="space-y-4 max-w-sm">
            <div className="w-24 h-24 mx-auto rounded-full bg-error/10 flex items-center justify-center">
              <svg className="w-12 h-12 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h1 className="font-sans text-xl text-text mb-2">Pembayaran Gagal</h1>
              <p className="text-sm text-text-muted mb-6">Transaksi tidak berhasil diproses. Anda dapat mencobanya lagi.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/beranda"
                className="py-3 rounded-xl bg-surface-variant text-text font-medium text-center hover:bg-surface-hover transition-colors"
              >
                Beranda
              </a>
              <a
                href="/pesanan"
                className="py-3 rounded-xl bg-primary text-white font-medium text-center hover:bg-primary-dark transition-colors"
              >
                Pesanan Saya
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="flex min-h-screen flex-col bg-surface px-4 pb-28 pt-safe pt-4">
        <div id="receipt-content" ref={receiptRef} className="flex-1 flex items-center justify-center text-center">
          <div className="space-y-4 max-w-sm">
            <p className="text-red-600">{error || 'Pesanan tidak ditemukan'}</p>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/beranda"
                className="py-3 rounded-xl bg-surface-variant text-text font-medium text-center hover:bg-surface-hover transition-colors"
              >
                Beranda
              </a>
              <a
                href="/pesanan"
                className="py-3 rounded-xl bg-primary text-white font-medium text-center hover:bg-primary-dark transition-colors"
              >
                Pesanan Saya
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const formattedDate = new Date(order.created_at).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <main className="flex min-h-screen flex-col bg-surface px-4 pt-safe">
      <div
        id="receipt-content"
        ref={receiptRef}
        className="flex-1 w-full max-w-md mx-auto py-6 pb-32"
      >
        <ReceiptHeroCard
          variant={variant}
          orderId={order.id}
          total={order.total}
        />

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 space-y-4"
        >
          <h3 className="font-medium text-text flex items-center gap-2">
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Item Pesanan
          </h3>

          <div className="space-y-3 border-t border-neutral-100 pt-3">
            {order.order_items.map((item: OrderItem, idx: number) => (
              <ReceiptItemRow
                key={idx}
                name={item.name_snapshot}
                qty={item.qty}
                price={item.price_snapshot}
                subtotal={item.price_snapshot * item.qty}
              />
            ))}
          </div>

          <div className="border-t border-neutral-100 pt-3 flex justify-between font-bold text-lg">
            <span className="text-text">Total</span>
            <span className="text-primary tabular-nums">{formatCurrency(order.total)}</span>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100"
        >
          <ReceiptDetailGrid
            tanggal={formattedDate}
            alamat={order.address}
            catatan={order.notes}
            metodeBayar={order.payment_method}
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <ReceiptNextSteps variant={variant} />
        </motion.section>

        <ReceiptActions orderId={order.id} receiptRef={receiptRef} />
      </div>
    </main>
  );
}