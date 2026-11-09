'use client';

import { useEffect } from 'react';
import OrderList, { type Order } from './order-list';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/providers/supabase-provider';

interface AdminPesananContentProps {
  orders: Order[];
  error?: string | null;
}

export function AdminPesananContent({ orders, error }: AdminPesananContentProps) {
  const router = useRouter();
  const { session } = useSupabase();

  useEffect(() => {
    // Auto-refresh: fetch data setiap 30 detik
    const interval = setInterval(() => {
      router.refresh();
    }, 30000);

    // Auto-refresh saat ada perubahan dari tab/agam lain (storage event)
    function onStorage() {
      router.refresh();
    }
    window.addEventListener('storage', onStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', onStorage);
    };
  }, [router]);

  if (!session) {
    return <div className="w-full space-y-5 p-4 md:p-6">Memuat...</div>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-error/20 bg-error/5 p-4 text-sm text-error">
        Gagal memuat pesanan: {error}
      </div>
    );
  }

  return <OrderList orders={orders} />;
}