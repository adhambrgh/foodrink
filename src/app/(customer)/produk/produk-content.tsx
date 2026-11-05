'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import ProductCard from '@/components/customer/product-card';
import Link from 'next/link';
import { ArrowLeft, Filter, UserRound } from 'lucide-react';
import FilterBar from './filter-bar';

export default function ProdukContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) {
          router.replace('/login?redirectTo=/produk');
          return;
        }

        const [categoriesRes, productsRes] = await Promise.all([
          supabase.from('categories').select('id, name, icon').eq('active', true).order('name'),
          supabase.from('products').select('id, name, description, price, image_url, is_active, stock, categories(id, name, icon)').eq('is_active', true).order('created_at', { ascending: false })
        ]);

        if (categoriesRes.error) throw categoriesRes.error;
        if (productsRes.error) throw productsRes.error;

        setCategories(categoriesRes.data || []);

        let filteredProducts: any[] = productsRes.data || [];
        if (search) {
          filteredProducts = filteredProducts.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description?.toLowerCase().includes(search.toLowerCase())
          );
        }
        if (category) {
          filteredProducts = filteredProducts.filter((p: any) => {
            const catId = Array.isArray(p.categories)
              ? p.categories[0]?.id
              : p.categories?.id;
            return catId === category;
          });
        }

        setProducts(filteredProducts);

        // Fetch ratings for these products
        if (filteredProducts.length > 0) {
          const productIds = filteredProducts.map(p => p.id);
          const { data: ratingData } = await supabase
            .from('reviews')
            .select('product_id, rating')
            .in('product_id', productIds)
            .eq('is_visible', true);

          if (ratingData) {
            const avgRatings: Record<string, number> = {};
            const countMap: Record<string, number> = {};
            ratingData.forEach(r => {
              if (!avgRatings[r.product_id]) {
                avgRatings[r.product_id] = 0;
                countMap[r.product_id] = 0;
              }
              avgRatings[r.product_id] += r.rating;
              countMap[r.product_id] += 1;
            });
            Object.keys(avgRatings).forEach(key => {
              avgRatings[key] = avgRatings[key] / countMap[key];
            });
            setRatings(avgRatings);
          }

          // Fetch favorites for current user
          const { data: favData } = await supabase
            .from('favorites')
            .select('product_id')
            .eq('user_id', user.id)
            .in('product_id', productIds);

          if (favData) {
            const favMap: Record<string, boolean> = {};
            favData.forEach(f => { favMap[f.product_id] = true; });
            setFavorites(favMap);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat produk');
      }
    };

    fetchData();
  }, [router, search, category]);

  const categoryName = categories?.find(c => c.id === category)?.name;

  if (error) {
    return (
      <main className="flex min-h-screen flex-col bg-surface items-center justify-center px-4">
        <div className="px-4 text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-sm font-semibold text-primary hover:underline"
          >
            Kembali
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="flex min-h-screen flex-col bg-surface">
        <div className="px-4 pt-safe pt-6 pb-28">
          <header className="mb-5 flex items-center justify-between border-b border-black/5 pb-3">
            <Link href="/beranda" aria-label="Kembali ke beranda" className="rounded-full p-2 text-text transition-colors hover:bg-surface-variant">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Foodrink</p>
              <h1 className="font-display text-lg leading-tight text-text">Produk</h1>
            </div>
            <Link href="/akun" aria-label="Buka akun" className="rounded-full bg-primary p-2 text-white">
              <UserRound className="h-4 w-4" />
            </Link>
          </header>
          <p className="mb-4 text-sm text-text-muted">Semua menu makanan & minuman</p>

          <FilterBar
            categories={categories || []}
            search={search}
            category={category}
          />

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-text">
              {categoryName ? `${categoryName}` : 'Semua Produk'}
              {search && ` - Hasil untuk "${search}"`}
            </h2>
            <span className="text-sm text-text-muted">{products?.length || 0} produk</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {products && products.length > 0 ? (
              products.map((p: any) => (
                <ProductCard
                  key={p.id}
                  product={p as any}
                  rating={ratings[p.id]}
                  isFavorite={favorites[p.id]}
                />
              ))
            ) : (
              <div className="col-span-2 flex flex-col items-center justify-center py-12">
                <Filter className="w-12 h-12 text-text-muted/30 mb-3" />
                <p className="text-text-muted text-center">
                  {search || category
                    ? 'Tidak ada produk yang cocok'
                    : 'Belum ada produk tersedia'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
