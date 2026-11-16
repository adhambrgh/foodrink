'use client';

import { useState, useRef, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Trash2, Plus } from 'lucide-react';
import { updateProduct } from '../../actions';

type Category = { id: string; name: string };

type Option = {
  id?: string;
  name: string;
  is_available: boolean;
  is_default: boolean;
};

type EditProductFormProps = {
  categories: Category[];
  product: any;
};

export function EditProductForm({ categories, product }: EditProductFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState({
    name: product.name || '',
    description: product.description || '',
    price: product.price?.toString() || '',
    stock: product.stock?.toString() || '',
    category_id: product.category_id || '',
    image_url: product.image_url || '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(product.image_url || null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [options, setOptions] = useState<Option[]>(
    (product.options || []).map((o: any) => ({
      id: o.id,
      name: o.name,
      is_available: o.is_available,
      is_default: o.is_default,
    }))
  );

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
      if (!response.ok) {
        const err = await response.json();
        alert('Upload gagal: ' + (err.error ?? 'unknown'));
        setUploading(false);
        return;
      }
      const result = await response.json();
      if (result.success && result.url) {
        setImagePreview(result.url);
        setData({ ...data, image_url: result.url });
      } else {
        alert('Upload gagal: ' + (result.error ?? 'unknown'));
      }
    } catch {
      alert('Gagal upload gambar');
    }
    setUploading(false);
  };

  const addOption = () => {
    setOptions([...options, { name: '', is_available: true, is_default: options.length === 0 }]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: keyof Option, value: any) => {
    setOptions(options.map((o, i) => i === index ? { ...o, [field]: value } : o));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData();
    Object.entries(data).forEach(([key, value]) => fd.set(key, value));
    fd.set('options', JSON.stringify(options.map(({ id, ...o }) => o)));
    const result = await updateProduct(fd, product.id);
    setLoading(false);

    if (result.error) alert(result.error);
    else router.push('/admin/menu');
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text font-heading">Edit Produk</h1>
        <p className="text-sm text-text-muted mt-0.5">Perbarui informasi produk</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-card border border-border rounded-xl p-4 md:p-6 space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text mb-1.5">Nama Produk</label>
          <input id="name" name="name" value={data.name} onChange={handleChange} required className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25 text-sm" placeholder="Contoh: Nasi Goreng" />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-text mb-1.5">Deskripsi</label>
          <textarea id="description" name="description" rows={3} value={data.description} onChange={handleChange} className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25 text-sm resize-y" placeholder="Deskripsi produk..." />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-text mb-1.5">Harga (Rp)</label>
            <input id="price" name="price" type="number" min="0" value={data.price} onChange={handleChange} required className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25 text-sm" placeholder="25000" />
          </div>
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-text mb-1.5">Stok</label>
            <input id="stock" name="stock" type="number" min="0" value={data.stock} onChange={handleChange} required className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25 text-sm" placeholder="100" />
          </div>
        </div>

        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-text mb-1.5">Kategori</label>
          <select id="category_id" name="category_id" value={data.category_id} onChange={handleChange} required className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25 text-sm">
            <option value="">Pilih kategori</option>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>

        {/* Variants / Flavor Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-text">Varian Rasa</label>
            <button type="button" onClick={addOption} className="text-sm text-primary hover:underline flex items-center gap-1">
              <Plus className="w-4 h-4" /> Tambah
            </button>
          </div>
          {options.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4 border-2 border-dashed border-border rounded-lg">
              Belum ada varian. Produk ini tidak memiliki pilihan rasa.
            </p>
          ) : (
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 bg-surface border border-border rounded-lg">
                  <input
                    type="text"
                    value={opt.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => updateOption(idx, 'name', e.target.value)}
                    placeholder="Nama rasa (contoh: Coklat, Vanilla)"
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25 text-sm"
                  />
                  <label className="flex items-center gap-1.5 text-sm text-text">
                    <input
                      type="checkbox"
                      checked={opt.is_available}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => updateOption(idx, 'is_available', e.target.checked)}
                      className="w-4 h-4 text-primary"
                    />
                    Tersedia
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-text">
                    <input
                      type="radio"
                      name="default_option"
                      checked={opt.is_default}
                      onChange={() => setOptions(options.map((o, i) => ({ ...o, is_default: i === idx })))}
                      className="w-4 h-4 text-primary"
                    />
                    Default
                  </label>
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    aria-label="Hapus varian"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Gambar Produk</label>
          {imagePreview ? (
            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <button type="button" onClick={() => { setImagePreview(null); setData({ ...data, image_url: '' }); }} className="absolute top-2 right-2 p-1.5 bg-error text-white rounded-lg hover:bg-error/90 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div onClick={() => fileInputRef.current?.click()} className="w-full h-48 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/40 transition-colors">
              <Upload className="w-7 h-7 text-text-muted/50" />
              <p className="text-xs text-text-muted">{uploading ? 'Mengupload...' : 'Klik untuk upload gambar'}</p>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </div>

        <button type="submit" disabled={loading || uploading} className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm">
          {loading || uploading ? (uploading ? 'Mengupload...' : 'Menyimpan...') : 'Simpan Perubahan'}
        </button>
      </form>
    </div>
  );
}