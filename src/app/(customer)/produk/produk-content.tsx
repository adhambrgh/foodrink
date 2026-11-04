'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import ProductCard from '@/components/customer/product-card';
import BottomNav from '@/components/customer/bottom-nav';
import { Filter } from 'lucide-react';
import FilterBar from './filter-bar';
import LoadingSpinner from '@/components/ui/loading-spinner';

export default function ProdukContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat produk');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, search, category]);

  const categoryName = categories?.find(c => c.id === category)?.name;

  if (loading) {
    return (
      <>
        <main className="flex min-h-screen flex-col bg-surface">
          <div className="px-4 pt-safe pb-28 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        </main>
        <BottomNav />
      </>
    );
  }

  if (error) {
    return (
      <>
        <main className="flex min-h-screen flex-col bg-surface items-center justify-center">
          <div className="px-4 text-center">
            <p className="text-red-500 mb-2">{error}</p>
          </div>
        </main>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <main className="flex min-h-screen flex-col bg-surface">
        <div className="px-4 pt-safe pb-28">
          <header className="mb-4">
            <h1 className="text-xl font-bold text-text">Produk</h1>
            <p className="text-sm text-text-muted">Semua menu makanan & minuman</p>
          </header>

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
                <ProductCard key={p.id} product={p as any} />
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
      <BottomNav />
    </>
  );
}
