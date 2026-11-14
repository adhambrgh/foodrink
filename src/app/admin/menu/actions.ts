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

  const { data: linkedProducts, error: countError } = await supabase
    .from('products')
    .select('id')
    .eq('category_id', id)
    .limit(1);

  if (countError) {
    throw new Error(countError.message);
  }

  if (linkedProducts && linkedProducts.length > 0) {
    throw new Error('Tidak dapat menghapus kategori karena masih ada produk terhubung. Pindahkan atau hapus produk terlebih dahulu.');
  }

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
      payment_method,
      total,
      address,
      notes,
      created_at,
      profiles (name, role),
      order_items (product_id, name_snapshot, price_snapshot, qty, subtotal)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return { error: error.message };
  }

  const orders = data || [];

  const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emailByUserId = new Map(
    (usersData?.users || []).map((user) => [user.id, user.email || ''])
  );

  const ordersWithEmails = orders.map((order: any) => {
    const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
    return {
      ...order,
      profiles: {
        ...profile,
        email: emailByUserId.get(order.user_id) || '',
      },
    };
  });

  return { orders: ordersWithEmails };
}

export async function updateOrderStatus(id: string, status: string) {
  const supabase = createAdminClient();

  // Get current order to check payment_method
  const { data: order } = await supabase
    .from('orders')
    .select('payment_method, payment_status, created_at, status')
    .eq('id', id)
    .single();

  if (!order) {
    return { error: 'Pesanan tidak ditemukan' };
  }

  const updateData: { status: string; payment_status?: string } = { status };

  if (status === 'selesai') {
    // Set payment_status to paid when order marked selesai, regardless of payment method
    updateData.payment_status = 'paid';
  }

  // If order is paid (via QRIS upload), allow manual override
  // No longer blocking status changes for paid orders

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/pesanan');
  revalidatePath(`/admin/pesanan/${id}`);
  return { success: true };
}