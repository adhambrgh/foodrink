'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateOrderStatus } from '../../menu/actions';

interface StatusSelectProps {
  orderId: string;
  currentStatus: string;
}

const STATUS_OPTIONS = [
  { value: 'menunggu_pembayaran', label: 'Menunggu Pembayaran' },
  { value: 'diproses', label: 'Diproses' },
  { value: 'dikirim', label: 'Dikirim' },
  { value: 'selesai', label: 'Selesai' },
] as const;

export default function StatusSelect({ orderId, currentStatus }: StatusSelectProps) {
  const [status, setStatus] = useState(currentStatus);
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
    } else if (result.success !== false) {
      setStatus(next);
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        name="status"
        value={status}
        onChange={handleChange}
        disabled={busy}
        aria-label="Ubah status pesanan"
        className="cursor-pointer rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-60"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}