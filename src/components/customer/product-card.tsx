'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
  showAdd?: boolean;
  onAdd?: () => void;
}

const lucideMap: Record<string, string> = {
  rice_bowl: '🍚',
  bakery_dining: '🍞',
  coffee: '☕',
  local_cafe: '🍵',
  local_bar: '🧃',
  icecream: '🍦',
  percent: '💰',
  apps: '📦',
};

export default function ProductCard({ product, showAdd = false, onAdd }: ProductCardProps) {
  return (
    <Link href={`/beranda/${product.id}`} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative h-32 overflow-hidden bg-gray-100">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {lucideMap[product.categories?.icon || 'apps'] || '📦'}
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-white/90 px-1.5 py-0.5 rounded-full shadow-sm">
          <Star className="h-3 w-3 text-yellow-500 fill-current" />
          <span className="text-xs font-medium text-gray-800">4.8</span>
        </div>
      </div>
      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-gray-800 line-clamp-1">{product.name}</h3>
        <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="font-bold text-primary">Rp {product.price.toLocaleString('id-ID')}</span>
          {showAdd && onAdd && (
            <button
              onClick={(e) => { e.preventDefault(); onAdd(); }}
              className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}