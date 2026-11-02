'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { updateCategory } from '@/app/admin/menu/actions';

type Category = { id: string; name: string; icon?: string; active?: boolean };
type IconKey = 'utensils' | 'coffee' | 'package' | 'pizza' | 'sandwich' | 'salad' | 'icecream';

const iconMap: { value: IconKey; label: string }[] = [
  { value: 'utensils', label: '📱 Makanan & Minuman' },
  { value: 'coffee', label: '☕ Minuman' },
  { value: 'package', label: '📦 Makanan Ringan' },
  { value: 'pizza', label: '🍕 Fast Food' },
  { value: 'sandwich', label: '🥪 Makanan Tengah' },
  { value: 'salad', label: '🥗 Sehat' },
  { value: 'icecream', label: '🍦 Jajanan' },
];

type EditCategoryFormProps = {
  categories: Category[];
  category: any;
};

export function EditCategoryForm({ category }: EditCategoryFormProps) {
  const router = useRouter();
  const [name, setName] = useState(category.name || '');
  const [icon, setIcon] = useState<IconKey>((category.icon as IconKey) || 'utensils');
  const [active, setActive] = useState(category.active ?? true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set('name', name);
      fd.set('icon', icon);
      fd.set('active', active ? 'true' : 'false');
      await updateCategory(fd, category.id);
      router.push('/admin/kategori');
    } catch {
      alert('Gagal mengubah kategori');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text font-heading">Edit Kategori</h1>
        <p className="text-sm text-text-muted mt-0.5">Perbarui kategori</p>
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
            {iconMap.map(({ value, label }) => (
              <button
                type="button"
                key={value}
                onClick={() => setIcon(value)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                  icon === value ? 'border-primary bg-primary/5' : 'border-border hover:bg-surface-variant'
                }`}
              >
                <span className="text-lg">{label}</span>
                <span className="text-xs text-text-muted">{value}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/25"
            />
            <span className="text-sm text-text">Aktif</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="flex-1 bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2.5 rounded-lg border border-border text-text hover:bg-surface-variant transition-colors">
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}