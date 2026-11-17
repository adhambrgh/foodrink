import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ArrowLeft, CheckCircle, Clock, Package, Printer } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { formatCurrency } from '@/lib/utils';
import DeleteOrderButton from '@/components/admin/delete-order-button';

const statusConfig = {
  diproses: 'Sedang Diproses',
  dikirim: 'Sedang Dikirim',
  selesai: 'Selesai',
} as const;

async function getCurrentQrisUrl(): Promise<string | null> {
  const supabase = createAdminClient();
  const BUCKET = 'qris-images';
  const BASE_NAME = 'qris-dana';

  const jpgUrl = supabase.storage.from(BUCKET).getPublicUrl(`${BASE_NAME}.jpg`).data.publicUrl;
  const jpegUrl = supabase.storage.from(BUCKET).getPublicUrl(`${BASE_NAME}.jpeg`).data.publicUrl;

  try {
    const { data: jpegExists } = await supabase.storage.from(BUCKET).list('', { search: 'qris-dana.jpeg' });
    if (jpegExists && jpegExists.length > 0) return jpegUrl;
  } catch {
    // Ignore storage list errors
  }
  try {
    const { data: jpgExists } = await supabase.storage.from(BUCKET).list('', { search: 'qris-dana.jpg' });
    if (jpgExists && jpgExists.length > 0) return jpgUrl;
  } catch {
    // Ignore storage list errors
  }
  return jpgUrl;
}

async function OrderContent({ id }: { id: string }) {
  const supabase = createAdminClient();
  const { data: orderData } = await supabase
    .from('orders')
    .select(`
      id, status, payment_status, payment_method, total, address, notes,
      created_at, qris_proof_url, qris_proof_uploaded_at, qris_verified_at,
      profiles(name, role),
      order_items(name_snapshot, qty, price_snapshot, subtotal)
    `)
    .eq('id', id)
    .single();

  if (!orderData) notFound();

  const order = orderData as any;
  const isPaid = order.payment_status === 'paid';
  const isCod = order.payment_method === 'cod';
  const isQris = order.payment_method === 'qris';

  const qrisImageUrl = isQris ? await getCurrentQrisUrl() : null;
  const profiles = order.profiles as { name?: string; role?: string } | { name?: string; role?: string }[] | null;
  const profile = Array.isArray(profiles) ? profiles[0] : profiles;
  const customerName = profile?.name;
  const isAdmin = profile?.role === 'admin';

  // Format dates server-side to avoid hydration mismatch
  const formattedCreatedAt = new Date(order.created_at).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const formattedProofUploadedAt = order.qris_proof_uploaded_at
    ? new Date(order.qris_proof_uploaded_at).toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;
  const formattedVerifiedAt = order.qris_verified_at
    ? new Date(order.qris_verified_at).toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="p-4 md:p-6 space-y-5 print:space-y-3 print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/pesanan" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary no-print">
          <ArrowLeft className="w-4 h-4" /> Kembali ke pesanan
        </Link>
        <div className="flex items-center gap-2 no-print">
          <button
            onClick={() => window.print()}
            className="hidden print:inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
          >
            <Printer className="w-4 h-4" /> Cetak / Simpan PDF
          </button>
          {isAdmin && (
            <DeleteOrderButton
              orderId={order.id}
              redirectTo="/admin/pesanan"
              variant="icon"
            />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-text-muted font-mono">#{order.id}</p>
          <h1 className="text-xl font-bold text-text font-heading mt-1">Detail Pesanan</h1>
          <p className="text-sm text-text-muted">Dibuat: {formattedCreatedAt}</p>
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
          <p className="text-sm text-text">Metode: <strong>{isCod ? 'COD' : isQris ? 'QRIS' : 'Lainnya'}</strong></p>
          <p className="mt-2 flex items-center gap-2 text-sm text-text">
            {isPaid ? <CheckCircle className="h-4 w-4 text-success" /> : <Clock className="h-4 w-4 text-yellow-500" />}
            {isPaid ? 'Sudah dibayar' : isCod ? 'Bayar saat pesanan selesai' : isQris ? 'Menunggu bukti pembayaran' : 'Menunggu pembayaran'}
          </p>
          {isQris && formattedProofUploadedAt && (
            <p className="mt-2 text-xs text-text-muted">
              Bukti diupload: {formattedProofUploadedAt}
            </p>
          )}
          {isQris && formattedVerifiedAt && (
            <p className="mt-1 text-xs text-text-muted">
              Diverifikasi: {formattedVerifiedAt}
            </p>
          )}
          {isQris && qrisImageUrl && (
            <div className="mt-3">
              <p className="text-xs text-text-muted mb-1">QRIS yang digunakan:</p>
              <img
                src={qrisImageUrl}
                alt="QRIS"
                className="w-24 h-24 object-contain rounded border border-border"
              />
            </div>
          )}
          {isQris && order.qris_proof_url && (
            <div className="mt-3">
              <p className="text-xs text-text-muted mb-1">Bukti pembayaran user:</p>
              <img
                src={order.qris_proof_url}
                alt="Bukti pembayaran"
                className="w-32 h-32 object-contain rounded border border-border"
              />
            </div>
          )}
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
    </div>
  );
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={
      <div className="p-4 md:p-6 space-y-5">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    }>
      <OrderContent id={id} />
    </Suspense>
  );
}