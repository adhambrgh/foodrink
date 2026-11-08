'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateOrderStatus } from '../menu/actions';

interface OrderStatusButtonProps {
  orderId: string;
  currentStatus: string;
}

export default function OrderStatusButton({ orderId, currentStatus }: OrderStatusButtonProps) {
  const [status, setStatus] = useState(currentStatus === 'selesai' ? 'selesai' : 'diproses');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    if (next === status) return;

    setBusy(true);
    setError(null);

    const result = await updateOrderStatus(orderId, next);
    if (result?.error) {
      setError(result.error);
    } else {
      setStatus(result.status || next);
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div className="relative inline-flex items-center">
      <select
        name="status"
        value={status}
        onChange={handleChange}
        disabled={busy}
        aria-label="Update status pesanan"
        className="rounded-lg border border-border bg-surface px-2 py-1 text-xs"
      >
        <option value="diproses">Diproses</option>
        <option value="selesai">Selesai</option>
      </select>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
