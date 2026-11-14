import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orderId } = await request.json().catch(() => ({}));

  if (!orderId) {
    return NextResponse.json({ error: 'Order ID wajib diisi' }, { status: 400 });
  }

  // Verify order belongs to user and is awaiting confirmation
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, user_id, payment_method, payment_status, total')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
  }

  if (order.user_id !== user.id) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  if (order.payment_method !== 'qris') {
    return NextResponse.json({ error: 'Pesanan ini bukan pembayaran QRIS' }, { status: 400 });
  }

  if (order.payment_status !== 'awaiting_confirmation') {
    return NextResponse.json({ error: 'Pesanan tidak dalam status menunggu konfirmasi' }, { status: 400 });
  }

  // Confirm payment: mark as paid, status diproses, set verified timestamp
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'diproses',
      qris_verified_at: now,
    })
    .eq('id', orderId);

  if (updateError) {
    console.error('Update order error:', updateError);
    return NextResponse.json({ error: 'Gagal konfirmasi pembayaran' }, { status: 500 });
  }

  // Decrease stock for confirmed QRIS orders
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('product_id, qty')
    .eq('order_id', orderId);

  for (const item of orderItems || []) {
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

  return NextResponse.json({
    success: true,
    order_id: orderId,
  });
}