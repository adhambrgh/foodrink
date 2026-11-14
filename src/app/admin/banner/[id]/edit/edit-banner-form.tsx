'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Upload, Trash2, Save } from 'lucide-react';
import { updateBanner } from '../../actions';

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export function EditBannerForm({ banner }: { banner: Banner }) {
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({
    title: banner.title,
    subtitle: banner.subtitle || '',
    link_url: banner.link_url || '',
    sort_order: String(banner.sort_order),
    is_active: banner.is_active,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked } = e.target;
    const value = type === 'checkbox' ? checked : e.target.value;
    setData({ ...data, [name]: value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const resp = await fetch('/api/upload-image', { method: 'POST', body: fd });
    if (!resp.ok) {
      const err = await resp.json();
      alert('Upload gagal: ' + (err.error ?? 'unknown'));
      setUploading(false);
      return;
    }
    const json = await resp.json();
    if (json.success && json.url) {
      setImagePreview(json.url);
      setImageRemoved(false);
    } else {
      alert('Upload gagal: ' + (json.error ?? 'unknown'));
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    fd.set('title', data.title);
    fd.set('subtitle', data.subtitle);
    fd.set('link_url', data.link_url);
    fd.set('sort_order', data.sort_order);
    fd.set('is_active', data.is_active ? 'on' : 'off');
    const image = imageRemoved ? '' : (imagePreview || banner.image_url);
    fd.set('image_url', image);
    const result = await updateBanner(banner.id, fd);
    setLoading(false);
    if (result?.error) alert(result.error);
    else {
      router.push('/admin/banner');
      router.refresh();
    }
  };

  return (
    <div className="bg-surface-card border border-border rounded-xl p-4 md:p-6 space-y-5">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Judul</label>
          <input name="title" value={data.title} onChange={handleChange} required className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Subtitle (opsional)</label>
          <input name="subtitle" value={data.subtitle} onChange={handleChange} className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Link (opsional)</label>
          <input name="link_url" value={data.link_url} onChange={handleChange} className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Urutan (0=first)</label>
          <input name="sort_order" type="number" value={data.sort_order} onChange={handleChange} className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25" />
        </div>
        <div className="flex items-center">
          <input id="is_active" name="is_active" type="checkbox" checked={data.is_active} onChange={handleChange} className="mr-2" />
          <label htmlFor="is_active" className="text-sm text-text">Aktif</label>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Gambar Banner</label>
          {(imagePreview || banner.image_url) && !imageRemoved ? (
            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
              <img src={imagePreview || banner.image_url} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { setImageRemoved(true); setImagePreview(null); }}
                className="absolute top-2 left-2 p-1.5 bg-error/80 text-white rounded-full"
                aria-label="Hapus gambar banner"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="absolute top-2 right-2 p-1.5 bg-error/80 text-white rounded-full"
                  aria-label="Batalkan upload baru"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div
              className="w-full h-48 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/40"
              onClick={() => { setImageRemoved(false); document.getElementById('banner-img')?.click(); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setImageRemoved(false);
                  document.getElementById('banner-img')?.click();
                }
              }}
              tabIndex={0}
              role="button"
            >
              <Upload className="w-7 h-7 text-text-muted/50" />
              <p className="text-xs text-text-muted">
                {uploading ? 'Mengupload...' : imageRemoved ? 'Gambar dihapus. Klik untuk tambah gambar' : 'Klik untuk upload gambar'}
              </p>
            </div>
          )}
          <input id="banner-img" type="file" accept="image/*" hidden onChange={handleImageUpload} />
        </div>
        <button type="submit" disabled={loading || uploading} className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading || uploading ? (
            <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />{uploading ? 'Mengupload...' : 'Menyimpan...'}</span>
          ) : 'Simpan'}
        </button>
      </form>
    </div>
  );
}