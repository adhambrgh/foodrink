'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { useRealtimeInvalidation } from '@/hooks/useDashboardData';
import { DashboardHeader } from './components/DashboardHeader';
import { StatCard } from './components/StatCard';
import { RevenueChart } from './components/RevenueChart';
import { OrdersChart } from './components/OrdersChart';
import { OrderStatusDonut } from './components/OrderStatusDonut';
import { TopProductsTable } from './components/TopProductsTable';
import { RecentOrders } from './components/RecentOrders';
import { QuickActions } from './components/QuickActions';
import { TrendingUp, ShoppingCart, Package, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DashboardStats {
  orders: number;
  revenue: number;
  products: number;
  users: number;
}

function DashboardContent({ initialStats }: { initialStats?: DashboardStats }) {
  const stats = initialStats || { orders: 0, revenue: 0, products: 0, users: 0 };

  useRealtimeInvalidation();

  return (
    <div className="w-full">
      <DashboardHeader initialRange="7d" stats={stats} />

      <StatCardsGrid stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mt-8">
        <section className="space-y-6">
          <RevenueChart />
          <OrdersChart />
        </section>
        <aside className="space-y-6">
          <OrderStatusDonut />
          <TopProductsTable />
        </aside>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mt-6">
        <section>
          <RecentOrders />
        </section>
        <section className="flex items-start">
          <QuickActions />
        </section>
      </div>
    </div>
  );
}

function StatCardsGrid({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 lg:gap-4">
      <div className="col-span-2 lg:col-span-6">
        <StatCard
          variant="large"
          label="Total Pendapatan"
          value={formatCurrency(stats.revenue)}
          icon={<TrendingUp className="w-full h-full text-primary" />}
          accentColor="#B45309"
          delay={0}
          trendLabel="Pendapatan kotor semua waktu"
          trend={[45, 52, 48, 65, 58, 72, 68]}
        />
      </div>
      <div className="col-span-1 lg:col-span-4">
        <StatCard
          variant="medium"
          label="Total Pesanan"
          value={stats.orders.toLocaleString('id-ID')}
          icon={<ShoppingCart className="w-full h-full text-emerald-600" />}
          accentColor="#059669"
          delay={1}
          trendLabel="Semua status"
        />
      </div>
      <div className="col-span-1 lg:col-span-2">
        <StatCard
          variant="small"
          label="Produk Aktif"
          value={stats.products.toLocaleString('id-ID')}
          icon={<Package className="w-full h-full text-violet-600" />}
          accentColor="#7C3AED"
          delay={2}
        />
      </div>
    </div>
  );
}

export function DashboardClient({ initialStats }: { initialStats?: DashboardStats }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30000,
            gcTime: 60000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent initialStats={initialStats} />
    </QueryClientProvider>
  );
}