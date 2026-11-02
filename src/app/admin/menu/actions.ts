'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { revalidatePath } from 'next/cache';

export async function createProduct(formData: FormData) {
  const supabase = createAdminClient();

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = parseInt(formData.get('price') as string);
  const stock = parseInt(formData.get('stock') as string);
  const category_id = formData.get('category_id') as string;
  const image_url = formData.get('image_url') as string | null;

  if (!name || !price || !stock || !category_id) {
    return { error: 'Nama, harga, stok, dan kategori wajib diisi' };
  }

  const { error } = await supabase.from('products').insert({
    name,
    description,
    price,
    stock,
    category_id,
    image_url,
    is_active: true,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/menu');
  return { success: true };
}

export async function updateProduct(formData: FormData, id: string) {
  const supabase = createAdminClient();

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = parseInt(formData.get('price') as string);
  const stock = parseInt(formData.get('stock') as string);
  const category_id = formData.get('category_id') as string;
  const image_url = formData.get('image_url') as string | null;

  if (!name || !price || !stock || !category_id) {
    return { error: 'Nama, harga, stok, dan kategori wajib diisi' };
  }

  const { error } = await supabase
    .from('products')
    .update({ name, description, price, stock, category_id, image_url })
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/menu');
  revalidatePath(`/admin/menu/${id}/edit`);
  return { success: true };
}

export async function toggleProductStatus(id: string, is_active: boolean) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('products')
    .update({ is_active: !is_active })
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/menu');
  return { success: true };
}

export async function deleteProduct(formData: FormData) {
  const supabase = createAdminClient();
  const id = formData.get('id') as string;

  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/menu');
}

export async function getCategories() {
  const supabase = createAdminClient();
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name')
    .eq('active', true)
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return categories || [];
}

export async function getProduct(id: string) {
  const supabase = createAdminClient();
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  return product;
}

export async function createCategory(formData: FormData) {
  const supabase = createAdminClient();
  const name = formData.get('name') as string;
  const icon = formData.get('icon') as string;
  const active = formData.get('active') === 'true';

  const { error } = await supabase.from('categories').insert({ name, icon, active });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/kategori');
}

export async function updateCategory(formData: FormData, id: string) {
  const supabase = createAdminClient();
  const name = formData.get('name') as string;
  const icon = formData.get('icon') as string;
  const active = formData.get('active') === 'true';

  const { error } = await supabase.from('categories').update({ name, icon, active }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/kategori');
}

export async function deleteCategory(formData: FormData) {
  const supabase = createAdminClient();
  const id = formData.get('id') as string;

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/kategori');
}

export async function getOrders() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      user_id,
      status,
      payment_status,
      total,
      address,
      notes,
      created_at,
      profiles (name),
      order_items (product_id, name_snapshot, price_snapshot, qty, subtotal)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return { error: error.message };
  }

  return { orders: data || [] };
}

export async function updateOrderStatus(id: string, status: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error updating order status:', error);
    return { error: error.message };
  }

  revalidatePath('/admin/pesanan');
  return { success: true };
}
