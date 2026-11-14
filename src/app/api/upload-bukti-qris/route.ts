import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const orderId = formData.get('orderId') as string;
  const file = formData.get('proof') as File;

  if (!orderId || !file) {
    return NextResponse.json({ error: 'Order ID dan file bukti wajib diisi' }, { status: 400 });
  }

  // Verify order belongs to user and is pending QRIS payment
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

  if (order.payment_status === 'paid') {
    return NextResponse.json({ error: 'Pesanan sudah dibayar' }, { status: 400 });
  }

  // Validate file
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Ukuran file maksimal 5MB' }, { status: 400 });
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  if (!validTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Tipe file tidak didukung' }, { status: 400 });
  }

  // Upload to Supabase Storage
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${orderId}-${Date.now()}.${fileExt}`;
  const filePath = `qris-proofs/${user.id}/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from('qris-proofs')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return NextResponse.json({ error: 'Gagal upload bukti pembayaran' }, { status: 500 });
  }

  // Get public URL for the proof
  const { data: { publicUrl: proofUrl } } = supabase.storage
    .from('qris-proofs')
    .getPublicUrl(filePath);

  // Update order: mark as paid, status diproses, save proof URL
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'diproses',
      qris_proof_url: proofUrl,
      qris_proof_uploaded_at: now,
    })
    .eq('id', orderId);

  if (updateError) {
    console.error('Update order error:', updateError);
    return NextResponse.json({ error: 'Gagal update status pesanan' }, { status: 500 });
  }

  // Decrease stock for QRIS paid orders (like COD)
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
    proof_url: proofUrl,
  });
}