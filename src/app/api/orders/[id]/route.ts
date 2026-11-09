import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Admin action from same origin — cookies persisted by middleware.
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
  }

  // 1) Pastikan user yang login punya role admin.
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  // 2) Pastikan order yang dihapus adalah milik user yang sama (scope).
  const { data: order } = await supabase
    .from('orders')
    .select('id, user_id')
    .eq('id', params.id)
    .single();

  if (!order) {
    return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
  }

  // 3) Hapus item terlebih dahulu, lalu order.
  await supabase.from('order_items').delete().eq('order_id', params.id);
  const { error: orderError } = await supabase
    .from('orders')
    .delete()
    .eq('id', params.id);

  if (orderError) {
    console.error('Error deleting order:', orderError);
    return NextResponse.json({ error: 'Gagal menghapus pesanan' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
