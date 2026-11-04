'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

type Category = { id: string; name: string };

type FilterBarProps = {
  categories: Category[];
  search: string;
  category?: string;
};

export default function FilterBar({ categories, search, category }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(search);
  const prevQueryRef = useRef(search);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const trimmed = query.trim();
      if (trimmed === prevQueryRef.current) return;
      prevQueryRef.current = trimmed;

      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) params.set('search', trimmed);
      else params.delete('search');
      if (category) params.set('category', category);
      else params.delete('category');

      const qs = params.toString();
      router.push(qs ? `/produk?${qs}` : '/produk', { scroll: false });
    }, 400);
    return () => clearTimeout(timeout);
  }, [query, category, router, searchParams]);

  const clearCategory = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    const qs = params.toString();
    router.push(qs ? `/produk?${qs}` : '/produk', { scroll: false });
  };

  return (
    <div className="space-y-3 mb-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Cari produk..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-full bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        )}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-text">Kategori</h2>
            {category && (
              <button
                onClick={clearCategory}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <X className="w-3 h-3" />
                Hapus filter
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  category === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-white text-text border border-border hover:bg-surface-variant'
                }`}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (query.trim()) params.set('search', query.trim());
                  else params.delete('search');
                  if (cat.id !== category) params.set('category', cat.id);
                  else params.delete('category');
                  const qs = params.toString();
                  router.push(qs ? `/produk?${qs}` : '/produk', { scroll: false });
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
