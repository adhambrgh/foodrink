'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Heart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function FavoritPage() {
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    const fetchFavorites = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('favorites')
        .select('id, products (id, name, price, image_url, categories(name))')
        .eq('user_id', user.id);
      setFavorites((data || []).map((row: any) => ({ id: row.id, ...row.products })));
    };
    fetchFavorites();
  }, []);

  return (
    <main className="flex flex-col min-h-screen bg-surface p-4">
      <h1 className="text-2xl font-bold text-text mb-4">Favorit</h1>
      {favorites.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Heart className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
          <p className="text-text-muted">Belum ada produk favorit</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {favorites.map((product) => (
            <div key={product.id} className="bg-white rounded-lg p-2 border border-gray-100">
              <div className="relative">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-24 object-cover rounded mb-2"
                />
                <button className="absolute top-1 right-1 bg-white rounded-full p-1 shadow">
                  <Heart className="w-4 h-4 fill-primary text-primary" />
                </button>
              </div>
              <h3 className="font-medium text-sm text-text">{product.name}</h3>
              <p className="text-xs text-text-muted mb-1">{product.categories?.name || ''}</p>
              <p className="text-sm font-semibold text-text">{formatCurrency(product.price)}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
