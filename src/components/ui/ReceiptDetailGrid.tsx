'use client';

interface ReceiptDetailGridProps {
  tanggal: string;
  alamat: string;
  catatan?: string | null;
  metodeBayar: string;
  className?: string;
}

const METODE_LABELS: Record<string, { label: string; color: string }> = {
  cod: { label: 'Bayar di Tempat (COD)', color: 'bg-amber-100 text-amber-800' },
  midtrans: { label: 'Midtrans', color: 'bg-blue-100 text-blue-800' },
};

export default function ReceiptDetailGrid({
  tanggal,
  alamat,
  catatan,
  metodeBayar,
  className = '',
}: ReceiptDetailGridProps) {
  const metode = METODE_LABELS[metodeBayar] || { label: metodeBayar, color: 'bg-gray-100 text-gray-800' };

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      <div className="space-y-1">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Tanggal</p>
        <p className="text-sm text-text">{tanggal}</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Alamat</p>
        <p className="text-sm text-text text-right max-w-full truncate">{alamat}</p>
      </div>

      {catatan && (
        <>
          <div className="col-span-2 space-y-1 pt-1 border-t border-neutral-100">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Catatan</p>
            <p className="text-sm text-text">{catatan}</p>
          </div>
        </>
      )}

      <div className="space-y-1">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Metode Bayar</p>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${metode.color}`}>
          {metode.label}
        </span>
      </div>
    </div>
  );
}