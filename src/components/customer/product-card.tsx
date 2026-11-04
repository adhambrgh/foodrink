'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, Plus } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  showAdd?: boolean;
  onAdd?: () => void;
}

export default function ProductCard({ product, showAdd = false, onAdd }: ProductCardProps) {
  return (
    <Link href={`/beranda/${product.id}`} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="relative h-32 overflow-hidden bg-gray-100">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="100%"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted">
            <span className="text-sm">Tidak ada gambar</span>
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-white/90 px-1.5 py-0.5 rounded-full shadow-sm">
          <Star className="h-3 w-3 text-yellow-500 fill-current" />
          <span className="text-xs font-medium text-gray-800">4.8</span>
        </div>
      </div>
      <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-gray-800 line-clamp-1">{product.name}</h3>
          <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{product.description}</p>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="font-bold text-primary">{formatCurrency(product.price)}</span>
          {showAdd && onAdd && (
            <button
              onClick={(e) => { e.preventDefault(); onAdd(); }}
              className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}