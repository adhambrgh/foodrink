'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { QrCode, Upload, CheckCircle2, AlertCircle, ImageIcon, Loader2 } from 'lucide-react';

interface OrderDetail {
  id: string;
  total: number;
  address: string;
  notes: string | null;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  qris_image_url: string | null;
  order_items: OrderItem[];
}

interface OrderItem {
  product_id: string;
  qty: number;
  price_snapshot: number;
  name_snapshot: string;
}

export default function UploadBuktiQrisPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' });
        const data = await res.json();

        if (res.ok && data.order) {
          setOrder(data.order);
          setLoading(false);
        } else {
          setError(data.error || 'Pesanan tidak ditemukan');
          setLoading(false);
        }
      } catch {
        setError('Gagal memuat data pesanan');
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!validTypes.includes(file.type)) {
      setError('Tipe file tidak didukung (JPG, PNG, WebP, HEIC)');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !order) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('orderId', orderId);
      formData.append('proof', selectedFile);

      const res = await fetch('/api/upload-bukti-qris', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.replace(`/checkout/success/${orderId}`);
      } else {
        setError(data.error || 'Gagal upload bukti pembayaran');
      }
    } catch {
      setError('Terjadi kesalahan saat upload');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <LoadingScreen />
      </div>
    );
  }

  if (error && !order) {
    return (
      <main className="flex min-h-screen flex-col bg-surface px-4 py-8">
        <div className="flex-1 flex items-center justify-center text-center">
          <div className="space-y-4 max-w-sm">
            <div className="w-24 h-24 mx-auto rounded-full bg-error/10 flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-error" />
            </div>
            <div>
              <h1 className="font-sans text-xl text-text mb-2">Gagal Memuat</h1>
              <p className="text-sm text-text-muted mb-6">{error}</p>
            </div>
            <a
              href="/pesanan"
              className="py-3 rounded-xl bg-primary text-white font-medium text-center hover:bg-primary-dark transition-colors block"
            >
              Pesanan Saya
            </a>
          </div>
        </div>
      </main>
    );
  }

  if (!order) return null;

  const formattedDate = new Date(order.created_at).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <main className="flex min-h-screen flex-col bg-surface px-4 pt-safe pb-28">
      <div className="flex-1 w-full max-w-md mx-auto py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-text">Upload Bukti Pembayaran</h1>
          <p className="text-sm text-text-muted mt-1">Scan QR DANA, bayar sesuai nominal, lalu upload screenshotnya</p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl border border-border p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-text">Total Bayar</span>
            <span className="text-2xl font-bold text-primary tabular-nums">{formatCurrency(order.total)}</span>
          </div>
          <div className="text-xs text-text-muted">
            Order: #{order.id.slice(0, 8)} • {formattedDate}
          </div>
        </div>

        {/* QR Code Section */}
        <div className="bg-white rounded-xl border border-border p-4 mb-6">
          <h3 className="font-medium text-text mb-3 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            QRIS DANA
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
            {order.qris_image_url ? (
              <img
                src={order.qris_image_url}
                alt="QRIS DANA"
                className="w-48 h-48 object-contain"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-text-muted">
                <p className="text-center">QRIS belum dikonfigurasi</p>
              </div>
            )}
            <p className="mt-3 text-sm text-text-muted text-center">
              Scan menggunakan aplikasi DANA
            </p>
          </div>
          <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20 text-sm">
            <p className="font-medium text-primary">Instruksi:</p>
            <ol className="list-decimal list-inside mt-1 space-y-1 text-text-muted text-xs">
              <li>Buka aplikasi DANA</li>
              <li>Pilih "Bayar" → Scan QR Code di atas</li>
              <li>Masukkan nominal: <strong className="text-text">{formatCurrency(order.total)}</strong></li>
              <li>Bayar & screenshot bukti transaksi</li>
              <li>Upload di bawah ini</li>
            </ol>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl border border-border p-4">
          <h3 className="font-medium text-text mb-3 flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Upload Bukti Pembayaran
          </h3>

          {previewUrl ? (
            <div className="space-y-3">
              <div className="relative aspect-square rounded-lg overflow-hidden border border-border bg-gray-50">
                <img
                  src={previewUrl}
                  alt="Preview bukti pembayaran"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  aria-label="Hapus gambar"
                >
                  <AlertCircle className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mengupload...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Konfirmasi & Lanjut ke Struk
                  </>
                )}
              </button>
            </div>
          ) : (
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="proof-upload"
              />
              <div className="aspect-square rounded-lg border-2 border-dashed border-border bg-gray-50 flex flex-col items-center justify-center p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors">
                <ImageIcon className="w-12 h-12 text-text-muted mb-2" />
                <p className="text-text-muted text-center">Klik atau drag untuk upload bukti pembayaran</p>
                <p className="text-xs text-text-muted mt-1">Max 5MB • JPG, PNG, WebP, HEIC</p>
              </div>
            </label>
          )}

          {error && (
            <p className="mt-3 text-sm text-error text-center">{error}</p>
          )}
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <a
            href="/pesanan"
            className="text-sm text-primary hover:underline"
          >
            ← Kembali ke Pesanan Saya
          </a>
        </div>
      </div>
    </main>
  );
}