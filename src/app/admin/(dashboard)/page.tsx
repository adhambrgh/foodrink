import { createAdminClient } from '@/lib/supabase/server-admin';
import { DashboardClient } from './DashboardClient';
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

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <DashboardClient
      initialStats={{
        orders: stats.orders,
        revenue: stats.revenue,
        products: stats.products,
        users: stats.users,
      }}
    />
  );
}