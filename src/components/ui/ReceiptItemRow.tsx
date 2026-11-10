'use client';

import { formatCurrency } from '@/lib/utils';

interface ReceiptItemRowProps {
  name: string;
  qty: number;
  price: number;
  subtotal: number;
  className?: string;
}

export default function ReceiptItemRow({ name, qty, price, subtotal, className = '' }: ReceiptItemRowProps) {
  return (
    <div className={`flex gap-3 py-2 ${className}`}>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text truncate">{name}</p>
        <p className="text-xs text-text-muted mt-0.5">
          {qty} × {formatCurrency(price)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="font-medium text-text whitespace-nowrap">{formatCurrency(subtotal)}</span>
        <span className="text-xs text-text-muted whitespace-nowrap">Qty: {qty}</span>
      </div>
    </div>
  );
}