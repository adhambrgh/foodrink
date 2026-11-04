'use client';

import StarRating from '@/components/customer/star-rating';
import type { Review } from '@/lib/types';

type ReviewCardProps = {
  review: Review;
  onEdit?: (review: Review) => void;
  onDelete?: (id: string) => void;
};

export default function ReviewCard({ review, onEdit, onDelete }: ReviewCardProps) {
  const date = new Date(review.created_at).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="bg-surface-card border border-border rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
            {(review.profiles?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-text">{review.profiles?.name || 'Pelanggan'}</p>
            <p className="text-xs text-text-muted">{date}</p>
          </div>
        </div>
        {onEdit && onDelete && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(review)}
              className="text-xs text-primary hover:underline px-2 py-1"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(review.id)}
              className="text-xs text-red-500 hover:underline px-2 py-1"
            >
              Hapus
            </button>
          </div>
        )}
      </div>

      <StarRating rating={review.rating} readonly size={16} />

      {review.comment && <p className="text-sm text-text leading-relaxed">{review.comment}</p>}
    </div>
  );
}
