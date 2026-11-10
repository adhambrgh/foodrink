import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createMidtransTransaction, generateOrderId, getSnapUrl } from '@/lib/midtrans';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { items, address, notes, payment_method = 'midtrans' } = await request.json().catch(() => ({}));

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'Keranjang kosong' }, { status: 400 });
  }

  if (!['midtrans', 'cod'].includes(payment_method)) {
    return NextResponse.json({ error: 'Metode pembayaran tidak valid' }, { status: 400 });
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
    });
  }

// Create order in database
  const orderId = generateOrderId();
  const isCod = payment_method === 'cod';
  const initialPaymentStatus = isCod ? 'paid' : 'pending';
  const initialOrderStatus = isCod ? 'diproses' : 'pending';

  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      id: orderId,
      user_id: user.id,
      total,
      address,
      notes,
      status: initialOrderStatus,
      payment_status: initialPaymentStatus,
      payment_method,
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

  // For COD: decrease stock immediately (like webhook does for paid)
  if (isCod) {
    for (const item of orderItems) {
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single();

      if (product) {
        await supabase
          .from('products')
          .update({ stock: product.stock - item.qty })
          .eq('id', item.product_id);
      }
    }
  }

  let midtransToken: string | null = null;
  let redirectUrl: string | null = null;

  if (payment_method === 'midtrans') {
    try {
      const transaction = await createMidtransTransaction({
        orderId,
        grossAmount: total,
        items: orderItems.map(item => ({
          id: item.product_id,
          price: item.price_snapshot,
          quantity: item.qty,
          name: item.name_snapshot,
        })),
      });
      midtransToken = transaction.token;
      redirectUrl = transaction.redirectUrl;
    } catch (error) {
      await supabase.from('order_items').delete().eq('order_id', orderId);
      await supabase.from('orders').delete().eq('id', orderId);
      console.error('Midtrans create failed:', error);
      return NextResponse.json({
        error: error instanceof Error ? error.message : 'Gagal membuat pembayaran Midtrans',
      }, { status: 502 });
    }
  }

  return NextResponse.json({
    success: true,
    order_id: orderId,
    total,
    items: orderItems,
    payment_method,
    midtrans_token: midtransToken,
    redirect_url:
      payment_method === 'cod'
        ? `/checkout/success/${orderId}`
        : midtransToken
        ? redirectUrl ?? getSnapUrl(midtransToken, orderId)
        : null,
  });
}

