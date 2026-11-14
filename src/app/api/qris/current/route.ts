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