import { createAdminClient } from '@/lib/supabase/server-admin';
import { Plus, Edit, Utensils, Coffee, Package, Pizza, Sandwich, Salad, IceCream } from 'lucide-react';
import Link from 'next/link';
import { deleteCategory } from '../menu/actions';
import { DeleteCategoryButton } from './delete-category-button';

const categoryIcons = {
  utensils: Utensils,
  coffee: Coffee,
  package: Package,
  pizza: Pizza,
  sandwich: Sandwich,
  salad: Salad,
  icecream: IceCream,
};

async function getCategoriesWithCounts() {
  const supabase = createAdminClient();
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, icon, active')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  const counts = await Promise.all(
    (categories || []).map(async (c: any) => {
      const { count } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('category_id', c.id);
      return { id: c.id, productCount: count || 0 };
    })
  );

  return (categories || []).map((c: any) => {
    const cnt = counts.find((x) => x.id === c.id);
    const IconComponent = c.icon && categoryIcons[c.icon as keyof typeof categoryIcons] ? categoryIcons[c.icon as keyof typeof categoryIcons] : null;
    return { ...c, productCount: cnt?.productCount || 0, IconComponent };
  });
}

export default async function AdminKategoriPage() {
  const categories = await getCategoriesWithCounts();

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text font-heading">Kelola Kategori</h1>
          <p className="text-sm text-text-muted mt-0.5">Kelola kategori makanan dan minuman</p>
        </div>
        <Link
          href="/admin/kategori/new"
          className="inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Kategori
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 bg-surface-card border border-border rounded-xl">
          <Utensils className="w-12 h-12 text-text-muted/30 mx-auto mb-3" />
          <p className="text-text-muted text-sm">Belum ada kategori</p>
          <Link href="/admin/kategori/new" className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-primary hover:underline">
            <Plus className="w-4 h-4" />
            Tambah Kategori Pertama
          </Link>
        </div>
      ) : (
        <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted border-b border-border bg-surface-variant/40">
                  <th className="px-4 py-3 font-medium">Ikon</th>
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium text-center">Produk</th>
                  <th className="px-4 py-3 font-medium text-center">Status</th>
                  <th className="px-4 py-3 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c: any) => {
                  const IconKey = categoryIcons[c.icon as keyof typeof categoryIcons] ? c.icon : 'utensils';
                  const Icon = categoryIcons[IconKey as keyof typeof categoryIcons];
                  return (
                    <tr key={c.id} className="border-b border-border/50 last:border-0 hover:bg-surface-variant/30 transition-colors">
                      <td className="px-4 py-3 text-center">
                        <div className="w-10 h-10 rounded-lg bg-surface-variant/60 flex items-center justify-center mx-auto">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-text">{c.name}</td>
                      <td className="px-4 py-3 text-center text-text-muted">{c.productCount}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${c.active ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted'}`}>
                          {c.active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/admin/kategori/${c.id}/edit`} className="p-1.5 text-text-muted hover:text-primary rounded-lg hover:bg-surface-variant transition-colors">
                            <Edit className="w-4 h-4" />
                          </Link>
                          <form action={deleteCategory} method="post" className="inline">
                            <input type="hidden" name="id" value={c.id} />
                            <DeleteCategoryButton />
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {categories.length > 0 && <p className="text-xs text-text-muted">{categories.length} kategori</p>}
    </div>
  );
}