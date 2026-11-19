export const CHART_COLORS = {
  revenue: '#B45309',
  revenueGradient: ['#FEF3C7', '#FDE68A', '#FCD34D'],
  orders: '#059669',
  ordersGradient: ['#D1FAE5', '#A7F3D0', '#6EE7B7'],
  pending: '#D97706',
  preparing: '#2563EB',
  ready: '#16A34A',
  delivered: '#15803D',
  cancelled: '#DC2626',
  products: '#7C3AED',
  customers: '#0891B2',
  revenueFill: 'rgba(180, 83, 9, 0.15)',
  ordersFill: 'rgba(5, 150, 105, 0.15)',
  pendingFill: 'rgba(217, 119, 6, 0.15)',
  preparingFill: 'rgba(37, 99, 235, 0.15)',
  readyFill: 'rgba(22, 163, 74, 0.15)',
  deliveredFill: 'rgba(21, 128, 61, 0.15)',
  cancelledFill: 'rgba(220, 38, 38, 0.15)',
} as const;

export const CHART_PALETTE = [
  CHART_COLORS.revenue,
  CHART_COLORS.orders,
  CHART_COLORS.pending,
  CHART_COLORS.preparing,
  CHART_COLORS.ready,
  CHART_COLORS.delivered,
  CHART_COLORS.cancelled,
  CHART_COLORS.products,
  CHART_COLORS.customers,
];

export const STATUS_COLOR_MAP: Record<string, string> = {
  pending: CHART_COLORS.pending,
  preparing: CHART_COLORS.preparing,
  ready: CHART_COLORS.ready,
  delivered: CHART_COLORS.delivered,
  cancelled: CHART_COLORS.cancelled,

  
};

export const STATUS_FILL_MAP: Record<string, string> = {
  pending: CHART_COLORS.pendingFill,
  preparing: CHART_COLORS.preparingFill,
  ready: CHART_COLORS.readyFill,
  delivered: CHART_COLORS.deliveredFill,
  cancelled: CHART_COLORS.cancelledFill,
};