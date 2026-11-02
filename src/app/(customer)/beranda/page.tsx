import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProductCard from '@/components/customer/product-card';
import BottomNav from '@/components/customer/bottom-nav';

const categories = [
  { id: '1', name: 'Makanan Berat', icon: 'rice_bowl' },
  { id: '2', name: 'Cemilan', icon: 'bakery_dining' },
  { id: '3', name: 'Kopi', icon: 'coffee' },
  { id: '4', name: 'Teh', icon: 'local_cafe' },
  { id: '5', name: 'Jus', icon: 'local_bar' },
  { id: '6', name: 'Dessert', icon: 'icecream' },
  { id: '7', name: 'Paket Hemat', icon: 'percent' },
  { id: '8', name: 'Lainnya', icon: 'apps' },
];

export default async function BerandaPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/beranda');
  }

  const { data: products } = await supabase
    .from('products')
    .select('id, name, description, price, image_url, is_active, stock, categories(name, icon)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(8);

  return (
    <>
      <main className="flex min-h-screen flex-col bg-surface">
        <div className="px-4 pt-safe pb-28">
          {/* Header */}
          <header className="flex items-center justify-between mb-4">
            <div>
              <p className="text-text-muted text-sm">Halo,</p>
              <h1 className="text-xl font-bold text-text">{(user.user_metadata as any)?.full_name?.split(' ')[0] || user.email?.split('@')[0]}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-white">notifications</span>
              </button>
            </div>
          </header>

          {/* Search Bar */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Cari makanan atau minuman..."
              className="w-full rounded-full bg-white px-4 py-2.5 text-sm focus:outline-none"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">search</span>
          </div>

          {/* Categories */}
          <section className="mb-6">
            <h2 className="text-lg font-bold text-text mb-3">Kategori</h2>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button key={cat.id} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-surface-variant">
                  <span className="text-3xl">{cat.icon === 'rice_bowl' ? '🍚' : cat.icon === 'bakery_dining' ? '🥐' : cat.icon === 'coffee' ? '☕' : cat.icon === 'local_cafe' ? '🍵' : cat.icon === 'local_bar' ? '🧃' : cat.icon === 'icecream' ? '🍦' : cat.icon === 'percent' ? '💰' : '📦'}</span>
                  <span className="text-xs text-text w-full text-center">{cat.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Promo */}
          <section className="mb-6">
            <h2 className="text-lg font-bold text-text mb-3">Promo Spesial</h2>
            <div className="bg-orange-100 rounded-xl p-4 text-orange-800">
              <h3 className="font-bold mb-1">Diskon 35% Akhir Bulan</h3>
              <p className="text-sm">Berlaku untuk semua gerai</p>
            </div>
          </section>

          {/* Products */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-text">Menu Terlaris</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {products?.map((p: any) => (
                <ProductCard key={p.id} product={p as any} />
              ))}
            </div>
          </section>
        </div>
      </main>
      <BottomNav />
    </>
  );
}