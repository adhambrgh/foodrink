'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

interface DeleteOrderButtonProps {
  orderId: string;
  redirectTo?: string;
  variant?: 'icon' | 'button';
}

async function deleteOrderAction(orderId: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: data.error || 'Gagal menghapus pesanan' };
  }
  return { success: true };
}

export default function DeleteOrderButton({ orderId, redirectTo, variant = 'icon' }: DeleteOrderButtonProps) {
  const [busy, setBusy] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (busy) return;
    if (!confirm('Hapus pesanan ini? Tindakan tidak dapat dibatalkan.')) return;

    setBusy(true);

    startTransition(async () => {
      const result = await deleteOrderAction(orderId);
      if (!result.success) {
        alert(result.error || 'Gagal menghapus pesanan');
        setBusy(false);
        return;
      }
      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
      setBusy(false);
    });
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        className="flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" /> {busy ? 'Menghapus...' : 'Hapus'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={busy}
      className="inline-flex rounded-lg p-1.5 text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors disabled:opacity-50"
      title="Hapus pesanan"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
