import { Package, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { getOrders } from '../menu/actions';
import { formatCurrency } from '@/lib/utils';

const statusConfig = {
  pending: { label: 'Menunggu Pembayaran', color: 'bg-yellow-100 text-yellow-700' },
  diproses: { label: 'Sedang Diproses', color: 'bg-blue-100 text-blue-700' },
  dikirim: { label: 'Dikirim', color: 'bg-green-100 text-green-700' },
  selesai: { label: 'Selesai', color: 'bg-success/10 text-success' },
};

export default async function AdminPesananPage() {
  const { orders = [], error } = await getOrders();

  return (
    <div className="w-full p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text font-heading">Pesanan Masuk</h1>
        <p className="text-sm text-text-muted mt-0.5">Kelola semua pesanan yang masuk</p>
      </div>

      {error ? (
        <div className="p-4 rounded-xl border border-error/20 bg-error/5 text-sm text-error">Gagal memuat pesanan: {error}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-surface-card border border-border rounded-xl">
          <Package className="w-12 h-12 text-text-muted/30 mx-auto mb-3" />
          <p className="text-text-muted text-sm">Belum ada pesanan</p>
        </div>
      ) : (
        <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted border-b border-border bg-surface-variant/40">
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Pelanggan</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium text-center">Status</th>
                  <th className="px-4 py-3 font-medium text-center">Bayar</th>
                  <th className="px-4 py-3 font-medium text-center">Waktu</th>
                  <th className="px-4 py-3 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => (
                  <tr key={order.id} className="border-b border-border/50 last:border-0 hover:bg-surface-variant/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-text-muted">#{order.id.slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-text">{order.profiles?.name || '-'}</div>
                      <div className="text-xs text-text-muted">{order.profiles?.email || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-text whitespace-nowrap">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-center">
                      {order.payment_status === 'paid' ? <CheckCircle className="w-5 h-5 text-success mx-auto" /> : <Clock className="w-5 h-5 text-yellow-500 mx-auto" />}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-text-muted whitespace-nowrap">{new Date(order.created_at).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-center">
                      <Link href={`/admin/pesanan/${order.id}`} className="inline-flex p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                        <Package className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {orders.length > 0 && <p className="text-xs text-text-muted">{orders.length} pesanan</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${config.color}`}>{config.label}</span>;
}
