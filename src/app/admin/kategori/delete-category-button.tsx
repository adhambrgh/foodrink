'use client';

import { Trash2 } from 'lucide-react';

export function DeleteCategoryButton() {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!confirm('Hapus kategori ini?')) event.preventDefault();
      }}
      className="p-1.5 text-text-muted hover:text-error rounded-lg hover:bg-error/10 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
