'use server';

import { createAdminClient } from '@/lib/supabase/server-admin';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

export async function uploadProductImage(formData: FormData) {
  const supabase = createAdminClient();

  const file = formData.get('file') as File;

  if (!file || file.size === 0) {
    return { error: 'File tidak ditemukan' };
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('products')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return { error: uploadError.message };
  }

  const { data: { publicUrl } } = supabase.storage
    .from('products')
    .getPublicUrl(fileName);

  return { success: true, url: publicUrl };
}

export async function deleteProductImage(imageUrl: string) {
  const supabase = createAdminClient();

  // Extract filename from URL
  const urlParts = imageUrl.split('/');
  const fileName = urlParts[urlParts.length - 1];

  const { error } = await supabase.storage
    .from('products')
    .remove([fileName]);

  if (error) {
    console.error('Delete error:', error);
    return { error: error.message };
  }

  revalidatePath('/admin/menu');
  return { success: true };
}
