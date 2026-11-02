import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateOrderId } from '@/lib/midtrans';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { items, address, notes } = await request.json();

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'Keranjang kosong' }, { status: 400 });
  }

  // Get product details and calculate total
  const productIds = items.map((i: any) => i.product_id);
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, stock, image_url')
    .in('id', productIds);

  if (!products || products.length !== productIds.length) {
    return NextResponse.json({ error: 'Produk tidak valid' }, { status: 400 });
  }

  // Validate stock and calculate total
  let total = 0;
  const orderItems: any[] = [];

  for (const item of items) {
    const product = products.find((p: any) => p.id === item.product_id);
    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 400 });
    }
    if (product.stock < item.qty) {
      return NextResponse.json({ error: `Stok ${product.name} tidak mencukupi` }, { status: 400 });
    }
    total += parseFloat(product.price) * item.qty;
    orderItems.push({
      product_id: product.id,
      name_snapshot: product.name,
      price_snapshot: parseFloat(product.price),
      qty: item.qty,
      subtotal: parseFloat(product.price) * item.qty,
      image_url: product.image_url,
    });
  }

  // Create order in database
  const orderId = generateOrderId();
  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      id: orderId,
      user_id: user.id,
      total,
      address,
      notes,
      status: 'pending',
      payment_status: 'pending',
    })
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  // Insert order items
  const itemsWithOrderId = orderItems.map(item => ({
    ...item,
    order_id: orderId,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemsWithOrderId);

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  // Decrease stock
  for (const item of items) {
    const product = products.find((p: any) => p.id === item.product_id);
    if (product) {
      await supabase
        .from('products')
        .update({ stock: product.stock - item.qty })
        .eq('id', product.id);
    }
  }

  // Return order info for client-side payment modal
  return NextResponse.json({
    success: true,
    order_id: orderId,
    total,
    items: orderItems,
    redirect_url: `/checkout/${orderId}`,
  });
}