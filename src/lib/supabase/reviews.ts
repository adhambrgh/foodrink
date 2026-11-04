'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { revalidatePath } from 'next/cache';

function getServerClient() {
  return createClient();
}

function getAdminServerClient() {
  return createAdminClient();
}

// Customer: create review
export async function createReview(formData: FormData) {
  const supabase = getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Anda harus login untuk menulis review' };
  }

  const product_id = formData.get('product_id') as string;
  const order_item_id = formData.get('order_item_id') as string;
  const rating = parseInt(formData.get('rating') as string, 10);
  const comment = formData.get('comment') as string;

  if (!product_id || !order_item_id || !rating) {
    return { error: 'Data tidak lengkap' };
  }

  const { error } = await supabase.from('reviews').insert({
    user_id: user.id,
    product_id,
    order_item_id,
    rating,
    comment: comment || null,
  });

  if (error) {
    if (error.code === '23505') {
      return { error: 'Anda sudah menulis review untuk item ini' };
    }
    return { error: error.message };
  }

  revalidatePath(`/produk/${product_id}`);
  return { success: true };
}

// Customer: update review
export async function updateReview(id: string, formData: FormData) {
  const supabase = getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Anda harus login' };
  }

  const rating = parseInt(formData.get('rating') as string, 10);
  const comment = formData.get('comment') as string;

  const { error } = await supabase
    .from('reviews')
    .update({ rating, comment: comment || null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/reviews');
  return { success: true };
}

// Customer: delete review
export async function deleteReview(id: string) {
  const supabase = getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Anda harus login' };
  }

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/reviews');
  return { success: true };
}

// Customer: get product reviews (visible only)
export async function getProductReviews(productId: string) {
  const supabase = getServerClient();

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, profiles(name)')
    .eq('product_id', productId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return reviews || [];
}

// Customer: get user's review for a product (to check if they already reviewed)
export async function getUserReviewForProduct(productId: string) {
  const supabase = getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: review, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, order_item_id')
    .eq('product_id', productId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    return null;
  }

  return review;
}

// Customer: get completed order items for current user (to show eligible products for review)
export async function getCompletedOrderItems() {
  const supabase = getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'selesai');

  if (!orders || orders.length === 0) {
    return [];
  }

  const orderIds = orders.map((o) => o.id);

  const { data: orderItems } = await supabase
    .from('order_items')
    .select('id, product_id, name_snapshot, qty, products(name), reviews(id)')
    .in('order_id', orderIds);

  if (!orderItems) {
    return [];
  }

  return orderItems.map((item) => ({
    id: item.id,
    product_id: item.product_id,
    product_name: (item.products as any)?.[0]?.name || (item.products as any)?.name || item.name_snapshot,
    qty: item.qty,
    has_review: !!((item.reviews as any)?.[0]?.id || (item.reviews as any)?.id),
    review_id: (item.reviews as any)?.[0]?.id || (item.reviews as any)?.id || null,
  }));
}

// Admin: get all reviews with user and product info
export async function getAllReviewsAdmin() {
  const supabase = getAdminServerClient();

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, is_visible, created_at, updated_at, user_id, product_id, order_id, profiles(name), products(name)')
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message, reviews: [] };
  }

  return { reviews: reviews || [], error: null };
}

// Admin: toggle review visibility
export async function toggleReviewVisibility(id: string, isVisible: boolean) {
  const supabase = getAdminServerClient();

  const { error } = await supabase
    .from('reviews')
    .update({ is_visible: isVisible })
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/reviews');
  revalidatePath('/produk');
  return { success: true };
}

// Admin: delete review
export async function deleteReviewAdmin(id: string) {
  const supabase = getAdminServerClient();

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/reviews');
  return { success: true };
}

// Admin: get review stats for a product
export async function getProductReviewStats(productId: string) {
  const supabase = getAdminServerClient();

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId);

  if (error || !reviews || reviews.length === 0) {
    return { average: 0, total: 0, distribution: [0, 0, 0, 0, 0] };
  }

  const total = reviews.length;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const average = Math.round((sum / total) * 10) / 10;
  const distribution = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    distribution[r.rating - 1] += 1;
  });

  return { average, total, distribution };
}
