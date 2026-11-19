import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import sharp from 'sharp';

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

  // Convert HEIC/HEIF to JPEG server-side for universal preview
  let processedBuffer: Buffer;
  let finalContentType: string;
  let finalExt: string;

  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  const isHeic = file.type === 'image/heic' || file.type === 'image/heif';

  if (isHeic) {
    try {
      processedBuffer = await sharp(inputBuffer)
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
      finalContentType = 'image/jpeg';
      finalExt = 'jpg';
    } catch (err) {
      console.error('HEIC conversion failed, using original:', err);
      processedBuffer = inputBuffer;
      finalContentType = file.type;
      finalExt = file.name.split('.').pop() || 'heic';
    }
  } else {
    processedBuffer = inputBuffer;
    finalContentType = file.type;
    finalExt = file.name.split('.').pop() || 'jpg';
  }

  // Upload to Supabase Storage
  const fileName = `${orderId}-${Date.now()}.${finalExt}`;
  const filePath = `${user.id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('qris-proofs')
    .upload(filePath, processedBuffer, {
      contentType: finalContentType,
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return NextResponse.json({ error: uploadError.message || 'Gagal upload bukti pembayaran' }, { status: 500 });
  }

  // Get public URL for the proof
  const { data: { publicUrl: proofUrl } } = supabase.storage
    .from('qris-proofs')
    .getPublicUrl(filePath);

  // Update order: save proof URL, set status to awaiting_confirmation
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      payment_status: 'awaiting_confirmation',
      qris_proof_url: proofUrl,
      qris_proof_uploaded_at: now,
    })
    .eq('id', orderId);

  if (updateError) {
    console.error('Update order error:', JSON.stringify(updateError, null, 2));
    return NextResponse.json({ error: 'Gagal update status pesanan: ' + updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    order_id: orderId,
    proof_url: proofUrl,
  });
}