'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Heart, ShoppingCart, ArrowLeft, Star } from 'lucide-react';
import QuantityStepper from '@/components/customer/quantity-stepper';
import ReviewList from '@/components/customer/review-list';
import StarRating from '@/components/customer/star-rating';
import LoadingSpinner from '@/components/ui/loading-spinner';

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [product, setProduct] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingStats, setRatingStats] = useState({ average: 0, total: 0, distribution: [0, 0, 0, 0, 0] });

  const fetchStats = async (prodId: string) => {
    const { getProductReviewStats } = await import('@/lib/supabase/reviews');
    const stats = await getProductReviewStats(prodId);
    setRatingStats(stats);
  };

  useEffect(() => {
    fetchStats(id);
  }, [id]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(name, icon)')
          .eq('id', id)
          .single();
        if (error) throw error;
        setProduct(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return <LoadingSpinner className="w-8 h-8" />;
  }
  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }
  if (!product) {
    return <div className="p-4 text-red-500">Produk tidak ditemukan</div>;
  }

  const avgRating = ratingStats.total > 0 ? ratingStats.average : 0;
  const ratingText = avgRating > 0
    ? `${avgRating.toFixed(1)} dari 5 bintang (${ratingStats.total} review)`
    : 'Belum ada review';

  const ratingColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500'];
  const starColors = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-lime-500', 'text-emerald-500'];

  return (
    <main className="flex flex-col min-h-screen bg-surface p-4 relative">
      {/* Hero image */}
      <div className="relative w-full h-64 rounded-lg overflow-hidden mb-4">
        <img src={product.image_url || `https://picsum.photos/400/300?random=${product.id}`} alt={product.name} className="w-full h-full object-cover" />
        <button
          onClick={() => router.back()}
          className="absolute top-2 left-2 bg-white/80 rounded-full p-2"
        >
          <ArrowLeft className="w-5 h-5 text-text" />
        </button>
        <button
          className="absolute top-2 right-2 bg-white/80 rounded-full p-2"
        >
          <Heart className="w-5 h-5 text-text" />
        </button>
      </div>

      {/* Info */}
      <h1 className="text-2xl font-bold text-text mb-2">{product.name}</h1>
      <p className="text-text-muted mb-4">{product.description}</p>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-primary font-semibold">Rp {product.price.toLocaleString('id-ID')}</span>
        <span className="text-text-muted">Stok: {product.stock}</span>
      </div>

      {/* Quantity */}
      <QuantityStepper value={qty} onChange={setQty} className="mb-4" />

      {/* Action bar */}
      <div className="fixed inset-x-0 bottom-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between">
        <div className="text-primary font-bold text-lg">Rp {(product.price * qty).toLocaleString('id-ID')}</div>
        <button
          onClick={() => {}}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <ShoppingCart className="w-5 h-5" />
          Tambah ke Keranjang
        </button>
      </div>

      {/* Reviews Section */}
      <div className="mt-8 pt-8 border-t border-border">
        <h2 className="text-xl font-bold text-text mb-4">Ulasan</h2>

        {/* Rating Summary */}
        <div className="bg-surface-card border border-border rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-text-muted">Rating Rata-Rata</span>
            <span className="text-2xl font-bold text-text">{avgRating > 0 ? avgRating.toFixed(1) : 'Belum ada rating'}</span>
          </div>
          <div className="mb-3">
            <StarRating rating={avgRating} size={28} onChange={(r) => {}} />
            <span className="text-sm text-text-muted">{ratingText}</span>
          </div>
          <div className="grid grid-cols-5 gap-2 text-center">
            {ratingStats.distribution.map((count, i) => (
              <div key={i} className="bg-surface-variant/50 rounded-lg p-2">
                <div className="w-full h-2 rounded-full mb-1" style={{ backgroundColor: ['#EF4444', '#F59E0B', '#EAB308', '#22C55E', '#10B9B5'][i] }} />
                <span className="text-xs text-text-muted">{i + 1}★</span>
                <span className="text-xs font-medium text-text">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <ReviewList productId={product.id} />
      </div>
    </main>
  );
}
