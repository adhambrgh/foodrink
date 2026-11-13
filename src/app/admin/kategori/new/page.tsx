'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Utensils, Coffee, Package, Pizza, Sandwich, Salad, IceCream } from 'lucide-react';
import { createCategory } from '../../menu/actions';

type IconKey = 'utensils' | 'coffee' | 'package' | 'pizza' | 'sandwich' | 'salad' | 'icecream';

const iconOptions = [
  { value: 'utensils', label: 'Makanan & Minuman', icon: Utensils },
  { value: 'coffee', label: 'Minuman', icon: Coffee },
  { value: 'package', label: 'Makanan Ringan', icon: Package },
  { value: 'pizza', label: 'Fast Food', icon: Pizza },
  { value: 'sandwich', label: 'Makanan Tengah', icon: Sandwich },
  { value: 'salad', label: 'Sehat', icon: Salad },
  { value: 'icecream', label: 'Jajanan', icon: IceCream },
];

export default function NewCategoryPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<IconKey>('utensils');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set('name', name);
      fd.set('icon', icon);
      fd.set('active', 'true');
      await createCategory(fd);
      router.push('/admin/kategori');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal membuat kategori');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text font-heading">Tambah Kategori</h1>
        <p className="text-sm text-text-muted mt-0.5">Buat kategori baru untuk produk</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-card border border-border rounded-xl p-4 md:p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Nama Kategori</label>
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25 text-sm"
            placeholder="Contoh: Minuman"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Ikon</label>
          <div className="grid grid-cols-4 gap-2">
            {iconOptions.map(({ value, label, icon: Icon }) => (
              <button
                type="button"
                key={value}
                onClick={() => setIcon(value as IconKey)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                  icon === value ? 'border-primary bg-primary/5' : 'border-border hover:bg-surface-variant'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs text-text-muted">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="flex-1 bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2.5 rounded-lg border border-border text-text hover:bg-surface-variant transition-colors">
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}