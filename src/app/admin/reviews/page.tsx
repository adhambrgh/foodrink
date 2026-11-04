import { Eye, EyeOff, Trash2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { getAllReviewsAdmin, toggleReviewVisibility, deleteReviewAdmin } from '@/lib/supabase/reviews';

export default async function AdminReviewsPage() {
  const { reviews, error } = await getAllReviewsAdmin();

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text font-heading">Kelola Review</h1>
        <p className="text-sm text-text-muted mt-0.5">Moderasi review pelanggan</p>
      </div>

      {error ? (
        <div className="p-4 rounded-xl border border-error/20 bg-error/5 text-sm text-error">
          Gagal memuat review: {error}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 bg-surface-card border border-border rounded-xl">
          <MessageSquare className="w-12 h-12 text-text-muted/30 mx-auto mb-3" />
          <p className="text-text-muted text-sm">Belum ada review</p>
        </div>
      ) : (
        <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted border-b border-border bg-surface-variant/40">
                  <th className="px-4 py-3 font-medium">Pelanggan</th>
                  <th className="px-4 py-3 font-medium">Produk</th>
                  <th className="px-4 py-3 font-medium text-center">Rating</th>
                  <th className="px-4 py-3 font-medium">Komentar</th>
                  <th className="px-4 py-3 font-medium text-center">Status</th>
                  <th className="px-4 py-3 font-medium text-center">Tanggal</th>
                  <th className="px-4 py-3 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review: any) => (
                  <tr key={review.id} className="border-b border-border/50 last:border-0 hover:bg-surface-variant/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-text">{review.profiles?.name || '-'}</div>
                      <div className="text-xs text-text-muted">ID: {review.user_id.slice(0, 8)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-text">{review.products?.name || '-'}</div>
                      <Link href={`/produk/${review.product_id}`} className="text-xs text-primary hover:underline">
                        Lihat produk →
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-semibold text-amber-600">{review.rating}</span>
                        <span className="text-amber-500">★</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-xs truncate text-text-muted">{review.comment || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          review.is_visible ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted'
                        }`}
                      >
                        {review.is_visible ? 'Tampil' : 'Tersembunyi'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-text-muted whitespace-nowrap">
                      {new Date(review.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <form action={async () => {
                          'use server';
                          await toggleReviewVisibility(review.id, !review.is_visible);
                        }}>
                          <button
                            type="submit"
                            className="p-1.5 text-text-muted hover:text-primary rounded-lg hover:bg-surface-variant transition-colors"
                            title={review.is_visible ? 'Sembunyikan' : 'Tampilkan'}
                          >
                            {review.is_visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </form>
                        <form action={async () => {
                          'use server';
                          await deleteReviewAdmin(review.id);
                        }}>
                          <button
                            type="submit"
                            className="p-1.5 text-text-muted hover:text-error rounded-lg hover:bg-surface-variant transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reviews.length > 0 && (
        <p className="text-xs text-text-muted">{reviews.length} review</p>
      )}
    </div>
  );
}
