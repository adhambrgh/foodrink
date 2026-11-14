import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Utensils, Coffee, Package, Pizza, Sandwich, Salad, IceCream } from 'lucide-react';
import { getCategoriesWithCounts } from '@/lib/supabase/kategori';
import { getBanners } from '@/app/admin/banner/actions';
import BerandaHeader from './beranda-header';

export const metadata = {
  title: 'Beranda - FoodDrink',
  description: 'Temukan makanan dan minuman favoritmu. Pesan online, antar ke kelas atau ambil sendiri. Cepat, praktis, dan hemat.',
};

const ProductCard = dynamic(() => import('@/components/customer/product-card'), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-surface-variant rounded-2xl" />,
});

const BannerCarousel = dynamic(() => import('@/components/customer/banner-carousel'), {
  ssr: false,
  loading: () => <div className="h-40 md:h-56 animate-pulse bg-surface-variant rounded-xl" />,
});

const categoryIcons = {
  utensils: Utensils,
  coffee: Coffee,
  package: Package,
  pizza: Pizza,
  sandwich: Sandwich,
  salad: Salad,
  icecream: IceCream,
};

export default async function BerandaPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/beranda');
  }

  const [categories, banners, { data: products }] = await Promise.all([
    getCategoriesWithCounts(),
    getBanners(true),
    supabase
      .from('products')
      .select('id, name, description, price, image_url, is_active, stock, categories(name, icon)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  return (
    <>
      <main id="main-content" className="flex min-h-screen flex-col bg-surface">
        <div className="px-4 pt-safe pt-6 pb-28">
          <BerandaHeader user={user} />

          <h1 className="sr-only">Beranda - FoodDrink</h1>

          {/* Banner */}
          <section className="mb-6" aria-labelledby="banner-heading">
            <h2 id="banner-heading" className="sr-only">Banner Promosi</h2>
            <BannerCarousel banners={banners || []} />
          </section>

          {/* Categories */}
          <section className="mb-6" aria-labelledby="categories-heading">
            <h2 id="categories-heading" className="text-lg font-bold text-text mb-3">Kategori</h2>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => {
                  const Icon = categoryIcons[cat.icon as keyof typeof categoryIcons] || categoryIcons.utensils;
                return (
                  <Link
                    key={cat.id}
                    href={`/produk?category=${cat.id}`}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-surface-variant transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-xs text-text text-center leading-tight">{cat.name}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Products */}
          <section aria-labelledby="products-heading">
            <div className="flex items-center justify-between mb-3">
              <h2 id="products-heading" className="text-lg font-bold text-text">Menu Terlaris</h2>
              <Link
                href="/produk"
                className="text-sm text-primary hover:underline"
              >
                Lihat semua
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {products?.map((p: any) => (
                <ProductCard key={p.id} product={p as any} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
