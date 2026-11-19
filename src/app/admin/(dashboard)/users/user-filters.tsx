'use client';

import { Search, Download, FilterX } from 'lucide-react';
import { useMemo } from 'react';

type ActiveThreshold = 7 | 30 | number | 'all' | 'custom';
type UserStatus = 'active' | 'inactive' | 'never' | 'all';
type UserRole = 'customer' | 'admin' | 'all';

export interface Filters {
  search: string;
  status: UserStatus;
  role: UserRole;
  activeThreshold: ActiveThreshold;
  customDays?: number;
}

export interface Stats {
  total: number;
  active: number;
  inactive: number;
  never: number;
  admins: number;
  customers: number;
}

interface UserFiltersProps {
  filters: Filters;
  onChange: (f: Filters) => void;
  stats: Stats;
  onClear?: () => void;
}

const STATUS_LABELS: Record<UserStatus, string> = {
  all: 'Semua Status',
  active: 'Aktif',
  inactive: 'Nonaktif',
  never: 'Belum Login',
};

const ROLE_LABELS: Record<UserRole, string> = {
  all: 'Semua Role',
  customer: 'Customer',
  admin: 'Admin',
};

const THRESHOLD_OPTIONS = [
  { value: 7, label: '7 hari' },
  { value: 30, label: '30 hari' },
  { value: 'all', label: 'Semua' },
  { value: 'custom', label: 'Custom…' },
];

export function UserFilters({ filters, onChange, stats, onClear }: UserFiltersProps) {
  const hasActiveFilters = useMemo(() => 
    filters.search || 
    filters.status !== 'all' || 
    filters.role !== 'all' || 
    (filters.activeThreshold !== 7 && filters.activeThreshold !== 'all' && filters.activeThreshold !== 'custom')
  , [filters]);

  return (
    <div className="flex flex-wrap gap-3 p-4 bg-surface-card border border-border rounded-xl">
      {/* Search - fleksibel dengan batas max */}
      <div className="flex-1 min-w-[200px] max-w-[400px] relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="search"
          placeholder="Cari email, nama, atau telepon..."
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Status Filter - auto width, wrap jika sempit */}
      <select
        value={filters.status}
        onChange={e => onChange({ ...filters, status: e.target.value as UserStatus })}
        className="w-full sm:w-auto min-w-[150px] px-3 py-2 rounded-lg border border-border bg-surface text-sm"
      >
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      {/* Role Filter - auto width */}
      <select
        value={filters.role}
        onChange={e => onChange({ ...filters, role: e.target.value as UserRole })}
        className="w-full sm:w-auto min-w-[130px] px-3 py-2 rounded-lg border border-border bg-surface text-sm"
      >
        {Object.entries(ROLE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      {/* Active Threshold - flex wrap */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-text-muted whitespace-nowrap hidden sm:block">Aktif jika login:</span>
        <select
          value={String(filters.activeThreshold)}
          onChange={e => {
            const val = e.target.value;
            if (val === 'custom') {
              onChange({ ...filters, activeThreshold: 'custom', customDays: filters.customDays || 14 });
            } else if (val === 'all') {
              onChange({ ...filters, activeThreshold: 'all' });
            } else {
              onChange({ ...filters, activeThreshold: Number(val) });
            }
          }}
          className="w-full sm:w-auto min-w-[130px] px-3 py-2 rounded-lg border border-border bg-surface text-sm"
        >
          {THRESHOLD_OPTIONS.map(opt => (
            <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
          ))}
        </select>
        {filters.activeThreshold === 'custom' && (
          <input
            type="number"
            min={1}
            max={365}
            value={filters.customDays || 14}
            onChange={e => onChange({ ...filters, customDays: Number(e.target.value) })}
            className="w-20 px-2 py-2 rounded-lg border border-border bg-surface text-sm"
            placeholder="Hari"
          />
        )}
      </div>

      {/* Export PDF Button - tidak shrink */}
      <button
        onClick={() => {
          const params = new URLSearchParams();
          if (filters.search) params.set('search', filters.search);
          if (filters.status !== 'all') params.set('status', filters.status);
          if (filters.role !== 'all') params.set('role', filters.role);
          if (filters.activeThreshold !== 7 && filters.activeThreshold !== 'custom') {
            if (filters.activeThreshold === 'all') params.set('threshold', 'all');
            else params.set('threshold', String(filters.activeThreshold));
          } else if (filters.activeThreshold === 'custom') {
            params.set('threshold', String(filters.customDays || 14));
          }
          params.set('format', 'pdf');
          window.open(`/admin/users/export?${params.toString()}`, '_blank');
        }}
        className="flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-lg border border-primary bg-white text-primary text-sm font-medium hover:bg-primary/5 transition-colors flex items-center gap-1.5"
      >
        <Download className="w-4 h-4" /> PDF
      </button>

      {/* Clear Filters - tidak shrink */}
      {hasActiveFilters && onClear && (
        <button
          onClick={onClear}
          className="flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-lg border border-border bg-white text-text-muted text-sm font-medium hover:bg-surface-variant transition-colors flex items-center gap-1.5"
        >
          <FilterX className="w-4 h-4" /> Reset
        </button>
      )}
    </div>
  );
}