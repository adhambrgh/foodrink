'use client';

import { Suspense } from 'react';
import ProdukContent from './produk-content';
import LoadingSpinner from '@/components/ui/loading-spinner';

export default function ProdukPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-surface"><LoadingSpinner /></div>}>
      <ProdukContent />
    </Suspense>
  );
}
