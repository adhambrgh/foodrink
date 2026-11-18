# Foodrink Admin Dashboard Redesign — Implementation Plan

## User Decisions
| Decision | Choice |
|----------|--------|
| Real-time | ✅ Supabase Realtime |
| Export | PDF only (no CSV) |
| Default date range | 7 days |
| Chart library | Recharts (my recommendation) |
| Mobile layout | Single column stack |

---

## Phase 1: Foundation (Setup & Data Layer)

### 1.1 Install Dependencies
```bash
npm install recharts date-fns @tanstack/react-query papaparse jspdf jspdf-autotable
npm install -D @types/papaparse @types/jspdf
```

### 1.2 Create Custom Color Tokens
**File:** `src/lib/chart-colors.ts`
```typescript
export const CHART_COLORS = {
  // Warm-organic base + accent
  revenue: '#B45309',      // Primary warm
  revenueGradient: ['#FEF3C7', '#FDE68A', '#FCD34D'],
  orders: '#059669',       // Emerald accent
  ordersGradient: ['#D1FAE5', '#A7F3D0', '#6EE7B7'],
  pending: '#D97706',      // Amber
  completed: '#16A34A',    // Green
  cancelled: '#DC2626',    // Red
  products: '#7C3AED',     // Violet
  customers: '#0891B2',    // Cyan
  // Opacity variants for fills
  revenueFill: 'rgba(180, 83, 9, 0.15)',
  ordersFill: 'rgba(5, 150, 105, 0.15)',
} as const;

export const CHART_PALETTE = [
  CHART_COLORS.revenue,
  CHART_COLORS.orders,
  CHART_COLORS.pending,
  CHART_COLORS.completed,
  CHART_COLORS.cancelled,
  CHART_COLORS.products,
  CHART_COLORS.customers,
];
```

### 1.3 Server-Side Queries
**File:** `src/lib/dashboard-queries.ts`
```typescript
// All queries return typed data, accept date range (7d default)
// Uses createAdminClient() from '@/lib/supabase/server-admin'

export async function getRevenueSeries(range: '7d' | '30d' | '90d' = '7d')
export async function getOrdersSeries(range: '7d' | '30d' | '90d' = '7d')
export async function getTopProducts(limit: number = 10)
export async function getOrderStatusBreakdown(range: '7d' | '30d' | '90d' = '7d')
export async function getRecentOrders(limit: number = 10)
export async function getDashboardStats() // existing, enhanced
```

**Query Details:**
- `revenueSeries`: `orders.created_at` grouped by day, sum `total` where `payment_status='paid'`
- `ordersSeries`: grouped by day, count by `status` (pending/preparing/ready/delivered/cancelled)
- `topProducts`: join `order_items` → `products`, sum `quantity`, order desc, limit
- `statusBreakdown`: count by `status` in range
- `recentOrders`: latest 10 with customer name, status, total, created_at

### 1.4 API Routes (for client-side SWR + Realtime)
**File:** `src/app/api/admin/stats/route.ts`
```typescript
// GET ?range=7d → { revenueSeries, ordersSeries, topProducts, statusBreakdown, recentOrders }
// Server-side calls dashboard-queries, returns JSON
```

### 1.5 React Query Setup
**File:** `src/hooks/useDashboardData.ts`
```typescript
// useRevenueSeries(range), useOrdersSeries(range), useTopProducts(), etc.
// SWR config: revalidateOnFocus: false, refreshInterval: 30000 (fallback)
// Realtime subscription: supabase.channel('admin-dashboard')
//   .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => queryClient.invalidateQueries())
//   .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => queryClient.invalidateQueries())
//   .subscribe()
```

---

## Phase 2: Chart Components (Human Design Principles)

### 2.1 Shared Chart Wrapper
**File:** `src/app/admin/(dashboard)/components/ChartWrapper.tsx`
```tsx
// Props: title, subtitle, children (chart), action?, loading?, error?
// Features:
// - Skeleton loading per chart type (not full-page spinner)
// - Error state: custom illustration + human copy ("Something went wrong. We're on it.")
// - ResponsiveContainer from Recharts
// - respects prefers-reduced-motion (disable animation)
```

### 2.2 RevenueChart (Area Chart)
**File:** `src/app/admin/(dashboard)/components/RevenueChart.tsx`
```tsx
// Area chart with gradient fill (CHART_COLORS.revenueFill)
// X-axis: date (MMM dd), Y-axis: formatted Rupiah (compact: 1.2jt)
// Asymmetric Y-axis: min = dataMin * 0.8 (not zero)
// Tooltip: custom - shows date, revenue formatted, % change vs prev day
// Animation: staggered per point (delay = index * 50ms), spring config
// Tab switch: 7d / 30d / 90d (calls useRevenueSeries)
```

