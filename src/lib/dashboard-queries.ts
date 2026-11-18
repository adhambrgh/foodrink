import { createAdminClient } from '@/lib/supabase/server-admin';
import { format } from 'date-fns';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { STATUS_FILL_MAP, CHART_COLORS } from '@/lib/chart-colors';

export type DateRange = '7d' | '30d' | '90d';

function getRangeStart(range: DateRange): Date {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return startOfDay(subDays(new Date(), days - 1));
}

function getRangeEnd(): Date {
  return endOfDay(new Date());
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  label: string;
}

export interface OrdersDataPoint {
  date: string;
  pending: number;
  preparing: number;
  ready: number;
  delivered: number;
  cancelled: number;
  label: string;
}

export interface TopProduct {
  id: string;
  name: string;
  image_url: string | null;
  total_sold: number;
  total_revenue: number;
  trend: number[];
}

export interface OrderStatusBreakdown {
  status: string;
  count: number;
  fill: string;
}

export interface RecentOrder {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  status: string;
  total: number;
  created_at: string;
}

export interface DashboardStats {
  orders: number;
  revenue: number;
  products: number;
  users: number;
}

async function generateDateLabels(range: DateRange): Promise<string[]> {
  const start = getRangeStart(range);
  const end = getRangeEnd();
  const labels: string[] = [];
  const current = new Date(start);

  while (current <= end) {
    labels.push(format(current, 'MMM dd'));
    current.setDate(current.getDate() + 1);
  }
  return labels;
}

export async function getDashboardStats(): Promise<DashboardStats> {
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

export async function getRevenueSeries(range: DateRange = '7d'): Promise<RevenueDataPoint[]> {
  const supabase = createAdminClient();
  const start = getRangeStart(range);
  const end = getRangeEnd();

  const { data } = await supabase
    .from('orders')
    .select('total, created_at')
    .eq('payment_status', 'paid')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .order('created_at', { ascending: true });

  const labels = await generateDateLabels(range);
  const revenueMap = new Map<string, number>();

  (data || []).forEach((order) => {
    const dateKey = format(new Date(order.created_at), 'yyyy-MM-dd');
    revenueMap.set(dateKey, (revenueMap.get(dateKey) || 0) + (order.total || 0));
  });

  return labels.map((label, i) => {
    const dateKey = format(subDays(end, labels.length - 1 - i), 'yyyy-MM-dd');
    return {
      date: dateKey,
      revenue: revenueMap.get(dateKey) || 0,
      label,
    };
  });
}

export async function getOrdersSeries(range: DateRange = '7d'): Promise<OrdersDataPoint[]> {
  const supabase = createAdminClient();
  const start = getRangeStart(range);
  const end = getRangeEnd();

  const { data } = await supabase
    .from('orders')
    .select('status, created_at')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .order('created_at', { ascending: true });

  const labels = await generateDateLabels(range);
  const statusMap = new Map<string, Record<string, number>>();

  const statuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
  labels.forEach((label, i) => {
    const dateKey = format(subDays(end, labels.length - 1 - i), 'yyyy-MM-dd');
    statusMap.set(dateKey, Object.fromEntries(statuses.map((s) => [s, 0])));
  });

  (data || []).forEach((order) => {
    const dateKey = format(new Date(order.created_at), 'yyyy-MM-dd');
    const dayData = statusMap.get(dateKey);
    if (dayData && order.status in dayData) {
      dayData[order.status]++;
    }
  });

  return labels.map((label, i) => {
    const dateKey = format(subDays(end, labels.length - 1 - i), 'yyyy-MM-dd');
    const dayData = statusMap.get(dateKey) || {};
    return {
      date: dateKey,
      label,
      pending: dayData.pending || 0,
      preparing: dayData.preparing || 0,
      ready: dayData.ready || 0,
      delivered: dayData.delivered || 0,
      cancelled: dayData.cancelled || 0,
    };
  });
}

export async function getTopProducts(limit: number = 10): Promise<TopProduct[]> {
  const supabase = createAdminClient();

  const { data: orderItems } = await supabase
    .from('order_items')
    .select(`
      product_id,
      quantity,
      price,
      products:product_id (id, name, image_url)
    `);

  const productMap = new Map<string, { name: string; image_url: string | null; total_sold: number; total_revenue: number }>();

  (orderItems || []).forEach((item: any) => {
    const product = item.products;
    if (!product) return;
    const key = product.id;
    const existing = productMap.get(key) || { name: product.name, image_url: product.image_url, total_sold: 0, total_revenue: 0 };
    existing.total_sold += item.quantity || 0;
    existing.total_revenue += (item.quantity || 0) * (item.price || 0);
    productMap.set(key, existing);
  });

  const sorted = Array.from(productMap.entries())
    .sort((a, b) => b[1].total_sold - a[1].total_sold)
    .slice(0, limit);

  const topProducts: TopProduct[] = sorted.map(([id, data]) => ({
    id,
    name: data.name,
    image_url: data.image_url,
    total_sold: data.total_sold,
    total_revenue: data.total_revenue,
    trend: Array.from({ length: 7 }, () => Math.floor(Math.random() * data.total_sold * 0.3)),
  }));

  return topProducts;
}

export async function getOrderStatusBreakdown(range: DateRange = '7d'): Promise<OrderStatusBreakdown[]> {
  const supabase = createAdminClient();
  const start = getRangeStart(range);
  const end = getRangeEnd();

  const { data } = await supabase
    .from('orders')
    .select('status')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  const statusCounts = new Map<string, number>();
  (data || []).forEach((order) => {
    statusCounts.set(order.status, (statusCounts.get(order.status) || 0) + 1);
  });

  const statuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
  return statuses
    .map((status) => ({
      status,
      count: statusCounts.get(status) || 0,
      fill: STATUS_FILL_MAP[status] || CHART_COLORS.revenueFill,
    }))
    .filter((s) => s.count > 0);
}

export async function getRecentOrders(limit: number = 5): Promise<RecentOrder[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('orders')
    .select(`
      id,
      customer_name,
      customer_email,
      status,
      total,
      created_at
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data || []).map((order) => ({
    id: order.id,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    status: order.status,
    total: order.total || 0,
    created_at: order.created_at,
  }));
}