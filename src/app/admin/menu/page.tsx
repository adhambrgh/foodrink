import { createAdminClient } from '@/lib/supabase/server-admin';
import { Package, Plus, Search, Edit } from 'lucide-react';
import Link from 'next/link';
import { getCategories } from './actions';
import { DeleteProductButton } from './delete-product-button';

async function getProducts() {
  const supabase = createAdminClient();
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id, name, description, price, image_url, is_active, stock,
      categories (name, icon)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return products || [];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default async function AdminMenuPage() {
  const products = await getProducts();
  const categories = await getCategories();

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text font-heading">Kelola Menu</h1>
          <p className="text-sm text-text-muted mt-0.5">Kelola produk makanan dan minuman</p>
        </div>
        <Link
          href="/admin/menu/new"
          className="inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Produk
        </Link>
      </div>

      {/* Products */}
      {products.length === 0 ? (
        <div className="text-center py-16 bg-surface-card border border-border rounded-xl">
          <Package className="w-12 h-12 text-text-muted/30 mx-auto mb-3" />
          <p className="text-text-muted text-sm">Belum ada produk</p>
          <Link href="/admin/menu/new" className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-primary hover:underline">
            <Plus className="w-4 h-4" />
            Tambah Produk Pertama
          </Link>
        </div>
      ) : (
        <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted border-b border-border bg-surface-variant/40">
                  <th className="px-4 py-3 font-medium">Produk</th>
                  <th className="px-4 py-3 font-medium text-right">Harga</th>
                  <th className="px-4 py-3 font-medium text-center">Stok</th>
                  <th className="px-4 py-3 font-medium text-center">Status</th>
                  <th className="px-4 py-3 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p: any) => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-surface-variant/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-variant/60 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-text-muted/50" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-text truncate">{p.name}</p>
                          <p className="text-xs text-text-muted">{p.categories?.name || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-text whitespace-nowrap">{formatCurrency(p.price)}</td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                        p.stock > 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                      }`}>
                        {p.stock > 0 ? `${p.stock} tersedia` : 'Habis'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        p.is_active
                          ? 'bg-success/10 text-success'
                          : 'bg-text-muted/10 text-text-muted'
                      }`}>
                        {p.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/admin/menu/${p.id}/edit`}
                          className="p-1.5 text-text-muted hover:text-primary rounded-lg hover:bg-surface-variant transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <DeleteProductButton id={p.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {products.length > 0 && (
        <p className="text-xs text-text-muted">{products.length} produk</p>
      )}
    </div>
  );
}
