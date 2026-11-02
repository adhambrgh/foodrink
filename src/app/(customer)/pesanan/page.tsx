'use client';

import { History, Clock, CheckCircle2 } from 'lucide-react';

// placeholder until real orders wired up
const placeholderOrders = [
  {
    id: 'ord_abc123',
    total: 58000,
    paymentStatus: 'paid',
    createdAt: '2026-10-27',
    items: [{ name: 'Burger Spesial', qty: 2, price: 25000 }],
  },
  {
    id: 'ord_def456',
    total: 33000,
    paymentStatus: 'pending',
    createdAt: '2026-10-26',
    items: [{ name: 'Minuman Soda', qty: 1, price: 8000 }, { name: 'Fries', qty: 1, price: 15000 }],
  },
];

export default function PesananPage() {
  return (
    <main className="flex flex-col min-h-screen bg-surface p-4">
      <h1 className="text-2xl font-bold text-text mb-4">Pesanan Saya</h1>

      {!placeholderOrders || placeholderOrders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center py-12">
            <History className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
            <p className="text-text-muted mb-2">Belum ada pesanan</p>
            <button className="text-primary hover:underline">
              Lanjut belanja
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {placeholderOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg p-4 border border-gray-100"
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-medium text-text">
                    #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-text-muted">
                    {order.createdAt}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.paymentStatus === 'paid'
                      ? 'bg-green-100 text-success'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {order.paymentStatus === 'paid' ? 'Lunas' : 'Menunggu Bayar'}
                </span>
              </div>

              {/* Items */}
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.name}</span>
                  <span>
                    Rp {item.price.toLocaleString('id-ID')} × {item.qty}
                  </span>
                </div>
              ))}

              <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">
                  Rp {order.total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
