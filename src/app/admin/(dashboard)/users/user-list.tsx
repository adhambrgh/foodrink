'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Shield, Mail, Phone, Users, AlertCircle, CheckCircle, Clock, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { PaginatedTable, usePagination } from '@/components/admin/pagination';
import { UserFilters, Filters, Stats } from './user-filters';
import { getAllUsersAdmin, toggleUserRole, AdminUser } from './actions';
import { useToast } from '@/hooks/use-toast';

interface UserListClientProps {
  initialUsers: AdminUser[];
  initialTotal: number;
  initialStats: Stats;
  initialThreshold: number;
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const STATUS_CONFIG = {
  active: { label: 'Aktif', icon: CheckCircle, className: 'bg-success/10 text-success' },
  inactive: { label: 'Nonaktif', icon: Clock, className: 'bg-amber/10 text-amber' },
  never: { label: 'Belum Login', icon: AlertCircle, className: 'bg-text-muted/10 text-text-muted' },
  deleted: { label: 'Terhapus', icon: Users, className: 'bg-error/10 text-error' },
};

function RoleBadge({ role, onToggle, disabled }: { 
  role: 'customer' | 'admin'; 
  onToggle: () => void;
  disabled: boolean;
}) {
  const isAdmin = role === 'admin';
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        isAdmin ? 'bg-primary/10 text-primary' : 'bg-text-muted/10 text-text-muted'
      }`}>
        {isAdmin ? (
          <>
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </>
        ) : (
          'Customer'
        )}
      </span>
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isAdmin ? 'bg-primary' : 'bg-border'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
        role="switch"
        aria-checked={isAdmin}
        aria-label={isAdmin ? 'Ubah ke Customer' : 'Ubah ke Admin'}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isAdmin ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Belum pernah';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: id });
  } catch {
    return 'Tidak valid';
  }
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

export default function UserListClient({ 
  initialUsers, 
  initialTotal, 
  initialStats, 
  initialThreshold 
}: UserListClientProps) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
    role: 'all',
    activeThreshold: initialThreshold,
  });
  const [stats, setStats] = useState<Stats>(initialStats);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const debouncedFetch = useMemo(
    () => debounce(async (f: Filters, p: number) => {
      setLoading(true);
      try {
        const res = await fetchUsers({ ...f, page: p, pageSize });
        setUsers(res.users);
        setTotal(res.total);
        setStats(res.stats);
      } catch (err) {
        showToast('Gagal memuat data user', 'error');
      } finally {
        setLoading(false);
      }
    }, 300),
    [showToast]
  );

  const fetchUsers = useCallback(async (params: Filters & { page: number; pageSize: number }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== 'all') {
        if (key === 'activeThreshold' && value === 'custom') {
          searchParams.set('threshold', String(params.customDays || 14));
        } else if (key === 'activeThreshold' && value === 'all') {
          searchParams.set('threshold', 'all');
        } else if (key !== 'customDays') {
          searchParams.set(key, String(value));
        }
      }
    });

    const res = await fetch(`/admin/users/api?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  }, []);

  useEffect(() => {
    debouncedFetch(filters, 1);
    setPage(1);
  }, [filters, debouncedFetch]);

  useEffect(() => {
    if (page > 1) {
      debouncedFetch(filters, page);
    }
  }, [page, debouncedFetch, filters]);

  const handleSearchChange = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
  };

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      role: 'all',
      activeThreshold: initialThreshold,
    });
  };

  const handleRoleToggle = async (user: AdminUser) => {
    const newRole = user.role === 'admin' ? 'customer' : 'admin';
    const confirmMsg = `Yakin ubah ${user.email} jadi ${newRole === 'admin' ? 'Admin' : 'Customer'}?`;
    
    if (!window.confirm(confirmMsg)) return;

    setTogglingId(user.id);
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));

    try {
      const res = await toggleUserRole(user.id, newRole);
      if ('error' in res) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: user.role } : u));
        showToast(res.error, 'error');
      } else {
        showToast(`Role diubah ke ${newRole === 'admin' ? 'Admin' : 'Customer'}`, 'success');
      }
    } catch {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: user.role } : u));
      showToast('Gagal mengubah role', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const columns = useMemo(() => (
    <>
      <th className="px-4 py-3 font-medium">User</th>
      <th className="px-4 py-3 font-medium">Nama</th>
      <th className="px-4 py-3 font-medium hidden sm:table-cell">Telepon</th>
      <th className="px-4 py-3 font-medium text-center">Role</th>
      <th className="px-4 py-3 font-medium text-center">Status</th>
      <th className="px-4 py-3 font-medium text-center hidden md:table-cell">Terakhir Login</th>
      <th className="px-4 py-3 font-medium text-center hidden lg:table-cell">Terdaftar</th>
    </>
  ), []);

  const rows = useMemo(() => users.map(user => {
    const statusConfig = STATUS_CONFIG[user.status];
    const StatusIcon = statusConfig.icon;
    
    return (
      <tr 
        key={user.id} 
        className="border-b border-border/50 last:border-0 hover:bg-surface-variant/30 transition-colors"
      >
        <td className="px-4 py-3">
          <div className="font-medium text-text">{user.email}</div>
          <div className="text-xs text-text-muted font-mono">ID: {user.id.slice(0, 8)}…</div>
        </td>
        <td className="px-4 py-3">
          <div className="font-medium text-text flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-text-muted" />
            {user.name}
          </div>
        </td>
        <td className="px-4 py-3 hidden sm:table-cell">
          <div className="flex items-center gap-1.5 text-sm text-text-muted">
            <Phone className="w-3.5 h-3.5" />
            {user.phone}
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          <RoleBadge 
            role={user.role} 
            onToggle={() => handleRoleToggle(user)}
            disabled={togglingId === user.id}
          />
        </td>
        <td className="px-4 py-3 text-center">
          <StatusBadge status={user.status} />
        </td>
        <td className="px-4 py-3 text-center hidden md:table-cell">
          <div className="flex items-center justify-center gap-1.5 text-xs text-text-muted">
            <Clock className="w-3.5 h-3.5" />
            {formatRelativeTime(user.last_sign_in_at)}
          </div>
        </td>
        <td className="px-4 py-3 text-center hidden lg:table-cell">
          <div className="flex items-center justify-center gap-1.5 text-xs text-text-muted">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(user.created_at)}
          </div>
        </td>
      </tr>
    );
  }), [users, togglingId]);

  const pagination = usePagination(users, pageSize);
  const visibleCount = pagination.pagedItems.length;

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <UserFilters
        filters={filters}
        onChange={handleFilterChange}
        stats={stats}
        onClear={handleClearFilters}
      />

      <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-text-muted/30 mx-auto mb-3" />
            <p className="text-text-muted">Tidak ada user cocok</p>
            <p className="text-xs text-text-muted mt-1">Coba ubah filter atau pencarian</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-text-muted border-b border-border bg-surface-variant/40">
                    {columns}
                  </tr>
                </thead>
                <tbody>
                  {rows}
                </tbody>
              </table>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t border-border px-4 py-3">
              <div className="text-sm text-text-muted">
                Menampilkan {visibleCount} dari {total} user
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-text hover:bg-surface-variant disabled:opacity-40"
                >
                  Sebelum
                </button>
                {Array.from({ length: pagination.pageCount }, (_, i) => i + 1).map(num => (
                  <button
                    key={num}
                    onClick={() => setPage(num)}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${
                      num === pagination.page ? 'bg-primary text-white' : 'border border-border bg-white text-text hover:bg-surface-variant'
                    }`}
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(pagination.pageCount, p + 1))}
                  disabled={!pagination.hasNext}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-text hover:bg-surface-variant disabled:opacity-40"
                >
                  Sesudah
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}