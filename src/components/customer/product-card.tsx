'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, Star, X } from 'lucide-react';
import { useState } from 'react';
import { Product } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';

interface ProductCardProps {
  product: Product;
  rating?: number;
  isFavorite?: boolean;
  onFavoriteChange?: (favorite: boolean) => void;
}

export default function ProductCard({
  product,
  rating,
  isFavorite = false,
  onFavoriteChange,
}: ProductCardProps) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(isFavorite);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [action, setAction] = useState<'cart' | 'buy' | null>(null);

  const stopCardNavigation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const requireUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?redirectTo=/produk`);
      return null;
    }
    return user;
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    stopCardNavigation(e);
    if (busy) return;

    const user = await requireUser();
    if (!user) return;

    setBusy(true);
    if (favorite) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', product.id);
      if (!error) {
        setFavorite(false);
        onFavoriteChange?.(false);
      } else setMsg('Gagal menghapus favorit.');
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, product_id: product.id });
      if (!error) {
        setFavorite(true);
        onFavoriteChange?.(true);
      } else setMsg('Gagal menambah favorit.');
    }
    setBusy(false);
  };

  const openQuantityPicker = (e: React.MouseEvent, nextAction: 'cart' | 'buy') => {
    stopCardNavigation(e);
    if (busy || product.stock < 1) return;
    setQuantity(1);
    setAction(nextAction);
    setMsg(null);
  };

  const confirmCartAction = async () => {
    if (!action || busy) return;

    const user = await requireUser();
    if (!user) return;

    setBusy(true);
    const { addToCart: add } = await import('@/lib/supabase/cart');
    const result = await add(product.id, quantity);
    setBusy(false);

    if (result.error) {
      setMsg(result.error);
      setAction(null);
      return;
    }

    setAction(null);
    if (action === 'buy') {
      router.push('/keranjang');
    } else {
      setMsg('Produk ditambahkan ke keranjang.');
    }
  };

  return (
    <>
      <Link
        href={`/${product.id}`}
        className="group flex flex-col overflow-hidden rounded-2xl bg-[#FAF8F5] shadow-sm transition-shadow hover:shadow-md"
      >
        <div className="relative h-36 overflow-hidden rounded-t-2xl ring-1 ring-black/5">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="100%"
              className="object-cover transition-shadow duration-300 hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-text-muted">
              <span className="text-sm">Gambar tidak tersedia</span>
            </div>
          )}

          <div className="absolute left-2 top-2 flex items-center gap-0.5 rounded-full bg-white/80 px-1.5 py-0.5 shadow ring-1 ring-black/5">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            <span className="text-xs font-medium text-gray-800">
              {rating ? rating.toFixed(1) : '—'}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleFavorite}
            aria-label={favorite ? 'Hapus dari favorit' : 'Tambah ke favorit'}
            className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition ${favorite ? 'text-red-500' : 'text-text-muted hover:text-red-500'}`}
          >
            <Heart className={`h-4 w-4 ${favorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-between space-y-1.5 p-3.5">
          <div>
            <h3 className="line-clamp-1 font-semibold text-gray-800">{product.name}</h3>
            <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{product.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-2">
            <button
              type="button"
              onClick={e => openQuantityPicker(e, 'cart')}
              disabled={busy || product.stock < 1}
              className="flex h-9 min-w-0 w-full items-center justify-center gap-1 rounded-lg border border-primary bg-transparent px-1.5 text-[10px] font-semibold leading-none text-primary transition-colors hover:bg-primary/10 active:scale-[0.98] disabled:opacity-50"
            >
              <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Keranjang</span>
            </button>
            <button
              type="button"
              onClick={e => openQuantityPicker(e, 'buy')}
              disabled={busy || product.stock < 1}
              className="h-9 min-w-0 w-full rounded-lg bg-primary px-1.5 text-[10px] font-semibold leading-tight text-white transition-colors hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50"
            >
              <span className="block truncate">Beli sekarang</span>
            </button>
          </div>
        </div>
      </Link>

      {action && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 pb-24">
          <div className="w-full max-w-md rounded-t-2xl bg-[#FAF8F5] p-5 shadow-xl" role="dialog" aria-modal="true" aria-labelledby={`quantity-title-${product.id}`}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Jumlah pesanan</p>
                <h2 id={`quantity-title-${product.id}`} className="mt-1 text-lg font-semibold text-text">{product.name}</h2>
                <p className="mt-1 text-xs text-text-muted">Stok tersedia: {product.stock}</p>
              </div>
              <button
                type="button"
                onClick={() => setAction(null)}
                aria-label="Tutup pilihan jumlah"
                className="rounded-full p-1 text-text-muted hover:bg-black/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label htmlFor={`quantity-${product.id}`} className="text-sm font-medium text-text">Jumlah</label>
            <input
              id={`quantity-${product.id}`}
              type="number"
              min={1}
              max={product.stock}
              value={quantity}
              onChange={event => setQuantity(Math.min(product.stock, Math.max(1, Number(event.target.value) || 1)))}
              className="mt-2 h-12 w-full rounded-lg border border-black/10 bg-white px-3 text-center text-lg font-semibold text-text outline-none focus:border-primary"
            />

            <button
              type="button"
              onClick={confirmCartAction}
              disabled={busy}
              className="mt-4 h-12 w-full rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {busy ? 'Menyimpan...' : action === 'buy' ? 'Lanjut ke keranjang' : 'Tambah ke keranjang'}
            </button>
          </div>
        </div>
      )}

      {msg && (
        <div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 rounded-lg bg-[#2b211d] px-4 py-3 text-center text-xs font-medium text-white shadow-lg" role="status">
          {msg}
        </div>
      )}
    </>
  );
}
