import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

const BUCKET = 'qris-images';
const BASE_NAME = 'qris-dana';

export async function GET() {
  const supabase = createAdminClient();

  for (const ext of ['jpeg', 'jpg', 'png']) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(`${BASE_NAME}.${ext}`);
    
    if (!error && data) {
      const arrayBuffer = await data.arrayBuffer();
      return new NextResponse(arrayBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': 'attachment; filename="qris-foodrink.jpg"',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
  }
  
  return NextResponse.json({ error: 'QRIS tidak ditemukan' }, { status: 404 });
}