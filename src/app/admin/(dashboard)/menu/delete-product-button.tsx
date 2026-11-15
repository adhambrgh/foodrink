'use client';

import { Trash2 } from 'lucide-react';
import { deleteProduct } from './actions';

export function DeleteProductButton({ id }: { id: string }) {
  const handleDelete = async () => {
    if (!confirm('Hapus produk ini?')) return;
    const fd = new FormData();
    fd.set('id', id);
    await deleteProduct(fd);
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="p-1.5 text-text-muted hover:text-error rounded-lg hover:bg-error/10 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
