import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Verify signature key
    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const expectedSignature = crypto
      .createHash('sha512')
      .update(payload.order_id + payload.status_code + payload.gross_amount + serverKey)
      .digest('hex');

    if (payload.signature_key !== expectedSignature) {
      console.error('Invalid signature:', {
        received: payload.signature_key,
        expected: expectedSignature
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // Map Midtrans status to our payment_status
    let paymentStatus = 'pending';
    let orderStatus = 'pending';

    switch (payload.transaction_status) {
      case 'capture':
        if (payload.fraud_status === 'accept') {
          paymentStatus = 'paid';
          orderStatus = 'diproses';
        } else {
          paymentStatus = 'pending';
        }
        break;
      case 'settlement':
        paymentStatus = 'paid';
        orderStatus = 'diproses';
        break;
      case 'pending':
        paymentStatus = 'pending';
        break;
      case 'deny':
      case 'cancel':
      case 'expire':
        paymentStatus = 'failed';
        orderStatus = 'pending';
        break;
      case 'refund':
        paymentStatus = 'failed';
        break;
    }

    // Update order in database
    const supabase = createClient();

    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        status: orderStatus,
        midtrans_transaction_id: payload.transaction_id,
        midtrans_payment_type: payload.payment_type,
        midtrans_transaction_time: payload.transaction_time,
        midtrans_status_message: payload.status_message,
        midtrans_fraud_status: payload.fraud_status,
        midtrans_raw_response: JSON.stringify(payload),
      })
      .eq('id', payload.order_id);

    if (error) {
      console.error('Error updating order:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If payment successful (settlement or accepted capture), decrease stock
    if (paymentStatus === 'paid') {
      const { data: paidItems } = await supabase
        .from('order_items')
        .select('product_id, qty')
        .eq('order_id', payload.order_id);

      for (const item of paidItems || []) {
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
      console.log(`Order ${payload.order_id} paid successfully, stock decreased`);
    }

    // If payment failed (cancel, deny, expire, refund), restore stock and delete the order
    if (paymentStatus === 'failed') {
      const { data: failedItems } = await supabase
        .from('order_items')
        .select('product_id, qty')
        .eq('order_id', payload.order_id);

      for (const item of failedItems || []) {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({ stock: product.stock + item.qty })
            .eq('id', item.product_id);
        }
      }

      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', payload.order_id);
      if (itemsError) {
        console.error('Error deleting order items:', itemsError);
      }
      const { error: orderDeleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', payload.order_id);
      if (orderDeleteError) {
        console.error('Error deleting order:', orderDeleteError);
      }
    }

    // If paid, could trigger notification, email, etc.
    if (paymentStatus === 'paid') {
      console.log(`Order ${payload.order_id} paid successfully`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}