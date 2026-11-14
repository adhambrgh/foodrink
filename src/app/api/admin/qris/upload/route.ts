import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

const BUCKET = 'qris-images';
const FILE_NAME = 'qris-dana.jpg';

export async function GET() {
  const supabase = createAdminClient();

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(FILE_NAME);

  return NextResponse.json({
    success: true,
    url: data.publicUrl,
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

  // Upload to Supabase Storage (overwrite if exists)
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(FILE_NAME, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return NextResponse.json({ error: 'Gagal upload QRIS' }, { status: 500 });
  }

  // Get public URL
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(FILE_NAME);

  return NextResponse.json({
    success: true,
    url: data.publicUrl,
  });
}

export async function DELETE() {
  const supabase = createAdminClient();

  const { error } = await supabase.storage.from(BUCKET).remove([FILE_NAME]);

  if (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Gagal hapus QRIS' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
  });
}