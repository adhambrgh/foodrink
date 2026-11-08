'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateOrderStatusCustomer(id: string, status: string) {
  const supabase = createClient();

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('payment_method, payment_status')
    .eq('id', id)
    .single();

  if (fetchError) return { error: fetchError.message };

  const { payment_method, payment_status } = order;

  const updateData: { status: string; payment_status?: string } = { status };

  // COD: bayar saat diantar. Kalau status jadi diproses, langsung jadi selesai & lunas.
  if (payment_method === 'cod' && status === 'diproses' && payment_status !== 'paid') {
    updateData.status = 'selesai';
    updateData.payment_status = 'paid';
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/pesanan');
  return { success: true };
}
