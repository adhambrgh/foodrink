import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProductCard from '@/components/customer/product-card';
import BannerCarousel from '@/components/customer/banner-carousel';
import { Bell, Search, Utensils, Coffee, Package, Pizza, Sandwich, Salad, IceCream } from 'lucide-react';
import { getCategoriesWithCounts } from '@/lib/supabase/kategori';
import { getBanners } from '@/app/admin/banner/actions';

const categoryIcons = {
  utensils: Utensils,
  coffee: Coffee,
  package: Package,
  pizza: Pizza,
  sandwich: Sandwich,
  salad: Salad,
  icecream: IceCream,
};

function BerandaHeader({ user }: { user: { user_metadata?: { full_name?: string }; email?: string } }) {
  return (
    <>
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Image
            src="/images/logo.jpeg"
            alt="Logo Foodrink"
            width={48}
            height={48}
            className="rounded-full object-cover"
          />
          <div>
            <p className="text-text-muted text-xs">Halo,</p>
            <h1 className="text-base font-bold text-text">{(user.user_metadata as any)?.full_name?.split(' ')[0] || user.email?.split('@')[0]}</h1>
          </div>
        </div>
        <Link href="/notifikasi" prefetch={true} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <Bell className="w-5 h-5 text-white" />
        </Link>
      </header>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Cari makanan atau minuman..."
          className="w-full rounded-full bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
        />
      </div>
    </>
  );
}

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
      <main className="flex min-h-screen flex-col bg-surface">
        <div className="px-4 pt-safe pt-6 pb-28">
          <BerandaHeader user={user} />

          {/* Banner */}
          <section className="mb-6">
            <BannerCarousel banners={banners || []} />
          </section>

          {/* Categories */}
          <section className="mb-6">
            <h2 className="text-lg font-bold text-text mb-3">Kategori</h2>
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
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-text">Menu Terlaris</h2>
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
