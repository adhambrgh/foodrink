import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

const BUCKET = 'qris-images';
const BASE_NAME = 'qris-dana';

function getPublicUrl(supabase: ReturnType<typeof createAdminClient>, ext: string) {
  return supabase.storage.from(BUCKET).getPublicUrl(`${BASE_NAME}.${ext}`).data.publicUrl;
}

export async function GET() {
  const supabase = createAdminClient();

  const jpgUrl = getPublicUrl(supabase, 'jpg');
  const jpegUrl = getPublicUrl(supabase, 'jpeg');

  const { data: jpgExists } = await supabase.storage.from(BUCKET).list('', { search: 'qris-dana.jpg' });
  const { data: jpegExists } = await supabase.storage.from(BUCKET).list('', { search: 'qris-dana.jpeg' });

  const url = (jpegExists && jpegExists.length > 0) ? jpegUrl : jpgUrl;

  return NextResponse.json({
    success: true,
    url,
  });
}

export async function POST(request: Request) {
  const supabase = createAdminClient();
  const formData = await request.formData();
  const file = formData.get('image') as File;

  if (!file) {
    return NextResponse.json({ error: 'File gambar wajib diisi' }, { status: 400 });
  }

  // Validate file
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Ukuran file maksimal 5MB' }, { status: 400 });
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Tipe file tidak didukung (JPG, PNG, WebP)' }, { status: 400 });
  }

  // Use original file extension
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${BASE_NAME}.${ext}`;

  // Upload to Supabase Storage (overwrite if exists)
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return NextResponse.json({ error: 'Gagal upload QRIS' }, { status: 500 });
  }

  // Get public URL
  const url = getPublicUrl(supabase, ext);

  return NextResponse.json({
    success: true,
    url,
  });
}

export async function DELETE() {
  const supabase = createAdminClient();

  const { error } = await supabase.storage.from(BUCKET).remove(['qris-dana.jpg', 'qris-dana.jpeg']);

  if (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Gagal hapus QRIS' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
  });
}