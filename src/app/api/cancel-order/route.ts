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

  // Verify order belongs to user and is in menunggu_pembayaran status
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, user_id, status, payment_method, qris_proof_url')
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

  if (order.status !== 'menunggu_pembayaran') {
    return NextResponse.json({ error: 'Pesanan tidak dapat dibatalkan pada status ini' }, { status: 400 });
  }

  // Delete proof image from storage if exists
  if (order.qris_proof_url) {
    try {
      const url = new URL(order.qris_proof_url);
      const pathParts = url.pathname.split('/qris-proofs/');
      if (pathParts.length > 1) {
        const filePath = pathParts[1];
        await supabase.storage.from('qris-proofs').remove([filePath]);
      }
    } catch (storageError) {
      console.warn(`Failed to delete proof for order ${order.id}:`, storageError);
    }
  }

  // Delete order items first
  const { error: itemsError } = await supabase
    .from('order_items')
    .delete()
    .eq('order_id', orderId);

  if (itemsError) {
    console.error(`Error deleting items for order ${orderId}:`, itemsError);
    return NextResponse.json({ error: 'Gagal menghapus item pesanan' }, { status: 500 });
  }

  // Delete order
  const { error: deleteError } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId);

  if (deleteError) {
    console.error(`Error deleting order ${orderId}:`, deleteError);
    return NextResponse.json({ error: 'Gagal membatalkan pesanan' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    order_id: orderId,
  });
}