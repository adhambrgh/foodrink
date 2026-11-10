'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { Product } from '@/lib/types';

export async function getCart() {
  'use server';
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { items: [], error: 'Unauthorized' };

  const { data, error } = await supabase
    .from('carts')
    .select(`
      id, qty, product_id,
      products (id, name, description, price, image_url, stock, is_active)
    `)
    .eq('user_id', user.id);

  if (error) return { items: [], error: error.message };

  const items = (data || []).map((row: any) => ({
    cart_id: row.id,
    product_id: row.product_id,
    qty: row.qty,
    product: row.products as Product,
  }));

  return { items, error: null };
}

export async function addToCart(productId: string, qty: number = 1) {
  'use server';
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: product } = await supabase
    .from('products')
    .select('id, stock, is_active')
    .eq('id', productId)
    .single();

  if (!product || !product.is_active) {
    return { error: 'Produk tidak tersedia' };
  }

  if (product.stock < qty) {
    return { error: 'Stok tidak mencukupi' };
  }

  const { error } = await supabase
    .from('carts')
    .upsert(
      { user_id: user.id, product_id: productId, qty },
      { onConflict: 'user_id,product_id' }
    );

  if (error) return { error: error.message };

  revalidatePath('/keranjang');
  return { success: true };
}

export async function updateCartQty(cartId: string, qty: number) {
  'use server';
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  if (qty < 1) {
    return { error: 'Qty minimal 1' };
  }

  const { data: cartItem } = await supabase
    .from('carts')
    .select('product_id, products(stock)')
    .eq('id', cartId)
    .eq('user_id', user.id)
    .single();

  if (!cartItem) return { error: 'Item tidak ditemukan' };

  const stock = (cartItem.products as any)?.stock || 0;
  if (stock < qty) {
    return { error: 'Stok tidak mencukupi' };
  }

  const { error } = await supabase
    .from('carts')
    .update({ qty })
    .eq('id', cartId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/keranjang');
  return { success: true };
}

export async function removeFromCart(cartId: string) {
  'use server';
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('carts')
    .delete()
    .eq('id', cartId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/keranjang');
  return { success: true };
}

export async function clearCart() {
  'use server';
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('carts')
    .delete()
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/keranjang');
  return { success: true };
}