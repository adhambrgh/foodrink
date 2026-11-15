'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { QrCode, Upload, CheckCircle2, AlertCircle, ImageIcon, Loader2, XCircle, Trash2 } from 'lucide-react';

interface OrderDetail {
  id: string;
  total: number;
  address: string;
  notes: string | null;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  qris_proof_url: string | null;
  order_items: OrderItem[];
}

interface OrderItem {
  product_id: string;
  qty: number;
  price_snapshot: number;
  name_snapshot: string;
}

type UploadStep = 'upload' | 'confirm' | 'success';

export default function UploadBuktiQrisPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [step, setStep] = useState<UploadStep | string>('upload');
  const [qrisImageUrl, setQrisImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' });
        const data = await res.json();

        if (res.ok && data.order) {
          const fetchedOrder = data.order;
          setOrder(fetchedOrder);
          setLoading(false);

          // Determine step based on order state
          if (fetchedOrder.payment_status === 'paid') {
            setStep('success');
          } else if (fetchedOrder.qris_proof_url) {
            setStep('confirm');
          }
        } else {
          setError(data.error || 'Pesanan tidak ditemukan');
          setLoading(false);
        }
      } catch {
        setError('Gagal memuat data pesanan');
        setLoading(false);
      }
    };

    const fetchQris = async () => {
      try {
        const res = await fetch('/api/qris/current', { cache: 'no-store' });
        const data = await res.json();
        if (res.ok && data.url) {
          setQrisImageUrl(data.url);
        }
      } catch {
        // Silent fail - QRIS optional
      }
    };

    fetchOrder();
    fetchQris();
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
        // Update local order state
        setOrder(prev => prev ? { ...prev, qris_proof_url: data.proof_url, payment_status: 'awaiting_confirmation' } : null);
        setStep('confirm');
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        setError(data.error || 'Gagal upload bukti pembayaran');
      }
    } catch {
      setError('Terjadi kesalahan saat upload');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!order) return;

    setConfirming(true);
    setError(null);

    try {
      const res = await fetch('/api/confirm-qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStep('success');
        router.replace(`/checkout/success/${orderId}`);
      } else {
        setError(data.error || 'Gagal konfirmasi pembayaran');
      }
    } catch {
      setError('Terjadi kesalahan saat konfirmasi');
    } finally {
      setConfirming(false);
    }
  };

  const handleChangeProof = () => {
    setStep('upload');
    setOrder(prev => prev ? { ...prev, qris_proof_url: null, payment_status: 'pending' } : null);
  };

  const handleCancel = async () => {
    if (!order) return;

    const confirmCancel = window.confirm('Yakin ingin membatalkan pesanan ini? Pembayaran yang sudah dilakukan tidak bisa dikembalikan otomatis.');
    if (!confirmCancel) return;

    setCancelling(true);
    setError(null);

    try {
      const res = await fetch('/api/cancel-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.replace('/pesanan');
      } else {
        setError(data.error || 'Gagal membatalkan pesanan');
      }
    } catch {
      setError('Terjadi kesalahan saat membatalkan');
    } finally {
      setCancelling(false);
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

  const isPaid = order.payment_status === 'paid';
  const hasProof = !!order.qris_proof_url;

  return (
    <main className="flex min-h-screen flex-col bg-surface px-4 pt-safe pb-28">
      <div id="receipt-content" className="flex-1 w-full max-w-md mx-auto py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-text">
            {isPaid ? 'Pembayaran Berhasil' : hasProof ? 'Konfirmasi Pembayaran' : 'Upload Bukti Pembayaran'}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {isPaid ? 'Pesanan Anda telah dikonfirmasi dan akan segera diproses.'
              : hasProof ? 'Bukti pembayaran telah diupload. Tekan tombol konfirmasi untuk menyelesaikan.'
              : 'Scan QR DANA, bayar sesuai nominal, lalu upload screenshotnya'}
          </p>
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
        {!isPaid && (
          <div className="bg-white rounded-xl border border-border p-4 mb-6">
            <h3 className="font-medium text-text mb-3 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              QRIS
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
              {qrisImageUrl ? (
                <img
                  src={qrisImageUrl}
                  alt="QRIS"
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
                {isPaid || hasProof ? <li>Upload bukti & konfirmasi pembayaran</li> : <li>Upload di bawah ini</li>}
              </ol>
            </div>
          </div>
        )}

        {/* Upload / Confirm Section */}
        <div className="bg-white rounded-xl border border-border p-4">
          {isPaid ? (
            // Success state
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </div>
              <h3 className="text-lg font-bold text-text mb-2">Pembayaran Berhasil Dikonfirmasi</h3>
              <p className="text-sm text-text-muted mb-6">Pesanan akan segera diproses oleh admin.</p>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="/pesanan"
                  className="py-3 rounded-xl bg-primary text-white font-medium text-center hover:bg-primary-dark transition-colors"
                >
                  Lihat Pesanan
                </a>
                <a
                  href="/produk"
                  className="py-3 rounded-xl bg-surface-variant text-text font-medium text-center hover:bg-surface-hover transition-colors"
                >
                  Belanja Lagi
                </a>
              </div>
            </div>
          ) : (step === 'confirm' || hasProof) ? (
            // Confirmation step
            <div className="space-y-4">
              <h3 className="font-medium text-text mb-3 flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Bukti Pembayaran
              </h3>

              <div className="relative aspect-square rounded-lg overflow-hidden border border-border bg-gray-50">
                {order.qris_proof_url && (
                  <img
                    src={order.qris_proof_url}
                    alt="Bukti pembayaran"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-sm text-yellow-800">
                <p className="font-medium flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Menunggu Konfirmasi
                </p>
                <p className="mt-1">Tekan tombol di bawah setelah yakin pembayaran sudah berhasil untuk menyelesaikan order.</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleChangeProof}
                  className="flex-1 py-3 rounded-lg border border-border bg-white text-text font-medium hover:bg-surface-variant transition-colors"
                >
                  Ganti Bukti
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 py-3 rounded-lg border border-error bg-white text-error font-medium hover:bg-error/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Membatalkan...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Batalkan Pesanan
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="flex-1 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {confirming ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengkonfirmasi...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Konfirmasi Pembayaran
                    </>
                  )}
                </button>
              </div>

              {error && (
                <p className="text-sm text-error text-center">{error}</p>
              )}
            </div>
          ) : (
            // Upload step
            <div className="space-y-3">
              <h3 className="font-medium text-text mb-3 flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Upload Bukti Pembayaran
              </h3>

              {selectedFile && previewUrl ? (
                // Preview selected file
                <div className="space-y-3">
                  <div className="aspect-square rounded-lg overflow-hidden border border-border bg-gray-50 relative">
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
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                      aria-label="Hapus file"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-text-muted text-center">File dipilih: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                </div>
              ) : (
                // Upload drop zone
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

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 py-3 rounded-lg border border-error bg-white text-error font-medium hover:bg-error/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Membatalkan...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Batalkan Pesanan
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                  className="flex-1 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Upload & Lanjut ke Konfirmasi
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
        {/* Back Link */}
        <div className="mt-6 text-center">
          <a
            href="/checkout"
            className="text-sm text-primary hover:underline"
          >
            ← Kembali ke Checkout
          </a>
        </div>
      </div>
    </main>
  );
}