import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle, Clock, Package } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { updateOrderStatus } from '../../menu/actions';
import { formatCurrency } from '@/lib/utils';

const statusConfig = {
  pending: 'Menunggu pembayaran',
  diproses: 'Diproses',
  dikirim: 'Dikirim',
  selesai: 'Selesai',
} as const;

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const { data: orderData } = await supabase
    .from('orders')
    .select('id, status, payment_status, payment_method, total, address, notes, created_at, profiles(name), order_items(name_snapshot, qty, price_snapshot, subtotal)')
    .eq('id', params.id)
    .single();

  if (!orderData) notFound();

  const order = orderData as any;
  const isPaid = order.payment_status === 'paid';
  const isCod = order.payment_method === 'cod';
  const profiles = order.profiles as { name?: string } | { name?: string }[] | null;
  const customerName = Array.isArray(profiles) ? profiles[0]?.name : profiles?.name;

  async function updateStatus(formData: FormData) {
    'use server';
    const status = formData.get('status');
    if (typeof status === 'string') {
      await updateOrderStatus(order.id, status);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      <Link href="/admin/pesanan" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary">
        <ArrowLeft className="w-4 h-4" /> Kembali ke pesanan
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-text-muted font-mono">#{order.id}</p>
          <h1 className="text-xl font-bold text-text font-heading mt-1">Detail Pesanan</h1>
          <p className="text-sm text-text-muted">{new Date(order.created_at).toLocaleString('id-ID')}</p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
          {statusConfig[order.status as keyof typeof statusConfig] || order.status}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface-card p-4">
          <h2 className="mb-3 font-semibold text-text">Pelanggan</h2>
          <p className="text-sm text-text">{customerName || 'Pengguna'}</p>
          <p className="mt-2 text-sm text-text-muted">{order.address || 'Ambil sendiri'}</p>
          {order.notes && <p className="mt-2 text-sm text-text-muted">Catatan: {order.notes}</p>}
        </section>

        <section className="rounded-xl border border-border bg-surface-card p-4">
          <h2 className="mb-3 font-semibold text-text">Pembayaran</h2>
          <p className="text-sm text-text">Metode: <strong>{isCod ? 'COD' : 'Midtrans'}</strong></p>
          <p className="mt-2 flex items-center gap-2 text-sm text-text">
            {isPaid ? <CheckCircle className="h-4 w-4 text-success" /> : <Clock className="h-4 w-4 text-yellow-500" />}
            {isPaid ? 'Sudah dibayar' : isCod ? 'Bayar saat pesanan selesai' : 'Menunggu pembayaran Midtrans'}
          </p>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-surface-card p-4">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-text"><Package className="h-5 w-5 text-primary" /> Item Pesanan</h2>
        <div className="space-y-3">
          {order.order_items.map((item: any, index: number) => (
            <div key={index} className="flex justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0">
              <div><p className="text-sm font-medium text-text">{item.name_snapshot}</p><p className="text-xs text-text-muted">{item.qty} × {formatCurrency(item.price_snapshot)}</p></div>
              <span className="text-sm font-medium text-text">{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between border-t border-border pt-3 font-bold"><span>Total</span><span className="text-primary">{formatCurrency(order.total)}</span></div>
      </section>

      <section className="rounded-xl border border-border bg-surface-card p-4">
        <h2 className="mb-3 font-semibold text-text">Perbarui Status</h2>
        <form action={updateStatus} className="flex flex-wrap items-center gap-3">
          <select name="status" defaultValue={order.status} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm" aria-label="Status pesanan">
            <option value="pending">Menunggu</option>
            <option value="diproses">Diproses</option>
            <option value="selesai">Selesai</option>
          </select>
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">Simpan status</button>
          {isCod && !isPaid && <p className="w-full text-xs text-text-muted">COD otomatis ditandai lunas saat status menjadi Selesai.</p>}
        </form>
      </section>
    </div>
  );
}
