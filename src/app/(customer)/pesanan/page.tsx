'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft, History, UserRound } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function PesananPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('orders')
        .select('id, total, status, payment_status, created_at, order_items (product_id, qty, price_snapshot)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setOrders(data || []);
    };

    fetchOrders();
  }, []);

  return (
    <main className="flex min-h-screen flex-col bg-surface px-4 pb-28 pt-safe pt-4">
      <header className="mb-5 flex items-center justify-between border-b border-black/5 pb-3">
        <Link href="/beranda" prefetch={true} aria-label="Kembali ke beranda" className="rounded-full p-2 text-text transition-colors hover:bg-surface-variant">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Foodrink</p>
          <h1 className="font-display text-lg leading-tight text-text">Pesanan Saya</h1>
        </div>
        <Link href="/akun" prefetch={true} aria-label="Buka akun" className="rounded-full bg-primary p-2 text-white">
          <UserRound className="h-4 w-4" />
        </Link>
      </header>
      {orders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <History className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
          <p className="text-text-muted mb-2">Belum ada pesanan</p>
          <button className="text-primary hover:underline">Lanjut belanja</button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg p-4 border border-gray-100">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text truncate">#{order.id.slice(0,8)}</p>
                  <p className="text-xs text-text-muted">{new Date(order.created_at).toLocaleDateString('id-ID')}</p>
                </div>
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                  {order.status === 'selesai' ? 'Selesai' : 'Diproses'}
                </span>
              </div>
              {(order.order_items || []).map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.product_id}</span>
                  <span>{formatCurrency(item.price_snapshot)} × {item.qty}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(order.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
