import Link from 'next/link';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { getBanners, deleteBanner, toggleBanner } from './actions';
import { PaginatedTable } from '@/components/admin/pagination';

export default async function AdminBannerPage() {
  const banners = await getBanners(false);

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text font-heading">Kelola Banner</h1>
          <p className="text-sm text-text-muted mt-0.5">Banner promosi di halaman beranda</p>
        </div>
        <Link href="/admin/banner/new" className="inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"><Plus className="w-4 h-4" />Tambah Banner</Link>
      </div>

      {banners.length === 0 ? (
        <div className="text-center py-16 bg-surface-card border border-border rounded-xl"><p className="text-text-muted text-sm">Belum ada banner</p><Link href="/admin/banner/new" className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-primary hover:underline"><Plus className="w-4 h-4" />Tambah Banner Pertama</Link></div>
      ) : (
        <PaginatedTable
          columns={<><th className="px-4 py-3 font-medium">Banner</th><th className="px-4 py-3 font-medium text-center">Urutan</th><th className="px-4 py-3 font-medium text-center">Status</th><th className="px-4 py-3 font-medium text-center">Aksi</th></>}
          rows={banners.map((b) => (
            <tr key={b.id} className="border-b border-border/50 last:border-0 hover:bg-surface-variant/30 transition-colors">
              <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-16 h-10 rounded-lg bg-surface-variant/60 flex-shrink-0 flex items-center justify-center overflow-hidden"><img src={b.image_url} alt={b.title} className="w-full h-full object-cover" /></div><div className="min-w-0"><p className="font-medium text-text truncate max-w-xs">{b.title}</p>{b.subtitle && <p className="text-xs text-text-muted truncate max-w-xs">{b.subtitle}</p>}</div></div></td>
              <td className="px-4 py-3 text-center whitespace-nowrap"><span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-surface-variant text-text">{b.sort_order}</span></td>
              <td className="px-4 py-3 text-center"><form action={async () => { 'use server'; await toggleBanner(b.id, !b.is_active); }}><button type="submit" className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${b.is_active ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted'}`}>{b.is_active ? 'Aktif' : 'Nonaktif'}</button></form></td>
              <td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-1"><Link href={`/admin/banner/${b.id}/edit`} className="p-1.5 text-text-muted hover:text-primary rounded-lg hover:bg-surface-variant" title="Edit"><Edit className="w-4 h-4" /></Link><form action={async () => { 'use server'; await deleteBanner(b.id); }} className="inline"><button type="submit" className="p-1.5 text-text-muted hover:text-error rounded-lg hover:bg-surface-variant" title="Hapus"><Trash2 className="w-4 h-4" /></button></form></div></td>
            </tr>
          ))}
        />
      )}
          </div>
  );
}