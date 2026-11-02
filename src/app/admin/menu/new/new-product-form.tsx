'use client';

import { useState, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Trash2, Save } from 'lucide-react';
import { createProduct } from '../actions';

type Category = { id: string; name: string };

type NewProductFormProps = {
  categories: Category[];
};

export function NewProductForm({ categories }: NewProductFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category_id: '',
    image_url: '',
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const response = await fetch('/api/upload-image', { method: 'POST', body: uploadData });
      const result = await response.json();

      if (result.success && result.url) {
        setImagePreview(result.url);
        setData({ ...data, image_url: result.url });
      } else {
        alert('Gagal upload gambar: ' + result.error);
      }
    } catch {
      alert('Gagal upload gambar');
    }

    setUploading(false);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData();
    fd.set('name', data.name);
    fd.set('description', data.description);
    fd.set('price', data.price);
    fd.set('stock', data.stock);
    fd.set('category_id', data.category_id);
    fd.set('image_url', data.image_url);

    const result = await createProduct(fd);
    setLoading(false);

    if (result.error) {
      alert(result.error);
    } else {
      router.push('/admin/menu');
      router.refresh();
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text font-heading">Tambah Produk</h1>
        <p className="text-sm text-text-muted mt-0.5">Tambahkan produk baru ke menu</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-card border border-border rounded-xl p-4 md:p-6 space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text mb-1.5">Nama Produk</label>
          <input
            id="name" name="name" value={data.name} onChange={handleChange} required
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25 text-sm"
            placeholder="Contoh: Nasi Goreng"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-text mb-1.5">Deskripsi</label>
          <textarea
            id="description" name="description" rows={3} value={data.description} onChange={handleChange}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25 text-sm resize-y"
            placeholder="Deskripsi produk..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-text mb-1.5">Harga (Rp)</label>
            <input
              id="price" name="price" type="number" min="0" value={data.price} onChange={handleChange} required
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25 text-sm"
              placeholder="25000"
            />
          </div>
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-text mb-1.5">Stok</label>
            <input
              id="stock" name="stock" type="number" min="0" value={data.stock} onChange={handleChange} required
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25 text-sm"
              placeholder="100"
            />
          </div>
        </div>

        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-text mb-1.5">Kategori</label>
          <select
            id="category_id" name="category_id" value={data.category_id} onChange={handleChange} required
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25 text-sm"
          >
            <option value="">Pilih kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Gambar Produk</label>
          {imagePreview ? (
            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { setImagePreview(null); setData({ ...data, image_url: '' }); }}
                className="absolute top-2 right-2 p-1.5 bg-error text-white rounded-lg hover:bg-error/90 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/40 transition-colors"
            >
              <Upload className="w-7 h-7 text-text-muted/50" />
              <p className="text-xs text-text-muted">{uploading ? 'Mengupload...' : 'Klik untuk upload gambar'}</p>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </div>

        <button
          type="submit" disabled={loading || uploading}
          className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
        >
          {loading || uploading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
              {uploading ? 'Mengupload...' : 'Menyimpan...'}
            </span>
          ) : 'Simpan'}
        </button>
      </form>
    </div>
  );
}
