import { createAdminClient } from '@/lib/supabase/server-admin';
import { TrendingUp, ShoppingCart, Package, Users } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

async function getDashboardStats() {
  const supabase = createAdminClient();
  const [orders, revenue, products, users] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('total').eq('payment_status', 'paid'),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
  ]);

  const totalRevenue = (revenue.data || []).reduce((sum: number, o: any) => sum + (o.total || 0), 0);

  return {
    orders: orders.count || 0,
    revenue: totalRevenue,
    products: products.count || 0,
    users: users.count || 0,
  };
}

const statCards = [
  { label: 'Total Pesanan', value: (s: any) => s.orders.toLocaleString('id-ID'), icon: ShoppingCart, accent: 'text-primary' },
  { label: 'Pendapatan', value: (s: any) => formatCurrency(s.revenue), icon: TrendingUp, accent: 'text-success' },
  { label: 'Produk Aktif', value: (s: any) => s.products.toLocaleString('id-ID'), icon: Package, accent: 'text-amber-600' },
  { label: 'Pelanggan', value: (s: any) => s.users.toLocaleString('id-ID'), icon: Users, accent: 'text-blue-600' },
] as const;

const quickActions = [
  { href: '/admin/menu/new', label: 'Tambah Produk', icon: Package, accent: 'text-primary' },
  { href: '/admin/menu', label: 'Kelola Menu', icon: ShoppingCart, accent: 'text-success' },
  { href: '/admin/pesanan', label: 'Lihat Pesanan', icon: TrendingUp, accent: 'text-amber-600' },
];

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="w-full p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text font-heading">Dashboard</h1>
        <p className="text-sm text-text-muted mt-0.5">Ringkasan performa toko</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="bg-surface-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-surface-variant/60">
                <Icon className={`w-4 h-4 ${accent}`} />
              </div>
              <span className="text-xs text-text-muted">{label}</span>
            </div>
            <p className="text-xl font-bold text-text font-heading">{value(stats)}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-text mb-3">Aksi Cepat</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map(({ href, label, icon: Icon, accent }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 p-4 bg-surface-card border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <Icon className={`w-6 h-6 ${accent}`} />
              <span className="text-xs font-medium text-text text-center">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
