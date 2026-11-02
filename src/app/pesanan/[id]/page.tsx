import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { CheckCircle, Clock, XCircle, Package, MapPin } from 'lucide-react';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

const statusConfig = {
  pending: { label: 'Menunggu Pembayaran', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock },
  diproses: { label: 'Sedang Diproses', color: 'text-blue-600', bg: 'bg-blue-50', icon: Package },
  dikirim: { label: 'Dikirim', color: 'text-green-600', bg: 'bg-green-50', icon: Package },
  selesai: { label: 'Selesai', color: 'text-success', bg: 'bg-success/10', icon: CheckCircle },
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !order) {
    notFound();
  }

  const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon || Clock;

  return (
    <div className="min-h-screen bg-surface">
      <main className="p-4 space-y-4">
        {/* Status Card */}
        <div className={`${statusConfig[order.status as keyof typeof statusConfig]?.bg || 'bg-gray-50'} rounded-xl p-6`}>
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-8 h-8 ${statusConfig[order.status as keyof typeof statusConfig]?.color || 'text-gray-600'}`} />
            <div>
              <h1 className="text-xl font-bold text-text">
                {statusConfig[order.status as keyof typeof statusConfig]?.label || 'Menunggu Pembayaran'}
              </h1>
              <p className="text-sm text-text-muted mt-1">
                {order.payment_status === 'paid' ? 'Pembayaran berhasil' : 'Menunggu pembayaran'}
              </p>
            </div>
          </div>
        </div>

        {/* Order Info */}
        <div className="bg-white rounded-lg p-4 border border-border">
          <h2 className="font-semibold text-text mb-3">Detail Pesanan</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">ID Pesanan</span>
              <span className="font-mono text-text">{order.id.slice(0, 16)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Tanggal</span>
              <span className="text-text">{new Date(order.created_at).toLocaleString('id-ID')}</span>
            </div>
            {order.address && (
              <div className="flex justify-between">
                <span className="text-text-muted">Alamat</span>
                <span className="text-text text-right max-w-[200px]">{order.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg p-4 border border-border">
          <h2 className="font-semibold text-text mb-3">Items</h2>
          <div className="space-y-3">
            {order.order_items?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-text">{item.name_snapshot}</p>
                  <p className="text-xs text-text-muted">
                    {formatCurrency(item.price_snapshot)} x {item.qty}
                  </p>
                </div>
                <p className="font-medium text-text">{formatCurrency(item.subtotal)}</p>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-white rounded-lg p-4 border border-border">
          <h2 className="font-semibold text-text mb-3">Status Pembayaran</h2>
          <div className="flex items-center gap-2">
            {order.payment_status === 'paid' ? (
              <>
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="text-success font-medium">Lunas</span>
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-600 font-medium">Menunggu Pembayaran</span>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}