'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';
import ProductCard from '@/components/customer/product-card';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function FavoritPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirectTo=/akun/favorit');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          products (
            id,
            name,
            image_url,
            price,
            category_id,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) {
        setFavorites(data || []);
      }
      setLoading(false);
    };

    fetchFavorites();
  }, [router]);

  const removeFavorite = async (productId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (!error) {
      setFavorites(prev => prev.filter(f => f.product_id !== productId));
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface p-4">
        <LoadingScreen />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-surface px-4 pb-28 pt-safe pt-4">
      <header className="mb-5 flex items-center justify-between border-b border-black/5 pb-3">
        <Link href="/akun" prefetch={true} aria-label="Kembali ke akun" className="rounded-full p-2 text-text transition-colors hover:bg-surface-variant">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h14" />
          </svg>
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Foodrink</p>
          <h1 className="font-sans text-lg leading-tight text-text">Favorit Saya</h1>
        </div>
        <Link href="/notifikasi" prefetch={true} aria-label="Buka notifikasi" className="rounded-full bg-primary p-2 text-white">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1" />
          </svg>
        </Link>
      </header>

      {favorites.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
          <Heart className="h-12 w-12 text-text-muted" />
          <p className="text-text">Belum ada produk favorit.</p>
          <Link
            href="/produk"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            <ShoppingBag className="h-4 w-4" />
            Cari produk
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 pb-6">
          {favorites.map(fav => (
            <ProductCard
              key={fav.products?.id}
              product={fav.products}
              isFavorite={true}
            />
          ))}
        </div>
      )}
    </main>
  );
}
