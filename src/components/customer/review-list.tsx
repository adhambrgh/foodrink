'use client';

import { useState, useEffect } from 'react';
import ReviewCard from '@/components/customer/review-card';
import ReviewForm from '@/components/customer/review-form';
import CreateReviewForm from '@/components/customer/create-review-form';
import type { Review } from '@/lib/types';

type ReviewListProps = {
  productId: string;
};

export default function ReviewList({ productId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  useEffect(() => {
    async function loadReviews() {
      setLoading(true);
      const { getProductReviews, getUserReviewForProduct } = await import('@/lib/supabase/reviews');
      const [productReviews, userReview] = await Promise.all([
        getProductReviews(productId),
        getUserReviewForProduct(productId),
      ]);
      setReviews(productReviews as any[]);
      if (userReview) {
        setEditingReview(userReview as any);
      }
      setLoading(false);
    }
    loadReviews();
  }, [productId]);

  const handleEdit = (review: Review) => {
    setEditingReview(review);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus review ini?')) return;
    const { deleteReview } = await import('@/lib/supabase/reviews');
    const res = await deleteReview(id);
    if (!res.error) {
      setReviews(reviews.filter((r) => r.id !== id));
      setEditingReview(null);
    }
  };

  const handleCreate = () => {
    // Reload reviews after creation
    window.location.reload();
  };

  const handleUpdate = () => {
    setEditingReview(null);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex min-h-[180px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-14 w-14 animate-pulse overflow-hidden rounded-full">
            <img src="/images/logo.jpeg" alt="Foodrink" className="h-full w-full object-cover" />
          </div>
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {editingReview ? (
        <ReviewForm
          productId={productId}
          orderItemId={editingReview.order_item_id}
          mode="edit"
          initialRating={editingReview.rating}
          initialComment={editingReview.comment || ''}
          onSubmit={handleUpdate}
          onCancel={() => setEditingReview(null)}
        />
      ) : (
        <CreateReviewForm productId={productId} onSubmit={handleCreate} />
      )}

      <div className="space-y-3">
        {reviews.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">Belum ada review untuk produk ini</p>
        ) : (
          reviews.map((review) => <ReviewCard key={review.id} review={review} onEdit={handleEdit} onDelete={handleDelete} />)
        )}
      </div>
    </div>
  );
}
