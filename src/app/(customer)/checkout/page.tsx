'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, MapPin, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import LoadingScreen from '@/components/ui/LoadingScreen';

interface CheckoutFormData {
  delivery_method: 'antar_ke_kelas' | 'ambil_sendiri';
  recipient_name: string;
  grade: string;
  major: string;
  room: string;
  notes: string;
  payment_method: 'qris' | 'cod';
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, loading: cartLoading, selectedCartIds } = useCart();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [formData, setFormData] = useState<CheckoutFormData>({
    delivery_method: 'ambil_sendiri',
    recipient_name: '',
    grade: '',
    major: '',
    room: '',
    notes: '',
    payment_method: 'qris',
  });

  const filteredItems = items.filter(item => selectedCartIds.includes(item.cart_id));
  const subtotal = filteredItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const total = subtotal; // Delivery optional later

  // Fetch user profile for pre-fill
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('name, grade, major, room')
          .eq('id', user.id)
          .single();
        if (data) {
          setFormData(prev => ({
            ...prev,
            recipient_name: data.name || '',
            grade: data.grade || '',
            major: data.major || '',
            room: data.room || '',
          }));
        }
      }
      setLoadingProfile(false);
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (cartLoading || items.length === 0) {
      router.replace('/keranjang');
    }
  }, [cartLoading, items, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Create order in database
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        items: filteredItems.map(i => ({ product_id: i.product_id, qty: i.qty })),
        address: formData.delivery_method === 'antar_ke_kelas'
          ? `${formData.recipient_name} - Kelas ${formData.grade} ${formData.major} - Ruangan ${formData.room}`
          : 'Ambil sendiri',
        notes: formData.notes,
        payment_method: formData.payment_method,
      }),
    });

    const data = await res.json();

    if (data.success) {
      window.location.href = data.redirect_url;
    } else {
      alert(data.error || 'Gagal memproses order');
    }
    setLoading(false);
  };

  if (cartLoading || items.length === 0) {
    return <div className="min-h-screen bg-surface flex items-center justify-center"><LoadingScreen /></div>;
  }

  if (loadingProfile) {
    return <div className="min-h-screen bg-surface flex items-center justify-center"><LoadingScreen /></div>;
  }

  const isPrefilled = (field: keyof CheckoutFormData) => 
    ['recipient_name', 'grade', 'major', 'room'].includes(field) && formData[field].trim() !== '';

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          <Link href="/keranjang" prefetch={true} className="p-2 rounded-lg hover:bg-surface-variant">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-text">Checkout</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <main className="flex-1 p-4 space-y-6">
          {/* Delivery Selection */}
          <div className="bg-white rounded-lg p-4 border border-border">
            <h2 className="text-lg font-semibold text-text mb-3">Pilih Pengiriman</h2>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-surface-variant cursor-pointer">
                <input
                  type="radio"
                  name="delivery_method"
                  value="antar_ke_kelas"
                  checked={formData.delivery_method === 'antar_ke_kelas'}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary"
                />
                <div className="flex-1">
                  <span className="font-medium text-text">Antar ke kelas</span>
                  <p className="text-sm text-text-muted">Dikirim ke lokasi sekolah</p>
                </div>
                <MapPin className="w-5 h-5 text-text-muted" />
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-surface-variant cursor-pointer">
                <input
                  type="radio"
                  name="delivery_method"
                  value="ambil_sendiri"
                  checked={formData.delivery_method === 'ambil_sendiri'}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary"
                />
                <div className="flex-1">
                  <span className="font-medium text-text">Ambil sendiri</span>
                  <p className="text-sm text-text-muted">Ambil langsung di gerai FoodDrink</p>
                </div>
                <Send className="w-5 h-5 text-text-muted" />
              </label>
            </div>

            {/* Classroom Details */}
            {formData.delivery_method === 'antar_ke_kelas' && (
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="recipient_name" className="flex items-center justify-between text-sm font-medium text-text mb-2">
                    <span>Nama *</span>
                    {isPrefilled('recipient_name') && (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 className="w-3 h-3" />
                        Diisi dari profil
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    id="recipient_name"
                    name="recipient_name"
                    value={formData.recipient_name}
                    onChange={handleChange}
                    required
                    placeholder="Contoh: Budi"
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>
                <div>
                  <label htmlFor="grade" className="flex items-center justify-between text-sm font-medium text-text mb-2">
                    <span>Tingkat *</span>
                    {isPrefilled('grade') && (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 className="w-3 h-3" />
                        Diisi dari profil
                      </span>
                    )}
                  </label>
                  <select
                    id="grade"
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  >
                    <option value="">Pilih tingkat</option>
                    <option value="10">10</option>
                    <option value="11">11</option>
                    <option value="12">12</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="major" className="flex items-center justify-between text-sm font-medium text-text mb-2">
                    <span>Jurusan *</span>
                    {isPrefilled('major') && (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 className="w-3 h-3" />
                        Diisi dari profil
                      </span>
                    )}
                  </label>
                  <select
                    id="major"
                    name="major"
                    value={formData.major}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  >
                    <option value="">Pilih jurusan</option>
                    <option value="Teknik Grafika (Desain)">Teknik Grafika (Desain)</option>
                    <option value="Teknik Grafika (Produksi)">Teknik Grafika (Produksi)</option>
                    <option value="RPL">RPL</option>
                    <option value="TL">TL</option>
                    <option value="PH">PH</option>
                    <option value="ANIM">ANIM</option>
                    <option value="DKV">DKV</option>
                    <option value="MEKA">MEKA</option>
                    <option value="TKJ">TKJ</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="room" className="flex items-center justify-between text-sm font-medium text-text mb-2">
                    <span>Ruangan *</span>
                    {isPrefilled('room') && (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 className="w-3 h-3" />
                        Diisi dari profil
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    id="room"
                    name="room"
                    value={formData.room}
                    onChange={handleChange}
                    required
                    placeholder="Contoh: 2"
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg p-4 border border-border">
            <h2 className="text-lg font-semibold text-text mb-3">Ringkasan Pesanan</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-muted">Subtotal</span>
                <span className="text-text">{formatCurrency(subtotal)}</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg p-4 border border-border">
            <h2 className="text-lg font-semibold text-text mb-3">Metode Pembayaran</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-surface-variant cursor-pointer">
                <input
                  type="radio"
                  name="payment_method"
                  value="qris"
                  checked={formData.payment_method === 'qris'}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary"
                />
                <div>
                  <span className="font-medium text-text">QRIS DANA</span>
                  <p className="text-sm text-text-muted">Scan QR DANA, bayar, lalu upload bukti pembayaran</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-surface-variant cursor-pointer">
                <input
                  type="radio"
                  name="payment_method"
                  value="cod"
                  checked={formData.payment_method === 'cod'}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary"
                />
                <div>
                  <span className="font-medium text-text">Bayar saat diantar (COD)</span>
                  <p className="text-sm text-text-muted">Bayar langsung ketika pesanan diterima</p>
                </div>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg p-4 border border-border">
            <label htmlFor="notes" className="block text-sm font-medium text-text mb-2">
              Catatan (opsional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Pesan khusus untuk penjual..."
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25 text-sm resize-y"
            />
          </div>
        </main>

        {/* Pay Button */}
        <div className="bg-white p-4 border-t border-border">
          <button
            type="submit"
            disabled={loading || (formData.delivery_method === 'antar_ke_kelas' && (!formData.recipient_name.trim() || !formData.grade || !formData.major || !formData.room))}
            className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Memproses...' : 'Bayar Sekarang'}
          </button>
        </div>
      </form>
    </div>
  );
}