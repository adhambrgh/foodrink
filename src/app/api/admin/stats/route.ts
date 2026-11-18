import { NextRequest, NextResponse } from 'next/server';
import { getRevenueSeries, getOrdersSeries, getTopProducts, getOrderStatusBreakdown, getRecentOrders, getDashboardStats } from '@/lib/dashboard-queries';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  const range = (searchParams.get('range') as '7d' | '30d' | '90d') || '7d';
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  try {
    switch (type) {
      case 'revenue': {
        const data = await getRevenueSeries(range);
        return NextResponse.json(data);
      }
      case 'orders': {
        const data = await getOrdersSeries(range);
        return NextResponse.json(data);
      }
      case 'topProducts': {
        const data = await getTopProducts(limit);
        return NextResponse.json(data);
      }
      case 'statusBreakdown': {
        const data = await getOrderStatusBreakdown(range);
        return NextResponse.json(data);
      }
      case 'recentOrders': {
        const data = await getRecentOrders(limit);
        return NextResponse.json(data);
      }
      case 'stats': {
        const data = await getDashboardStats();
        return NextResponse.json(data);
      }
      default: {
        const [revenue, orders, topProducts, statusBreakdown, recentOrders, stats] = await Promise.all([
          getRevenueSeries(range),
          getOrdersSeries(range),
          getTopProducts(limit),
          getOrderStatusBreakdown(range),
          getRecentOrders(limit),
          getDashboardStats(),
        ]);
        return NextResponse.json({ revenue, orders, topProducts, statusBreakdown, recentOrders, stats });
      }
    }
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}