import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select('id, total, address, notes, status, payment_status, created_at, order_items(product_id, qty, price_snapshot, name_snapshot)')
    .eq('id', params.id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
  }

  return NextResponse.json({ order });
}
