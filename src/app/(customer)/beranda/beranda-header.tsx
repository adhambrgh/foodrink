'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { Bell, Search } from 'lucide-react';

interface BerandaHeaderProps {
  user: { user_metadata?: { full_name?: string }; email?: string };
}

export default function BerandaHeader({ user }: BerandaHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      window.location.href = `/produk?search=${encodeURIComponent(query)}`;
    }
  };

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
            priority
          />
          <div>
            <p className="text-text-muted text-xs">Halo,</p>
            <p className="text-base font-bold text-text">{(user.user_metadata as any)?.full_name?.split(' ')[0] || user.email?.split('@')[0]}</p>
          </div>
        </div>
        <Link href="/notifikasi" prefetch={true} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center" aria-label="Notifikasi">
          <Bell className="w-5 h-5 text-white" />
        </Link>
      </header>

      <form onSubmit={handleSearch} className="relative mb-4">
        <label htmlFor="search-input" className="sr-only">Cari makanan atau minuman</label>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
        <input
          id="search-input"
          type="search"
          placeholder="Cari makanan atau minuman..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-full bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
        />
      </form>
    </>
  );
}