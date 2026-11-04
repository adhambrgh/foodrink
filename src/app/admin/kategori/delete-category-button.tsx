'use client';

import { useState } from 'react';
import { Trash2, ArrowRight } from 'lucide-react';
import { deleteCategory } from '../menu/actions';
import { moveProductsToCategory } from './actions';

type DeleteCategoryButtonProps = {
  categoryId: string;
  categoryName: string;
  productCount: number;
  allCategories: { id: string; name: string }[];
};

export function DeleteCategoryButton({ categoryId, categoryName, productCount, allCategories }: DeleteCategoryButtonProps) {
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otherCategories = allCategories.filter((c) => c.id !== categoryId);

  const handleDelete = async (event: React.FormEvent) => {
    event.preventDefault();

    if (productCount > 0) {
      setShowMoveDialog(true);
      return;
    }

    if (!confirm(`Hapus kategori "${categoryName}"?`)) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('id', categoryId);

    try {
      await deleteCategory(formData);
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleMoveAndDelete = async () => {
    if (!targetCategoryId) {
      setError('Pilih kategori tujuan');
      return;
    }

    if (!confirm(`Pindahkan ${productCount} produk ke kategori lain, lalu hapus "${categoryName}"?`)) return;

    setLoading(true);
    setError(null);

    const moveRes = await moveProductsToCategory(categoryId, targetCategoryId);
    if (moveRes.error) {
      setError(moveRes.error);
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('id', categoryId);

    try {
      await deleteCategory(formData);
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="p-1.5 text-text-muted hover:text-error rounded-lg hover:bg-error/10 transition-colors disabled:opacity-50"
        title={productCount > 0 ? `${productCount} produk terhubung` : 'Hapus kategori'}
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {showMoveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-text">Pindahkan Produk</h3>
              <p className="text-sm text-text-muted mt-1">
                Kategori <span className="font-medium">{categoryName}</span> memiliki <span className="font-medium">{productCount} produk</span>.
                Pindahkan ke kategori lain sebelum menghapus.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Pindahkan ke:</label>
              <select
                value={targetCategoryId}
                onChange={(e) => setTargetCategoryId(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
              >
                <option value="">-- Pilih Kategori --</option>
                {otherCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex items-center gap-2">
              <button
                onClick={handleMoveAndDelete}
                disabled={loading || !targetCategoryId}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Memproses...' : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    Pindahkan & Hapus
                  </>
                )}
              </button>
              <button
                onClick={() => setShowMoveDialog(false)}
                disabled={loading}
                className="px-4 py-2.5 rounded-lg border border-border text-sm text-text hover:bg-surface-variant transition-colors disabled:opacity-50"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