### 2.3 OrdersChart (Grouped Bar Chart)
**File:** `src/app/admin/(dashboard)/components/OrdersChart.tsx`
```tsx
// Grouped bars per day: pending, preparing, ready, delivered, cancelled
// Varied bar width: 60% of available (not 100%)
// Colors from CHART_PALETTE (status mapped)
// Clickable legend: toggle series visibility
// Tab switch: 7d / 30d / 90d
// Tooltip: grouped - shows all statuses for that day
```

### 2.4 OrderStatusDonut (Donut Chart)
**File:** `src/app/admin/(dashboard)/components/OrderStatusDonut.tsx`
```tsx
// Donut: innerRadius 60%, outerRadius 85%
// Center label: total orders in period
// Legend: vertical sidebar (right), interactive hover → highlight segment
// Segments: status colors from CHART_PALETTE
// Animation: stagger draw (stroke-dashoffset), 0.8s total
```

### 2.5 TopProductsTable (Table + Sparkline)
**File:** `src/app/admin/(dashboard)/components/TopProductsTable.tsx`
```tsx
// Columns: Rank, Product (name + image thumbnail), Sold, Revenue, Trend (sparkline)
// Sparkline: mini area chart 7-day revenue per product (recharts LineChart compact)
// Sortable: click header (client-side sort)
// Row hover: highlight + sparkline expands slightly
// Empty state: illustration + "Belum ada produk terjual periode ini"
```

### 2.6 RecentOrders (Latest Orders List)
**File:** `src/app/admin/(dashboard)/components/RecentOrders.tsx`
```tsx
// 5 latest orders: Order ID (short), Customer, Status badge, Total, Time ago
// Status badge: variant per status (pending=amber, preparing=blue, ready=emerald, delivered=green, cancelled=red)
// Click row → navigate to /admin/pesanan/[id]
// Empty state: illustration + "Belum ada pesanan baru"
```

---

## Phase 3: Layout Components (Asymmetric, Character)

### 3.1 StatCard Variants
**File:** `src/app/admin/(dashboard)/components/StatCard.tsx`
```tsx
// Three variants:
// - Large (Revenue): p-8, rounded-2xl, icon XL (w-8 h-8), value text-3xl, trend sparkline mini
// - Medium (Orders): p-6, rounded-xl, icon LG (w-6 h-6), value text-2xl, % change
// - Small (Products, Customers): p-4, rounded-lg, icon MD (w-5 h-5), value text-xl
// Grid: lg:grid-cols-12 → Large: col-span-6, Medium: col-span-4, Small: col-span-2 each
// Staggered entrance: delay = index * 100ms, slide-up + fade
```

### 3.2 DashboardHeader
**File:** `src/app/admin/(dashboard)/components/DashboardHeader.tsx`
```tsx
// Left: Title "Dashboard", subtitle "Ringkasan performa 7 hari terakhir"
// Right: DateRangePicker (popover), ExportPDF button
// DateRangePicker: presets (Hari ini, 7 hari, 30 hari, 90 hari, Custom)
// ExportPDF: generates PDF with all charts + tables (jspdf + jspdf-autotable + html2canvas for charts)
```

### 3.3 QuickActions (Varied Sizes)
**File:** `src/app/admin/(dashboard)/components/QuickActions.tsx`
```tsx
// Not uniform grid.
// Primary (Tambah Produk): wider, p-6, icon w-8, prominent
// Secondary (Kelola Menu, Lihat Pesanan): normal, p-4
// Hover: varied - primary lifts + shadow, secondary border glow
// Mobile: stack vertical, full width
```

---

## Phase 4: Main Page Composition

### 4.1 Updated Page
**File:** `src/app/admin/(dashboard)/page.tsx`
```tsx
// Server Component
// Fetches initial stats via getDashboardStats()
// Passes initial data to client components via props
// Composes:
// <DashboardHeader initialRange="7d" />
// <StatCardsGrid stats={stats} />
// <main className="grid lg:grid-cols-[2fr_1fr] gap-6">
//   <section>
//     <ChartWrapper><RevenueChart /></ChartWrapper>
//     <ChartWrapper><OrdersChart /></ChartWrapper>
//   </section>
//   <aside className="space-y-6">
//     <ChartWrapper><OrderStatusDonut /></ChartWrapper>
//     <ChartWrapper><TopProductsTable /></ChartWrapper>
//   </aside>
// </main>
// <section className="grid lg:grid-cols-[2fr_1fr] gap-6">
//   <ChartWrapper><RecentOrders /></ChartWrapper>
//   <QuickActions />
// </section>
```

