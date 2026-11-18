'use client';

import { useQuery, useQueryClient, QueryKey } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { DateRange } from '@/lib/dashboard-queries';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export function useRevenueSeries(range: DateRange = '7d') {
  return useQuery({
    queryKey: ['revenueSeries', range],
    queryFn: () => fetchJson<import('@/lib/dashboard-queries').RevenueDataPoint[]>(`/api/admin/stats?type=revenue&range=${range}`),
    staleTime: 30000,
    gcTime: 60000,
  });
}

export function useOrdersSeries(range: DateRange = '7d') {
  return useQuery({
    queryKey: ['ordersSeries', range],
    queryFn: () => fetchJson<import('@/lib/dashboard-queries').OrdersDataPoint[]>(`/api/admin/stats?type=orders&range=${range}`),
    staleTime: 30000,
    gcTime: 60000,
  });
}

export function useTopProducts(limit: number = 10) {
  return useQuery({
    queryKey: ['topProducts', limit],
    queryFn: () => fetchJson<import('@/lib/dashboard-queries').TopProduct[]>(`/api/admin/stats?type=topProducts&limit=${limit}`),
    staleTime: 60000,
    gcTime: 120000,
  });
}

export function useOrderStatusBreakdown(range: DateRange = '7d') {
  return useQuery({
    queryKey: ['statusBreakdown', range],
    queryFn: () => fetchJson<import('@/lib/dashboard-queries').OrderStatusBreakdown[]>(`/api/admin/stats?type=statusBreakdown&range=${range}`),
    staleTime: 30000,
    gcTime: 60000,
  });
}

export function useRecentOrders(limit: number = 5) {
  return useQuery({
    queryKey: ['recentOrders', limit],
    queryFn: () => fetchJson<import('@/lib/dashboard-queries').RecentOrder[]>(`/api/admin/stats?type=recentOrders&limit=${limit}`),
    staleTime: 30000,
    gcTime: 60000,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => fetchJson<import('@/lib/dashboard-queries').DashboardStats>(`/api/admin/stats?type=stats`),
    staleTime: 30000,
    gcTime: 60000,
  });
}

export function useRealtimeInvalidation() {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['revenueSeries'] });
          queryClient.invalidateQueries({ queryKey: ['ordersSeries'] });
          queryClient.invalidateQueries({ queryKey: ['statusBreakdown'] });
          queryClient.invalidateQueries({ queryKey: ['recentOrders'] });
          queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['topProducts'] });
          queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function invalidateDashboardQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['revenueSeries'] });
  queryClient.invalidateQueries({ queryKey: ['ordersSeries'] });
  queryClient.invalidateQueries({ queryKey: ['topProducts'] });
  queryClient.invalidateQueries({ queryKey: ['statusBreakdown'] });
  queryClient.invalidateQueries({ queryKey: ['recentOrders'] });
  queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
}