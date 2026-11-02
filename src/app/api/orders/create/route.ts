import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type CookieSetting = { name: string; value: string; options?: Record<string, unknown> };

async function getSupabase() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieSetting[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as any)
          );
        },
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items, delivery_method, class_location, notes } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Keranjang kosong' }, { status: 400 });
    }

    // Check stock and calculate real total from DB
    let calculatedTotal = 0;
    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('price, stock, name')
        .eq('id', item.product_id)
        .single();

      if (!product) {
        return NextResponse.json({ error: `Produk tidak ditemukan: ${item.product_id}` }, { status: 400 });
      }

      if ((product.stock || 0) < item.qty) {
        return NextResponse.json({ error: `Stok ${product.name} tidak mencukupi` }, { status: 400 });
      }

      calculatedTotal += (product.price || 0) * item.qty;
    }

    // Create order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total: calculatedTotal,
        delivery_method,
        class_location: delivery_method === 'antar_ke_kelas' ? class_location : null,
        notes: notes || null,
        status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // Create order items
    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('name, price, stock')
        .eq('id', item.product_id)
        .single();

      const price = product?.price || 0;

      await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: item.product_id,
        name_snapshot: product?.name,
        price_snapshot: price,
        qty: item.qty,
        subtotal: price * item.qty,
      });

      // Reduce stock
      if (product) {
        await supabase
          .from('products')
          .update({ stock: (product.stock || 0) - item.qty })
          .eq('id', item.product_id);
      }
    }

    // Clear cart
    await supabase.from('carts').delete().eq('user_id', user.id);

    // Create Midtrans transaction
    const { data: transaksi } = await supabase
      .from('midtrans_transactions')
      .insert({
        order_id: order.id,
        amount: calculatedTotal,
        status: 'pending',
      })
      .select()
      .single();

    // Generate Midtrans token via server-side API call
    const midtransToken = await generateMidtransToken({
      order_id: order.id,
      amount: calculatedTotal,
      customer_email: user.email || '',
      customer_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
    });

    // Update with transaction token
    await supabase
      .from('midtrans_transactions')
      .update({ token: midtransToken })
      .eq('order_id', order.id);

    return NextResponse.json({
      success: true,
      order_id: order.id,
      redirect_url: midtransToken ? `/ringkasan-pembayaran?order=${order.id}` : '/ringkasan-pembayaran',
    });

  } catch (error: any) {
    console.error('Order error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

async function generateMidtransToken(params: {
  order_id: string;
  amount: number;
  customer_email: string;
  customer_name: string;
}): Promise<string | null> {
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) return null;

    const auth = Buffer.from(`${serverKey}:`).toString('base64');

    const payload = {
      transaction_details: {
        order_id: params.order_id,
        gross_amount: params.amount,
      },
      customer_details: {
        email: params.customer_email,
        first_name: params.customer_name,
      },
      item_details: [],
    };

    const response = await fetch('https://app.sandbox.midtrans.com/api/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.token || null;
  } catch {
    return null;
  }
}