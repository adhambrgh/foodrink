'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function ProfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    grade: '',
    major: '',
    room: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
            grade: data.grade || '',
            major: data.major || '',
            room: data.room || '',
          });
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Nama wajib diisi';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nama minimal 2 karakter';
    }
    if (formData.phone && !/^[0-9+\-\s()]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Format nomor telepon tidak valid';
    }
    if (!formData.grade.trim()) {
      newErrors.grade = 'Tingkat wajib dipilih';
    }
    if (!formData.major.trim()) {
      newErrors.major = 'Jurusan wajib dipilih';
    }
    if (!formData.room.trim()) {
      newErrors.room = 'Ruangan wajib diisi';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Sesi login tidak ditemukan');
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          grade: formData.grade.trim() || null,
          major: formData.major.trim() || null,
          room: formData.room.trim() || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        router.push('/akun');
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface p-4">
        <LoadingScreen />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">Gagal memuat profil</p>
          <Link href="/akun" className="text-primary hover:underline">
            Kembali ke Akun
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-surface px-4 pb-28 pt-safe pt-4">
      <header className="mb-5 flex items-center justify-between border-b border-black/5 pb-3">
        <Link href="/akun" prefetch={true} aria-label="Kembali ke akun" className="rounded-full p-2 text-text transition-colors hover:bg-surface-variant">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h14" />
          </svg>
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Foodrink</p>
          <h1 className="font-sans text-lg leading-tight text-text">Edit Profil</h1>
        </div>
        <div className="w-10" />
      </header>

      {success && (
        <div className="mb-4 rounded-lg bg-success/10 p-3 border border-success/20" role="alert">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Profil berhasil diperbarui</span>
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

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <section aria-labelledby="profile-heading" className="bg-white rounded-xl border border-border p-4 space-y-4">
          <h2 id="profile-heading" className="text-lg font-semibold text-text">Informasi Pribadi</h2>

          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-text">
              Nama Lengkap <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full rounded-lg border bg-white px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.name ? 'border-red-500 focus:ring-red-500/20' : 'border-border focus:ring-primary/20'
              }`}
              placeholder="Masukkan nama lengkap"
              autoComplete="name"
              inputMode="text"
              autoCapitalize="words"
              aria-invalid={errors.name ? 'true' : 'false'}
              aria-describedby={errors.name ? 'name-error' : undefined}
              disabled={saving}
            />
            {errors.name && (
              <p id="name-error" className="text-xs text-red-500" role="alert">{errors.name}</p>
            )}
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
              className={`w-full rounded-lg border bg-white px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.phone ? 'border-red-500 focus:ring-red-500/20' : 'border-border focus:ring-primary/20'
              }`}
              placeholder="Contoh: 081234567890"
              autoComplete="tel"
              inputMode="tel"
              aria-invalid={errors.phone ? 'true' : 'false'}
              aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'}
              disabled={saving}
            />
            <p id="phone-hint" className="text-xs text-text-muted">
              Format: 08xxxxxxxxxx atau +628xxxxxxxxxx
            </p>
            {errors.phone && (
              <p id="phone-error" className="text-xs text-red-500" role="alert">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="grade" className="block text-sm font-medium text-text">
              Tingkat <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              id="grade"
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              className={`w-full rounded-lg border bg-white px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.grade ? 'border-red-500 focus:ring-red-500/20' : 'border-border focus:ring-primary/20'
              }`}
              autoComplete="off"
              disabled={saving}
              aria-invalid={errors.grade ? 'true' : 'false'}
              aria-describedby={errors.grade ? 'grade-error' : undefined}
            >
              <option value="">Pilih tingkat</option>
              <option value="10">10</option>
              <option value="11">11</option>
              <option value="12">12</option>
            </select>
            {errors.grade && (
              <p id="grade-error" className="text-xs text-red-500" role="alert">{errors.grade}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="major" className="block text-sm font-medium text-text">
              Jurusan <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              id="major"
              name="major"
              value={formData.major}
              onChange={handleChange}
              className={`w-full rounded-lg border bg-white px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.major ? 'border-red-500 focus:ring-red-500/20' : 'border-border focus:ring-primary/20'
              }`}
              autoComplete="off"
              disabled={saving}
              aria-invalid={errors.major ? 'true' : 'false'}
              aria-describedby={errors.major ? 'major-error' : undefined}
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
            {errors.major && (
              <p id="major-error" className="text-xs text-red-500" role="alert">{errors.major}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="room" className="block text-sm font-medium text-text">
              Ruangan <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              type="text"
              id="room"
              name="room"
              value={formData.room}
              onChange={handleChange}
              className={`w-full rounded-lg border bg-white px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.room ? 'border-red-500 focus:ring-red-500/20' : 'border-border focus:ring-primary/20'
              }`}
              placeholder="Contoh: 2"
              autoComplete="off"
              disabled={saving}
              aria-invalid={errors.room ? 'true' : 'false'}
              aria-describedby={errors.room ? 'room-error' : undefined}
            />
            {errors.room && (
              <p id="room-error" className="text-xs text-red-500" role="alert">{errors.room}</p>
            )}
          </div>
        </section>

        <section aria-labelledby="email-heading" className="bg-white rounded-xl border border-border p-4 space-y-4">
          <h2 id="email-heading" className="text-lg font-semibold text-text">Email</h2>
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
              disabled
            />
            <p className="text-xs text-text-muted">
              Email digunakan untuk login dan notifikasi. Untuk mengubah email, silakan hubungi admin.
            </p>
          </div>
        </section>

        <section aria-labelledby="security-heading" className="bg-white rounded-xl border border-border p-4">
          <h2 id="security-heading" className="text-lg font-semibold text-text">Keamanan</h2>
          <Link
            href="/akun/metode-pembayaran"
            className="flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 17h4v-4" />
                </svg>
              </div>
              <span className="text-text">Metode Pembayaran</span>
            </div>
          </Link>
        </section>

        <div className="pt-4 border-t border-border">
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
        </div>
      </form>

      <div className="mt-6">
        <Link
          href="/akun"
          className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-border bg-white px-4 text-sm font-medium text-text hover:bg-surface-variant transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h14" />
          </svg>
          Batal
        </Link>
      </div>
    </main>
  );
}