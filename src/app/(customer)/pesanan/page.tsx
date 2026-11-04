'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { History } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function PesananPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('orders')
        .select('id, total, payment_status, created_at, order_items (product_id, qty, price_snapshot)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setOrders(data || []);
    };
    fetchOrders();
  }, []);

  return (
    <main className="flex flex-col min-h-screen bg-surface p-4">
      <h1 className="text-2xl font-bold text-text mb-4">Pesanan Saya</h1>
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
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-medium text-text">#{order.id.slice(0,8)}</p>
                  <p className="text-xs text-text-muted">{new Date(order.created_at).toLocaleDateString('id-ID')}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.payment_status==='paid' ? 'bg-green-100 text-success' : 'bg-orange-100 text-orange-800'}`}>
                  {order.payment_status==='paid' ? 'Lunas' : 'Menunggu Bayar'}
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