### 4.2 Client Provider Wrapper
**File:** `src/app/admin/(dashboard)/DashboardClient.tsx`
```tsx
'use client';
// Provides QueryClientProvider + Realtime subscription
// Renders the actual dashboard composition
```

---

## Phase 5: PDF Export Implementation

### 5.1 Export Utility
**File:** `src/lib/export-pdf.ts`
```typescript
// generateDashboardPDF(data, range) → Blob
// Uses jspdf + jspdf-autotable for tables
// For charts: html2canvas on each ChartWrapper ref (needs forwardRef)
// Layout: A4 portrait, header + each chart as image + tables
// Filename: `dashboard-foodrink-${range}-${date}.pdf`
```

### 5.2 Integration
- DashboardHeader export button → calls generateDashboardPDF → saveAs()
- Shows toast "PDF sedang disiapkan..." → "PDF siap diunduh"

---

## Phase 6: Accessibility & Performance

### 6.1 A11y Checklist
- [ ] All charts have ARIA labels + data tables (visually hidden) for screen readers
- [ ] Focus visible on all interactive elements (legend, tabs, buttons)
- [ ] Color contrast ≥ 4.5:1 (custom colors verified)
- [ ] Keyboard navigation: tab through legend, tooltips accessible
- [ ] Reduced motion: disable stagger animations, instant chart render

### 6.2 Performance
- Dynamic import chart components: `next/dynamic(() => import('./RevenueChart'), { ssr: false })`
- ChartWrapper: lazy load Recharts only when visible (IntersectionObserver)
- PDF export: client-side only, no SSR impact

---

## File Summary

### New Files (18)
```
src/lib/chart-colors.ts
src/lib/dashboard-queries.ts
src/lib/export-pdf.ts
src/hooks/useDashboardData.ts
src/app/api/admin/stats/route.ts
src/app/admin/(dashboard)/components/ChartWrapper.tsx
src/app/admin/(dashboard)/components/StatCard.tsx
src/app/admin/(dashboard)/components/DashboardHeader.tsx
src/app/admin/(dashboard)/components/QuickActions.tsx
src/app/admin/(dashboard)/components/RevenueChart.tsx
src/app/admin/(dashboard)/components/OrdersChart.tsx
src/app/admin/(dashboard)/components/OrderStatusDonut.tsx
src/app/admin/(dashboard)/components/TopProductsTable.tsx
src/app/admin/(dashboard)/components/RecentOrders.tsx
src/app/admin/(dashboard)/DashboardClient.tsx
```

### Modified Files (2)
```
src/app/admin/(dashboard)/page.tsx          # Server component, compose client wrapper
src/app/admin/(dashboard)/layout.tsx        # Add QueryClientProvider if not global
```

---

## Human Design Compliance Notes

| Principle | Implementation |
|-----------|----------------|
| **Asymmetric layout** | Stat grid 50/30/20, main content 70/30, bottom 70/30 |
| **Varied spacing** | Card padding: 8/6/4, gaps: 6/4/3 context-dependent |
| **Mixed border radius** | 2xl / xl / lg per card variant |
| **Custom color palette** | Warm-organic base, no Tailwind default colors in charts |
| **Staggered animation** | 100ms delay per card, 50ms per chart point |
| **Reduced motion support** | `prefers-reduced-motion` → instant render |
| **Human copy** | Empty states: "Belum ada pesanan baru" not "No data" |
| **Imperfect but intentional** | Y-axis not zero-based, varied bar widths, gradient fills |

---

## Estimated Effort

| Phase | Hours |
|-------|-------|
| 1. Foundation | 2.5 |
| 2. Chart Components | 4.5 |
| 3. Layout Components | 2 |
| 4. Page Composition | 1.5 |
| 5. PDF Export | 1.5 |
| 6. A11y/Perf Polish | 1 |
| **Total** | **~13 hours** |

---

## Dependencies Added

| Package | Purpose |
|---------|---------|
| `recharts` | Charts (React-native, lightweight) |
| `date-fns` | Date manipulation (already in deps) |
| `@tanstack/react-query` | Server state + caching + invalidation |
| `papaparse` | CSV parsing (for potential future) |
| `jspdf` | PDF generation |
| `jspdf-autotable` | PDF tables |
| `html2canvas` | Chart → image for PDF |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Recharts bundle size | Dynamic import + tree-shaking (only import used components) |
| Realtime subscription leaks | Cleanup in useEffect return, single channel per session |
| PDF chart rendering quality | html2canvas scale=2, fallback to table-only if fails |
| Mobile chart usability | Touch-friendly tooltips, horizontal scroll for wide charts |
| Date range performance | Queries indexed on created_at, limit 90 days max |

---

## Next Step

User approval → execute Phase 1 (Foundation) first, verify build, then iterate through phases.