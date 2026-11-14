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
  const thresholdMinutes = 15;
  const thresholdTime = new Date(Date.now() - thresholdMinutes * 60 * 1000).toISOString();

  try {
    // Find abandoned awaiting_confirmation orders older than threshold
    const { data: abandonedOrders, error: fetchError } = await supabase
      .from('orders')
      .select('id, qris_proof_url, order_items(product_id, qty)')
      .eq('payment_method', 'qris')
      .eq('payment_status', 'awaiting_confirmation')
      .lt('qris_proof_uploaded_at', thresholdTime);

    if (fetchError) {
      console.error('Fetch abandoned orders error:', fetchError);
      return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
    }

    if (!abandonedOrders || abandonedOrders.length === 0) {
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