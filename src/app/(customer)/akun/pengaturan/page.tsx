'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Phone, Bell, Lock, Trash2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function PengaturanPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    notify_order: true,
    notify_promo: true,
    notify_system: true,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) {
          setProfile(data);
          setFormData({
            name: data.name || '',
            phone: data.phone || '',
            notify_order: data.notify_order ?? true,
            notify_promo: data.notify_promo ?? true,
            notify_system: data.notify_system ?? true,
          });
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesi tidak ditemukan');

      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          notify_order: formData.notify_order,
          notify_promo: formData.notify_promo,
          notify_system: formData.notify_system,
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => ({ ...prev, name: formData.name.trim(), phone: formData.phone.trim() }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesi tidak ditemukan');

      // Soft delete: set deleted_at timestamp
      const { error } = await supabase
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      // Sign out
      await supabase.auth.signOut();
      router.push('/login?deleted=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus akun');
      setDeleting(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <main className="flex min-h-screen flex-col bg-surface px-4 pb-28 pt-safe pt-4">
      <header className="mb-5 flex items-center justify-between border-b border-black/5 pb-3">
        <Link href="/akun" prefetch={true} aria-label="Kembali ke akun" className="rounded-full p-2 text-text transition-colors hover:bg-surface-variant">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Foodrink</p>
          <h1 className="font-sans text-lg leading-tight text-text">Pengaturan</h1>
        </div>
        <div className="w-10" />
      </header>

      {success && (
        <div className="mb-4 rounded-lg bg-success/10 p-3 border border-success/20" role="alert">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Perubahan disimpan</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 border border-red-200" role="alert">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6" noValidate>
        {/* Informasi Akun */}
        <section aria-labelledby="account-heading" className="bg-white rounded-xl border border-border p-4 space-y-4">
          <h2 id="account-heading" className="text-lg font-semibold text-text flex items-center gap-2">
            <User className="w-5 h-5" />
            Informasi Akun
          </h2>

          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-text">
              Nama Lengkap
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Masukkan nama lengkap"
              autoComplete="name"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-text">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={profile?.email || ''}
              readOnly
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-muted"
              placeholder="Email tidak dapat diubah"
            />
            <p className="text-xs text-text-muted">Untuk mengubah email, silakan hubungi admin.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-text">
              Nomor Telepon
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Contoh: 081234567890"
              autoComplete="tel"
              disabled={saving}
            />
          </div>
        </section>

        {/* Preferensi Notifikasi */}
        <section aria-labelledby="notif-heading" className="bg-white rounded-xl border border-border p-4 space-y-4">
          <h2 id="notif-heading" className="text-lg font-semibold text-text flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Preferensi Notifikasi
          </h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <span role="img" aria-label="promo">🎉</span>
                </span>
                <div>
                  <p className="font-medium text-text">Promo & Diskon</p>
                  <p className="text-xs text-text-muted">Dapatkan info promo menarik</p>
                </div>
              </div>
              <input
                type="checkbox"
                name="notify_promo"
                checked={formData.notify_promo}
                onChange={handleChange}
                className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span role="img" aria-label="order">📦</span>
                </span>
                <div>
                  <p className="font-medium text-text">Pesanan</p>
                  <p className="text-xs text-text-muted">Update status pesanan Anda</p>
                </div>
              </div>
              <input
                type="checkbox"
                name="notify_order"
                checked={formData.notify_order}
                onChange={handleChange}
                className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <span role="img" aria-label="system">ℹ️</span>
                </span>
                <div>
                  <p className="font-medium text-text">Sistem</p>
                  <p className="text-xs text-text-muted">Pengumuman & info penting</p>
                </div>
              </div>
              <input
                type="checkbox"
                name="notify_system"
                checked={formData.notify_system}
                onChange={handleChange}
                className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
              />
            </label>
          </div>
        </section>

        {/* Keamanan */}
        <section aria-labelledby="security-heading" className="bg-white rounded-xl border border-border p-4 space-y-4">
          <h2 id="security-heading" className="text-lg font-semibold text-text flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Keamanan
          </h2>

          <div className="space-y-3">
            <Link
              href="/reset-password"
              className="flex items-center justify-between px-4 py-3 rounded-lg border border-border hover:bg-surface-variant transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-purple-600" />
                </span>
                <div>
                  <p className="font-medium text-text">Ubah Password</p>
                  <p className="text-xs text-text-muted">Perbarui kata sandi akun Anda</p>
                </div>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </span>
                <div>
                  <p className="font-medium text-red-700">Hapus Akun</p>
                  <p className="text-xs text-red-500">Nonaktifkan akun permanen</p>
                </div>
              </div>
              {deleting && <Loader2 className="h-5 w-5 animate-spin text-red-600" />}
            </button>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="w-full h-12 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(161,64,0,0.2)] transition-colors hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Menyimpan...
            </>
          ) : (
            'Simpan Perubahan'
          )}
        </button>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-white rounded-xl p-6 space-y-4">
            <div className="text-center">
              <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-text">Hapus Akun?</h3>
              <p className="text-sm text-text-muted mt-1">
                Tindakan ini akan menonaktifkan akun Anda. Data akan disimpan tapi Anda tidak bisa login.
                Apakah Anda yakin?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 h-10 rounded-lg border border-border bg-white text-text font-medium hover:bg-surface-variant transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 h-10 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Menghapus...' : 'Hapus Akun'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Link
          href="/akun"
          className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-border bg-white px-4 text-sm font-medium text-text hover:bg-surface-variant transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h14" />
          </svg>
          Kembali ke Akun
        </Link>
      </div>
    </main>
  );
}