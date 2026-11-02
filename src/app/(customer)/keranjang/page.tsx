'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Plus, Minus, Trash2, User, LogOut } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { supabase } from '@/lib/supabase/client';
import QuantityStepper from '@/components/customer/quantity-stepper';
import { formatCurrency } from '@/lib/utils';

export default function KeranjangPage() {
  const router = useRouter();
  const { items, loading, add, update, remove, error } = useCart();
  const [total, setTotal] = useState(0);

  // Check auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
    });
  }, [router]);

  useEffect(() => {
    const calcTotal = items.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
    setTotal(calcTotal);
  }, [items]);

  if (loading) return <div className="p-4">Memuat...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <header className="p-4 border-b border-border bg-surface">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-text">Keranjang</h1>
            <Link href="/login" className="p-2 rounded-lg hover:bg-surface-variant">
              <User className="w-5 h-5 text-text" />
            </Link>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center">
          <ShoppingBag className="w-12 h-12 text-text-muted mb-3" />
          <p className="text-text-muted">Keranjang masih kosong</p>
          <Link href="/beranda" className="mt-4 text-primary hover:underline">
            Mulai belanja
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-border bg-surface">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-text">Keranjang</h1>
          <Link href="/akun" className="p-2 rounded-lg hover:bg-surface-variant">
            <User className="w-5 h-5 text-text" />
          </Link>
        </div>
      </header>

      {/* Cart Items */}
      <main className="flex-1 p-4">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.cart_id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-border">
              <img
                src={item.product.image_url || `https://picsum.photos/80/80?random=${item.product_id}`}
                alt={item.product.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1">
                <h3 className="font-medium text-text">{item.product.name}</h3>
                <p className="text-sm text-text-muted">Rp {item.product.price.toLocaleString('id-ID')}</p>
                <QuantityStepper
                  value={item.qty}
                  min={1}
                  onChange={(val: number) => update(item.cart_id, val)}
                />
              </div>
              <button
                onClick={() => remove(item.cart_id)}
                className="p-2 rounded-lg hover:bg-red-50 text-red-500"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Summary & Checkout */}
      <div className="bg-white p-4 border-t border-border">
        <div className="flex justify-between mb-3">
          <span className="text-text-muted">Subtotal</span>
          <span className="font-medium text-text">Rp {total.toLocaleString('id-ID')}</span>
        </div>
        <Link
          href="/checkout"
          className="w-full inline-flex items-center justify-center py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Lanjut ke Pembayaran
        </Link>
      </div>
    </div>
  );
}