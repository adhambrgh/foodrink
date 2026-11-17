'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="hidden print:inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
    >
      <Printer className="w-4 h-4" /> Cetak / Simpan PDF
    </button>
  );
}