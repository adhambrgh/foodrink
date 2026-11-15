'use server';

import { createAdminClient } from '@/lib/supabase/server-admin';
import { revalidatePath } from 'next/cache';

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export async function getBanners(activeOnly = false) {
  const supabase = createAdminClient();
  let query = supabase.from('banners').select('*').order('sort_order').order('created_at', { ascending: false });
  if (activeOnly) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
  return (data || []) as Banner[];
}

export async function createBanner(formData: FormData) {
  const supabase = createAdminClient();
  const title = formData.get('title') as string;
  const subtitle = (formData.get('subtitle') as string) || null;
  const image_url = formData.get('image_url') as string;
  const link_url = (formData.get('link_url') as string) || null;
  const sort_order = parseInt(formData.get('sort_order') as string, 10) || 0;
  const is_active = formData.get('is_active') === 'on';

  if (!title || !image_url) {
    return { error: 'Judul dan gambar wajib diisi' };
  }

  const { error } = await supabase.from('banners').insert({ title, subtitle, image_url, link_url, sort_order, is_active });
  if (error) return { error: error.message };
  revalidatePath('/admin/banner');
  return { success: true };
}

export async function updateBanner(id: string, formData: FormData) {
  const supabase = createAdminClient();
  const title = formData.get('title') as string;
  const subtitle = (formData.get('subtitle') as string) || null;
  const image_url = formData.get('image_url') as string; // bisa '' jika dihapus
  const link_url = (formData.get('link_url') as string) || null;
  const sort_order = parseInt(formData.get('sort_order') as string, 10) || 0;
  const is_active = formData.get('is_active') === 'on';

  if (!title) {
    return { error: 'Judul wajib diisi' };
  }

  // Ambil banner lama untuk hapus file storage jika gambar berubah
  const { data: oldBanner } = await supabase
    .from('banners')
    .select('image_url')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('banners')
    .update({
      title,
      subtitle,
      image_url: image_url || null, // '' -> null
      link_url,
      sort_order,
      is_active,
    })
    .eq('id', id);

  if (error) return { error: error.message };

  // Hapus file lama dari Storage jika ada perubahan gambar
  if (oldBanner?.image_url && oldBanner.image_url !== image_url) {
    const oldFileName = oldBanner.image_url.split('/').pop();
    if (oldFileName) {
      await supabase.storage.from('product-images').remove([oldFileName]);
    }
  }

  revalidatePath('/admin/banner');
  return { success: true };
}

export async function deleteBanner(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('banners').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/banner');
  return { success: true };
}

export async function toggleBanner(id: string, is_active: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('banners').update({ is_active }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/banner');
  return { success: true };
}