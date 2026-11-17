'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, Star, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import { useSession } from '@/components/providers/supabase-provider';
import { AuthPrompt } from '@/components/auth';

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
  const { session, loading: sessionLoading } = useSession();
  const [favorite, setFavorite] = useState(isFavorite);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [action, setAction] = useState<'cart' | 'buy' | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [productOptions, setProductOptions] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Fetch flavor options
  useEffect(() => {
    const fetchOptions = async () => {
      const { data } = await supabase
        .from('product_options')
        .select('id, name, is_available, is_default')
        .eq('product_id', product.id)
        .eq('is_available', true)
        .order('sort_order');
      if (data && data.length > 0) {
        setProductOptions(data);
        const defaultOpt = data.find((o) => o.is_default) || data[0];
        setSelectedOption(defaultOpt.id);
      }
    };
    fetchOptions();
  }, [product.id]);

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
    if (busy || sessionLoading) return;

    if (!session) {
      setAuthOpen(true);
      return;
    }

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
    if (busy || product.stock < 1 || sessionLoading) return;
    if (!session) {
      setAuthOpen(true);
      return;
    }
    setQuantity(1);
    setAction(nextAction);
    setMsg(null);
  };

  const confirmCartAction = async () => {
    if (!action || busy) return;

    const user = await requireUser();
    if (!user) return;

    setBusy(true);
    const { addToCart: add } = await import('@/lib/supabase/cart-actions');
    const result = await add(product.id, quantity, selectedOption || undefined);
    setBusy(false);

    if (result.error) {
      setMsg(result.error);
      setAction(null);
      return;
    }

    setAction(null);
    if (action === 'buy') {
      // Redirect to checkout with the new cart item
      router.push(`/checkout?buy_now=${result.cart_id}`);
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
              sizes="(max-width: 640px) 50vw, 25vw"
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
            className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition duration-300 ease-out active:scale-95 ${favorite ? 'text-red-500' : 'text-text-muted hover:text-red-500'}`}
          >
            <Heart className={`h-4 w-4 transition duration-300 ease-out ${favorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-between space-y-1.5 p-3.5">
          <div>
            <h3 className="line-clamp-1 font-semibold text-gray-800">{product.name}</h3>
            <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{product.description}</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-semibold text-[#a94716]">{formatCurrency(product.price)}</span>
              <span className="text-xs text-gray-500"></span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={e => openQuantityPicker(e, 'cart')}
              disabled={busy || product.stock < 1}
              aria-label={`Tambah ${product.name} ke keranjang`}
              className="flex h-10 min-w-0 w-full items-center justify-center gap-2 rounded-lg border border-primary bg-transparent px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 active:scale-[0.98] disabled:opacity-50"
            >
              <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">Keranjang</span>
            </button>
            <button
              type="button"
              onClick={e => openQuantityPicker(e, 'buy')}
              disabled={busy || product.stock < 1}
              aria-label={`Beli ${product.name} sekarang`}
              className="h-10 min-w-0 w-full rounded-lg bg-primary px-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50"
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

            {/* Flavor Options */}
            {productOptions.length > 0 && (
              <div className="mb-4 space-y-2">
                <label className="text-sm font-medium text-text">Pilih Rasa</label>
                <div className="flex flex-wrap gap-2">
                  {productOptions.map((opt: any) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedOption(opt.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition ${
                        selectedOption === opt.id
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 text-text hover:border-primary/50'
                      }`}
                    >
                      {opt.name}
                      {opt.is_default && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <label htmlFor={`quantity-${product.id}`} className="text-sm font-medium text-text">Jumlah</label>
            <div className="mt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={busy || quantity <= 1}
                aria-label="Kurangi jumlah"
                className="h-12 w-12 rounded-lg border border-black/10 bg-white text-text font-semibold text-xl transition-colors hover:bg-surface-variant disabled:opacity-50 disabled:cursor-not-allowed"
              >
                −
              </button>
              <input
                id={`quantity-${product.id}`}
                type="number"
                min={1}
                max={product.stock}
                value={quantity}
                onChange={event => {
                  const raw = (event.target as HTMLInputElement).value;
                  // Allow empty or 0 temporarily while typing
                  if (raw === '' || raw === '0') {
                    setQuantity(0);
                    return;
                  }
                  const num = Math.min(product.stock, Math.max(1, Number(raw) || 1));
                  setQuantity(num);
                }}
                onBlur={event => {
                  // On blur, enforce min 1
                  const raw = (event.target as HTMLInputElement).value;
                  const num = Math.min(product.stock, Math.max(1, Number(raw) || 1));
                  setQuantity(num);
                }}
                onKeyDown={event => {
                  // Replace leading 0 when typing
                  const input = event.target as HTMLInputElement;
                  if (input.value === '0' && event.key >= '1' && event.key <= '9') {
                    event.preventDefault();
                    input.value = event.key;
                    setQuantity(Number(event.key));
                  }
                }}
                className="h-12 w-20 rounded-lg border border-black/10 bg-white px-3 text-center text-lg font-semibold text-text outline-none focus:border-primary"
                inputMode="numeric"
              />
              <button
                type="button"
                onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                disabled={busy || quantity >= product.stock}
                aria-label="Tambah jumlah"
                className="h-12 w-12 rounded-lg border border-black/10 bg-white text-text font-semibold text-xl transition-colors hover:bg-surface-variant disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={confirmCartAction}
              disabled={busy}
              className="mt-4 h-12 w-full rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {busy ? 'Menyimpan...' : 'Lanjut'}
            </button>
          </div>
        </div>
      )}

      {msg && (
        <div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 rounded-lg bg-[#2b211d] px-4 py-3 text-center text-xs font-medium text-white shadow-lg" role="status">
          {msg}
        </div>
      )}

      <AuthPrompt
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        message="Tambah ke keranjang, simpan favorit, dan beli sekarang perlu akun."
      />
    </>
  );
}
