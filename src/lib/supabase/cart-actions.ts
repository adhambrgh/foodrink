'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { revalidatePath } from 'next/cache';

export interface CartItem {
  cart_id: string;
  product_id: string;
  qty: number;
  product: any;
  option_id?: string;
  option_name?: string;
  option_signature: string;
}

export interface CartState {
  items: CartItem[];
  loading: boolean;
  error?: string;
  selectedCartIds: string[];
  setSelectedCartIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  add: (productId: string, qty?: number) => Promise<void>;
  addWithOption: (productId: string, qty: number, optionId?: string) => Promise<void>;
  update: (cartId: string, qty: number) => Promise<void>;
  remove: (cartId: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}

export async function createServerClient() {
  const { createServerClient: createClient } = await import('@supabase/ssr');
  const { cookies } = await import('next/headers');
  const cookieStore = cookies();
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any[]) {
          // No-op in server action context
        },
      },
    }
  );
}

export async function getCart(): Promise<{ items: CartItem[]; error: string | null }> {
  'use server';
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { items: [], error: 'Unauthorized' };

  const { data, error } = await supabase
    .from('carts')
    .select(`
      id, qty, product_id, option_id, option_name, option_signature,
      products (id, name, price, is_active, stock, image_url, description)
    `)
    .eq('user_id', user.id);

  if (error) return { items: [], error: error.message };

  const items = (data || []).map((row: any) => ({
    cart_id: row.id,
    product_id: row.product_id,
    qty: row.qty,
    option_id: row.option_id,
    option_name: row.option_name,
    option_signature: row.option_signature || '',
    product: row.products as any,
  }));

  return { items, error: null };
}

export async function addToCart(productId: string, qty: number = 1, optionId?: string) {
  'use server';
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // Validate product exists and is active
  const { data: product } = await supabase
    .from('products')
    .select('id, stock, is_active')
    .eq('id', productId)
    .single();

  if (!product || !product.is_active) return { error: 'Produk tidak tersedia' };
  if (product.stock < qty) return { error: 'Stok tidak mencukupi' };

  // Determine option signature for uniqueness
  // If optionId provided and valid, use it; otherwise use empty string
  const signature = optionId ? optionId : '';

  // Upsert with option signature uniqueness
  const { data, error } = await supabase
    .from('carts')
    .upsert(
      {
        user_id: user.id,
        product_id: productId,
        qty,
        option_id: optionId,
        option_name: optionId ? 'Rasa: ' + (await getOptionName(optionId)) : '',
        option_signature: signature,
      },
      { onConflict: 'user_id,product_id,option_signature' }
    )
    .select('id')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/keranjang');
  return { success: true, cart_id: data?.id };
}

export async function updateCartQty(cartId: string, qty: number) {
  'use server';
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  if (qty < 1) return { error: 'Qty minimal 1' };

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
  const supabase = await createServerClient();
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
  const supabase = await createServerClient();
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

async function getOptionName(optionId: string): Promise<string> {
  try {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from('product_options')
      .select('name')
      .eq('id', optionId)
      .single();
    return data?.name || '';
  } catch {
    return '';
  }
}

// Helper for admin: get product with options
export async function getProductWithOptions(id: string) {
  'use server';
  const supabase = createAdminClient();
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  const { data: options } = await supabase
    .from('product_options')
    .select('id, name, is_available, is_default')
    .eq('product_id', id)
    .eq('is_available', true)
    .order('sort_order');

  return { ...product, options: options || [] };
}

// Alias untuk kompatibilitas hook
export const addToCartWithOption = addToCart;