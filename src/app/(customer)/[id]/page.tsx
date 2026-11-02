'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Heart, ShoppingCart, ArrowLeft } from 'lucide-react';
import QuantityStepper from '@/components/customer/quantity-stepper';

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  
  const [product, setProduct] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleAddToCart = () => {
    // placeholder - actual logic in Phase 3
    alert(`Tambah ${qty} ke keranjang`);
  };

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
    return <div className="p-4">Memuat...</div>;
  }
  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }
  if (!product) {
    return <div className="p-4 text-red-500">Produk tidak ditemukan</div>;
  }

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
          onClick={handleAddToCart}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <ShoppingCart className="w-5 h-5" />
          Tambah ke Keranjang
        </button>
      </div>
    </main>
  );
}
