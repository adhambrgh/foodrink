'use server';

import { createAdminClient } from '@/lib/supabase/server-admin';
import { revalidatePath } from 'next/cache';
import { normalizePhone } from '@/lib/utils';

type ActiveThreshold = 7 | 30 | number | 'all';
type UserStatus = 'active' | 'inactive' | 'never' | 'all';
type UserRole = 'customer' | 'admin' | 'all';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'customer' | 'admin';
  created_at: string;
  last_sign_in_at: string | null;
  status: Exclude<UserStatus, 'all'>;
}

export interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  stats: {
    total: number;
    active: number;
    inactive: number;
    never: number;
    admins: number;
    customers: number;
  };
  error?: string;
}

export interface Filters {
  search?: string;
  status?: UserStatus;
  role?: UserRole;
  activeThreshold?: ActiveThreshold;
  customDays?: number;
  page?: number;
  pageSize?: number;
}

function computeStatus(
  lastSignIn: string | null,
  thresholdDays: number
): Exclude<UserStatus, 'all'> {
  if (!lastSignIn) return 'never';
  const daysSince = (Date.now() - new Date(lastSignIn).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince <= thresholdDays ? 'active' : 'inactive';
}

function getThresholdDays(threshold: ActiveThreshold, customDays?: number): number {
  if (threshold === 'all') return 999999;
  if (typeof threshold === 'number') return threshold;
  if (threshold === 'custom') return customDays || 14;
  return 7;
}

export async function getAllUsersAdmin(filters: Filters = {}): Promise<UsersResponse> {
  const supabase = createAdminClient();

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const search = filters.search?.toLowerCase().trim() || '';
  const statusFilter = filters.status || 'all';
  const roleFilter = filters.role || 'all';
  const thresholdDays = getThresholdDays(filters.activeThreshold || 7, filters.customDays);

  // Fetch all users with pagination
  let allAuthUsers: any[] = [];
  let authPage = 1;
  const perPage = 1000;

  while (true) {
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
      page: authPage,
      perPage,
    });

    if (authError) {
      return {
        users: [],
        total: 0,
        page: 1,
        pageSize,
        stats: { total: 0, active: 0, inactive: 0, never: 0, admins: 0, customers: 0 },
        error: authError.message,
      };
    }

    if (!authUsers?.users?.length) break;

    allAuthUsers.push(...authUsers.users);

    if (authUsers.users.length < perPage) break;
    authPage++;
  }

  const authUsers = { users: allAuthUsers };

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, role, phone, name, created_at');

  if (profilesError) {
    console.error('Profiles query error:', profilesError);
    return {
      users: [],
      total: 0,
      page: 1,
      pageSize,
      stats: { total: 0, active: 0, inactive: 0, never: 0, admins: 0, customers: 0 },
      error: `Failed to fetch profiles: ${profilesError.message}`,
    };
  }

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  let allUsers: AdminUser[] = authUsers.users.map(authUser => {
    const profile = profileMap.get(authUser.id);
    const meta = authUser.user_metadata || {};
    
    // Priority: auth raw_user_meta_data > profiles table
    const name = meta.name || profile?.name || '-';
    const phone = meta.phone 
      ? normalizePhone(meta.phone)
      : (profile?.phone || '-');
    
    const lastSignIn = authUser.last_sign_in_at || null;
    const status = computeStatus(lastSignIn, thresholdDays);

    return {
      id: authUser.id,
      email: authUser.email || '-',
      name,
      phone,
      role: (profile?.role as 'customer' | 'admin') || 'customer',
      created_at: authUser.created_at,
      last_sign_in_at: lastSignIn,
      status,
    };
  });

  if (search) {
    allUsers = allUsers.filter(u =>
      u.email.toLowerCase().includes(search) ||
      u.name.toLowerCase().includes(search) ||
      u.phone.includes(search)
    );
  }

  if (statusFilter !== 'all') {
    allUsers = allUsers.filter(u => u.status === statusFilter);
  }

  if (roleFilter !== 'all') {
    allUsers = allUsers.filter(u => u.role === roleFilter);
  }

  allUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const stats = {
    total: allUsers.length,
    active: allUsers.filter(u => u.status === 'active').length,
    inactive: allUsers.filter(u => u.status === 'inactive').length,
    never: allUsers.filter(u => u.status === 'never').length,
    admins: allUsers.filter(u => u.role === 'admin').length,
    customers: allUsers.filter(u => u.role === 'customer').length,
  };

  const start = (page - 1) * pageSize;
  const paginatedUsers = allUsers.slice(start, start + pageSize);

  return {
    users: paginatedUsers,
    total: allUsers.length,
    page,
    pageSize,
    stats,
  };
}

export async function toggleUserRole(
  userId: string,
  newRole: 'customer' | 'admin'
): Promise<{ success: true } | { error: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}