'use server';

import { createAdminClient } from '@/lib/supabase/server-admin';
import { revalidatePath } from 'next/cache';

export async function moveProductsToCategory(fromCategoryId: string, toCategoryId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('products')
    .update({ category_id: toCategoryId })
    .eq('category_id', fromCategoryId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/kategori');
  revalidatePath('/admin/menu');
  return { success: true };
}
