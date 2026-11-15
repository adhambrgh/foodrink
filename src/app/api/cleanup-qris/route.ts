import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  
  // Threshold 1: 15 minutes for orders with no proof uploaded (payment_status = 'pending')
  const thresholdPending = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  // Threshold 2: 30 minutes for orders with proof but no confirmation (payment_status = 'awaiting_confirmation')
  const thresholdAwaiting = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

  try {
    // Find abandoned orders: 
    // 1. status = 'menunggu_pembayaran' AND payment_status = 'pending' AND created_at > 15 min ago (no proof uploaded)
    // 2. status = 'menunggu_pembayaran' AND payment_status = 'awaiting_confirmation' AND qris_proof_uploaded_at > 30 min ago (proof uploaded but not confirmed)
    const { data: abandonedOrdersPending, error: fetchError1 } = await supabase
      .from('orders')
      .select('id, qris_proof_url, order_items(product_id, qty)')
      .eq('payment_method', 'qris')
      .eq('status', 'menunggu_pembayaran')
      .eq('payment_status', 'pending')
      .lt('created_at', thresholdPending);

    const { data: abandonedOrdersAwaiting, error: fetchError2 } = await supabase
      .from('orders')
      .select('id, qris_proof_url, order_items(product_id, qty)')
      .eq('payment_method', 'qris')
      .eq('status', 'menunggu_pembayaran')
      .eq('payment_status', 'awaiting_confirmation')
      .lt('qris_proof_uploaded_at', thresholdAwaiting);

    if (fetchError1 || fetchError2) {
      console.error('Fetch abandoned orders error:', fetchError1 || fetchError2);
      return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
    }

    const abandonedOrders = [
      ...(abandonedOrdersPending || []),
      ...(abandonedOrdersAwaiting || [])
    ];

    if (abandonedOrders.length === 0) {
      return NextResponse.json({ 
        success: true, 
        cleaned: 0, 
        message: 'Tidak ada order terlantar' 
      });
    }

    let cleaned = 0;
    const errors: string[] = [];

    for (const order of abandonedOrders) {
      try {
        // Delete order items first
        const { error: itemsError } = await supabase
          .from('order_items')
          .delete()
          .eq('order_id', order.id);

        if (itemsError) {
          console.error(`Error deleting items for order ${order.id}:`, itemsError);
          errors.push(`Order ${order.id}: ${itemsError.message}`);
          continue;
        }

        // Delete proof image from storage if exists
        if (order.qris_proof_url) {
          try {
            const url = new URL(order.qris_proof_url);
            const pathParts = url.pathname.split('/qris-proofs/');
            if (pathParts.length > 1) {
              const filePath = pathParts[1];
              await supabase.storage.from('qris-proofs').remove([filePath]);
            }
          } catch (storageError) {
            console.warn(`Failed to delete proof for order ${order.id}:`, storageError);
          }
        }

        // Delete order
        const { error: orderError } = await supabase
          .from('orders')
          .delete()
          .eq('id', order.id);

        if (orderError) {
          console.error(`Error deleting order ${order.id}:`, orderError);
          errors.push(`Order ${order.id}: ${orderError.message}`);
          continue;
        }

        cleaned++;
      } catch (err) {
        console.error(`Error cleaning order ${order.id}:`, err);
        errors.push(`Order ${order.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      cleaned,
      total_abandoned: abandonedOrders.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error('Cleanup error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}