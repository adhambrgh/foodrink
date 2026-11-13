'use client';

import { useState, useEffect } from 'react';
import ReviewForm from '@/components/customer/review-form';
import type { Review } from '@/lib/types';

interface CreateReviewFormProps {
  productId: string;
  onSubmit: () => void;
}

export default function CreateReviewForm({ productId, onSubmit }: CreateReviewFormProps) {
  const [eligibleItems, setEligibleItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    async function checkEligibility() {
      const { getCompletedOrderItems } = await import('@/lib/supabase/reviews');
      const items = await getCompletedOrderItems();
      const unreviewed = items.filter((item) => item.product_id === productId && !item.has_review);
      setEligibleItems(unreviewed);
      if (unreviewed.length === 0 && items.some((item) => item.product_id === productId)) {
        setAlreadyReviewed(true);
      }
    }
    checkEligibility();
  }, [productId]);

  if (alreadyReviewed) {
    return null;
  }

  if (!showForm) {
    if (eligibleItems.length === 0) {
      return (
        <p className="text-sm text-text-muted text-center py-4">
          Belum ada review. Beli produk ini untuk menulis review.
        </p>
      );
    }
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full bg-primary/10 text-primary py-2.5 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
      >
        Tulis Review
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <ReviewForm
        productId={productId}
        orderItemId={eligibleItems[0]?.id || ''}
        mode="create"
        onSubmit={onSubmit}
        onCancel={() => setShowForm(false)}
      />
    </div>
  );
}