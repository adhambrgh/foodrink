'use server';

import { createAdminClient } from '@/lib/supabase/server-admin';
import { revalidatePath } from 'next/cache';

export async function getCustomers() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('profiles').select('id, name').eq('role', 'customer').order('name');
  if (error) return [];
  return data || [];
}

export async function sendNotification(formData: FormData) {
  const supabase = createAdminClient();
  const title = String(formData.get('title') || '').trim();
  const message = String(formData.get('message') || '').trim();
  const type = String(formData.get('type') || 'info');
  const target = String(formData.get('target') || 'all');

  if (!title || !message || !['info', 'promo', 'order'].includes(type)) {
    return { error: 'Judul, pesan, dan tipe notifikasi wajib diisi dengan benar' };
  }

  const userIds = target === 'all'
    ? (await getCustomers()).map((customer) => customer.id)
    : [target];

  if (userIds.length === 0) return { error: 'Belum ada customer penerima' };

  const { error } = await supabase.from('notifications').insert(
    userIds.map((user_id) => ({ user_id, title, message, type }))
  );
  if (error) return { error: error.message };

  revalidatePath('/admin/notifikasi');
  revalidatePath('/notifikasi');
  return { success: true, count: userIds.length };
}