'use client';

import { Heart } from 'lucide-react';

// placeholder until favorites wired to DB
const placeholderFavorites = [
  {
    id: '1',
    name: 'Burger Spesial',
    price: 25000,
    image: 'https://picsum.photos/80/80',
    category: 'Makanan Berat',
  },
];

export default function FavoritPage() {
  return (
    <main className="flex flex-col min-h-screen bg-surface p-4">
      <h1 className="text-2xl font-bold text-text mb-4">Favorit</h1>

      {!placeholderFavorites || placeholderFavorites.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
            <p className="text-text-muted">Belum ada produk favorit</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {placeholderFavorites.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg p-2 border border-gray-100"
            >
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-24 object-cover rounded mb-2"
                />
                <button className="absolute top-1 right-1 bg-white rounded-full p-1 shadow">
                  <Heart className="w-4 h-4 fill-primary text-primary" />
                </button>
              </div>
              <h3 className="font-medium text-sm text-text">
                {product.name}
              </h3>
              <p className="text-xs text-text-muted mb-1">
                {product.category}
              </p>
              <p className="text-sm font-semibold text-text">
                Rp {product.price.toLocaleString('id-ID')}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
