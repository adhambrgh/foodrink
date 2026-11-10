'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckSquare,
  Clock3,
  ReceiptText,
  ShoppingBag,
  Square,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { supabase } from '@/lib/supabase/client';
import QuantityStepper from '@/components/customer/quantity-stepper';
import { formatCurrency } from '@/lib/utils';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function KeranjangPage() {
  const router = useRouter();
  const { items, loading, update, remove, error, selectedCartIds, setSelectedCartIds } = useCart();
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
    });
  }, [router]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.qty, 0),
    [items]
  );

  const selectedTotal = useMemo(
    () => items
      .filter(item => selectedCartIds.includes(item.cart_id))
      .reduce((sum, item) => sum + item.product.price * item.qty, 0),
    [items, selectedCartIds]
  );

  const allSelected = items.length > 0 && items.every(item => selectedCartIds.includes(item.cart_id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedCartIds([]);
    } else {
      setSelectedCartIds(items.map(item => item.cart_id));
    }
  };

  const toggleItem = (cartId: string) => {
    setSelectedCartIds(prev =>
      prev.includes(cartId) ? prev.filter(id => id !== cartId) : [...prev, cartId]
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <LoadingScreen />
      </div>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface px-5 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-surface">
        <header className="border-b border-black/5 bg-surface px-4 pb-4 pt-safe pt-5">
          <div className="flex items-center justify-between">
            <Link href="/beranda" prefetch={true} aria-label="Kembali ke beranda" className="rounded-full p-2 text-text hover:bg-surface-variant">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-sans text-lg text-text">Keranjang Belanja</h1>
            <Link href="/akun" prefetch={true} aria-label="Buka akun" className="rounded-full bg-primary p-2 text-white">
              <UserRound className="h-4 w-4" />
            </Link>
          </div>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center px-6 pb-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-primary/10 text-primary">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <h2 className="font-sans text-xl text-text">Belum ada yang dipesan</h2>
          <p className="mt-1 max-w-xs text-sm leading-relaxed text-text-muted">
            Pilih menu yang ingin kamu nikmati, lalu kembali ke sini.
          </p>
          <Link href="/produk" prefetch={true} className="mt-5 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark">
            Lihat menu
          </Link>
        </main>
      </div>
    );
  }

return (
    <div className="min-h-screen bg-surface text-text">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-surface px-4 pb-3 pt-safe pt-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/produk" prefetch={true} aria-label="Kembali ke produk" className="rounded-full p-2 text-text transition-colors hover:bg-surface-variant">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Foodrink</p>
            <h1 className="font-sans text-lg leading-tight">Keranjang Belanja</h1>
          </div>
          <Link href="/akun" prefetch={true} aria-label="Buka akun" className="rounded-full bg-primary p-2 text-white">
            <UserRound className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-40 pt-4">
        <section className="mb-5 rounded-[1.15rem] bg-white p-4 shadow-[0_5px_18px_rgba(70,40,25,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">Pesanan Foodrink</h2>
                <p className="truncate text-xs text-text-muted">{items.length} jenis menu untuk kamu</p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-secondary/10 px-2.5 py-1 text-[10px] font-semibold text-secondary">
              Siap diproses
            </span>
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs text-text-muted">
            <Clock3 className="h-3.5 w-3.5 text-primary" />
            Cek stok sebelum checkout
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="sr-only" />
              {allSelected ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-text-muted" />}
              Pilih semua
            </label>
            <Link href="/produk" prefetch={true} className="text-xs font-semibold text-primary hover:underline">
              + Tambah menu
            </Link>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <article key={item.cart_id} className="rounded-[1.15rem] bg-white p-3.5 shadow-[0_5px_18px_rgba(70,40,25,0.06)]">
                <div className="flex gap-3">
                  <label className="flex shrink-0 cursor-pointer items-start pt-1">
                    <input
                      type="checkbox"
                      checked={selectedCartIds.includes(item.cart_id)}
                      onChange={() => toggleItem(item.cart_id)}
                      aria-label={`Pilih ${item.product.name}`}
                      className="sr-only"
                    />
                    {selectedCartIds.includes(item.cart_id) ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-text-muted" />}
                  </label>
                  <img
                    src={item.product.image_url || `https://picsum.photos/80/80?random=${item.product_id}`}
                    alt={item.product.name}
                    className="h-20 w-20 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{item.product.name}</h3>
                      <button
                        type="button"
                        onClick={() => remove(item.cart_id)}
                        aria-label={`Hapus ${item.product.name}`}
                        className="shrink-0 rounded-full p-1 text-text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-muted">{item.product.description || 'Menu pilihan Foodrink'}</p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-text">{formatCurrency(item.product.price * item.qty)}</span>
                      <QuantityStepper
                        value={item.qty}
                        min={1}
                        max={item.product.stock}
                        onChange={(value) => update(item.cart_id, value)}
                      />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <aside className="fixed inset-x-0 bottom-20 z-40 border-t border-black/5 bg-white px-4 pb-safe pt-3 shadow-[0_-8px_24px_rgba(70,40,25,0.08)]">
        <div className="mx-auto flex max-w-2xl items-center gap-4 pb-3">
          <div className="min-w-0 shrink-0">
            <p className="text-xs text-text-muted">Total pesanan</p>
            <p className="truncate text-lg font-bold text-text">{formatCurrency(selectedTotal)}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (selectedCartIds.length === 0) {
                setShowAlert(true);
              } else {
                router.push('/checkout');
              }
            }}
            className="flex h-12 min-w-0 flex-1 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-[0_5px_12px_rgba(161,64,0,0.2)] transition-colors hover:bg-primary-dark"
          >
            Lanjut ke checkout
          </button>
        </div>
      </aside>

      {showAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAlert(false)}>
          <div
            className="rounded-[1.15rem] bg-white p-5 shadow-[0_10px_40px_rgba(0,0,0,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-semibold text-text">Pilih produk terlebih dahulu</p>
            <button
              type="button"
              onClick={() => setShowAlert(false)}
              className="mx-auto mt-4 block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Oke
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
