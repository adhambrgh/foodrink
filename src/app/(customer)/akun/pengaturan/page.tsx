'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import LoadingScreen from '@/components/ui/LoadingScreen';

const BellIcon = ({ className = '' }: { className?: string }) => (
  <svg className={`w-5 h-5 text-amber-600 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const LockIcon = ({ className = '' }: { className?: string }) => (
  <svg className={`w-4 h-4 text-purple-600 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const TrashIcon = ({ className = '' }: { className?: string }) => (
  <svg className={`w-4 h-4 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const ChevronRightIcon = ({ className = '' }: { className?: string }) => (
  <svg className={`w-4 h-4 text-neutral-400 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const PromoIcon = ({ className = '' }: { className?: string }) => (
  <svg className={`w-4 h-4 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

const OrderIcon = ({ className = '' }: { className?: string }) => (
  <svg className={`w-4 h-4 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14a2 2 0 0 1 2 2v10" />
    <path d="M3 5v14a2 2 0 0 0 2 2h14" />
  </svg>
);

const SystemIcon = ({ className = '' }: { className?: string }) => (
  <svg className={`w-4 h-4 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

const CheckIcon = ({ className = '' }: { className?: string }) => (
  <svg className={`w-4 h-4 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertCircleIcon = ({ className = '' }: { className?: string }) => (
  <svg className={`w-6 h-6 text-red-600 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
);

const ArrowLeftIcon = ({ className = '' }: { className?: string }) => (
  <svg className={`h-5 w-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 19l-7-7m0 0l7-7m-7 7h14" />
  </svg>
);

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

      setProfile((prev: any) => ({ ...prev, name: formData.name.trim(), phone: formData.phone.trim() }));
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

      const { error } = await supabase
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

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
          <ArrowLeftIcon />
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Foodrink</p>
          <h1 className="font-semibold text-lg leading-tight text-text">Pengaturan</h1>
        </div>
        <div className="w-10" />
      </header>

      {success && (
        <div className="mb-5 rounded-xl bg-emerald-50/80 border border-emerald-200/60 p-3.5" role="alert">
          <div className="flex items-center gap-2.5 text-emerald-700">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span className=" text-sm font-medium">Perubahan disimpan</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl bg-red-50/80 border border-red-200/60 p-3.5" role="alert">
          <div className="flex items-center gap-2.5 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className=" text-sm">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-7" noValidate>
        {/* SECTION 1: Informasi Akun — Card standar, warm */}
        <section aria-labelledby="account-heading" className="bg-white/90 backdrop-blur-sm rounded-2xl border border-neutral-200/60 p-5 md:p-6 space-y-5">
          <h2 id="account-heading" className="font-semibold text-lg font-semibold text-text tracking-tight">
            Informasi Akun
          </h2>

          <div className="space-y-1.5">
            <label htmlFor="name" className="block  text-sm font-medium text-text mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm  focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Masukkan nama lengkap"
              autoComplete="name"
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5 pt-1">
            <label htmlFor="email" className="block  text-sm font-medium text-text mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={profile?.email || ''}
              readOnly
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm  text-text-muted focus:outline-none"
              placeholder="Email tidak dapat diubah"
            />
            <p className=" text-xs text-text-muted">Untuk mengubah email, silakan hubungi admin.</p>
          </div>

          <div className="space-y-1.5 pt-1">
            <label htmlFor="phone" className="block  text-sm font-medium text-text mb-1">
              Nomor Telepon
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm  focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Contoh: 081234567890"
              autoComplete="tel"
              disabled={saving}
            />
          </div>
        </section>

        {/* SECTION 2: Preferensi Notifikasi — Elevated, warm tint, NO border, noise overlay */}
        <section aria-labelledby="notif-heading" className="relative noise-overlay bg-amber-50/40 rounded-2xl p-5 md:p-6 space-y-4">
          <h2 id="notif-heading" className="font-semibold text-lg font-semibold text-text tracking-tight">
            <div className="inline-flex items-center gap-2">
              <BellIcon />
              Preferensi Notifikasi
            </div>
          </h2>

          <div className="space-y-3.5">
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-amber-100/80 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <PromoIcon />
                </span>
                <div>
                  <p className=" font-medium text-text">Promo & Diskon</p>
                  <p className=" text-xs text-text-muted">Dapatkan info promo menarik</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer" aria-label="Promo & Diskon">
                <input
                  type="checkbox"
                  name="notify_promo"
                  checked={formData.notify_promo}
                  onChange={handleChange}
                  data-toggle="true"
                  className="peer appearance-none h-6 w-11 rounded-full opacity-0 pointer-events-none absolute inset-0 z-10"
                />
                <span className="relative h-5 w-11 rounded-full bg-neutral-300 peer-checked:bg-amber-500 transition-colors duration-200" />
                <span className="absolute top-0.5 left-0.5 z-10 h-4 w-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-out peer-checked:translate-x-6 active:scale-95" />
              </label>
            </label>

            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-blue-100/80 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <OrderIcon />
                </span>
                <div>
                  <p className=" font-medium text-text">Pesanan</p>
                  <p className=" text-xs text-text-muted">Update status pesanan Anda</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer" aria-label="Pesanan">
                <input
                  type="checkbox"
                  name="notify_order"
                  checked={formData.notify_order}
                  onChange={handleChange}
                  data-toggle="true"
                  className="peer appearance-none h-6 w-11 rounded-full opacity-0 pointer-events-none absolute inset-0 z-10"
                />
                <span className="relative h-5 w-11 rounded-full bg-neutral-300 peer-checked:bg-blue-500 transition-colors duration-200" />
                <span className="absolute top-0.5 left-0.5 z-10 h-4 w-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-out peer-checked:translate-x-6 active:scale-95" />
              </label>
            </label>

            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-neutral-100/80 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <SystemIcon />
                </span>
                <div>
                  <p className=" font-medium text-text">Sistem</p>
                  <p className=" text-xs text-text-muted">Pengumuman & info penting</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer" aria-label="Sistem">
                <input
                  type="checkbox"
                  name="notify_system"
                  checked={formData.notify_system}
                  onChange={handleChange}
                  data-toggle="true"
                  className="peer appearance-none h-6 w-11 rounded-full opacity-0 pointer-events-none absolute inset-0 z-10"
                />
                <span className="relative h-5 w-11 rounded-full bg-neutral-300 peer-checked:bg-neutral-600 transition-colors duration-200" />
                <span className="absolute top-0.5 left-0.5 z-10 h-4 w-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-out peer-checked:translate-x-6 active:scale-95" />
              </label>
            </label>
          </div>
        </section>

        {/* SECTION 3: Keamanan — Minimal, no card, bordered list items */}
        <section aria-labelledby="security-heading" className="space-y-0 pt-1">
          <h2 id="security-heading" className="font-semibold text-lg font-semibold text-text tracking-tight mb-3.5">
            Keamanan
          </h2>
          <div className="bg-white/60 rounded-2xl border border-neutral-200/60 overflow-hidden">
            <Link
              href="/reset-password"
              className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-200/60 hover:bg-neutral-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                  <LockIcon />
                </span>
                <div>
                  <p className=" font-medium text-text">Ubah Password</p>
                  <p className=" text-xs text-text-muted">Perbarui kata sandi akun</p>
                </div>
              </div>
              <ChevronRightIcon />
            </Link>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-red-50/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                  <TrashIcon className="text-red-600" />
                </span>
                <div>
                  <p className=" font-medium text-red-700">Hapus Akun</p>
                  <p className=" text-xs text-red-500">Nonaktifkan permanen</p>
                </div>
              </div>
              {deleting && <Loader2 className="h-5 w-5 animate-spin text-red-600" />}
            </button>
          </div>
        </section>

        {/* Submit Button — Primary */}
        <button
          type="submit"
          disabled={saving}
          className="w-full h-12 rounded-xl bg-primary text-white  font-semibold text-sm shadow-[0_4px_14px_rgba(161,64,0,0.18)] transition-all hover:bg-primary-dark hover:shadow-[0_6px_20px_rgba(161,64,0,0.22)] active:scale-[0.98] active:shadow-[0_2px_8px_rgba(161,64,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[0_4px_14px_rgba(161,64,0,0.18)] disabled:hover:scale-100 flex items-center justify-center gap-2"
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

      {/* Delete Confirmation Modal — Humanized, asymmetric */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl border border-neutral-200 p-6 space-y-5">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <TrashIcon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-lg font-semibold text-text">Hapus Akun?</h3>
              <p className=" text-sm text-text-muted leading-relaxed">
                Akun akan dinonaktifkan permanen. Data tersimpan tapi tidak bisa login lagi.
                Yakin lanjutkan?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 h-10 rounded-xl border border-neutral-300 bg-white  font-medium text-text hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 h-10 rounded-xl bg-red-600 text-white  font-medium hover:bg-red-700 transition-colors disabled:opacity-50 relative overflow-hidden"
              >
                {deleting ? 'Menghapus...' : 'Hapus Akun'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}