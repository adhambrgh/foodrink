import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const supabase = createAdminClient();

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Format gambar tidak didukung (jpg, png, webp)' }, { status: 400 });
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Ukuran file maksimal 5MB' }, { status: 400 });
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  return NextResponse.json({ success: true, url: publicUrl });
}