'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { AuthLayout, AuthInput, AuthButton, AuthLogo } from '@/components/auth';

function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/beranda';

  const [contact, setContact] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const isEmail = contact.includes('@');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!contact.trim()) {
      setError('Isi email atau nomor telepon');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: isEmail ? contact.trim() : undefined,
      phone: !isEmail ? contact.trim() : undefined,
    } as any);

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
      router.push(`/verify?type=recovery&contact=${encodeURIComponent(contact.trim())}&redirectTo=${encodeURIComponent(redirectTo)}`);
    }
  };

  const maskedContact = isEmail
    ? contact.replace(/(.{0,4})(.*)@/, '$1*****@')
    : '******' + contact.slice(-3);

  if (sent) {
    return (
      <AuthLayout>
        <div className="space-y-6">
          <AuthLogo className="mt-2 mb-3" />

          <h1 className="text-center text-2xl font-bold text-text tracking-tight">Cek Kode Verifikasi</h1>

          <div className="text-center space-y-1">
            <h2 className="text-lg font-semibold text-text">Kode telah dikirim</h2>
            <p className="text-sm text-text-muted">
              Kami telah mengirim kode verifikasi ke{' '}
              <span className="text-primary-dark font-semibold">
                {isEmail ? 'email' : 'nomor'}
              </span>{' '}
              <b className="text-primary-dark">{maskedContact}</b>.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-primary-soft text-primary-dark text-sm text-center">
            Anda akan diarahkan ke halaman verifikasi dalam beberapa detik...
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <AuthLogo className="mt-2 mb-3" />

        <h1 className="text-center text-2xl font-bold text-text tracking-tight">Lupa Kata Sandi</h1>

        <div className="text-center space-y-1">
          <h2 className="text-lg font-semibold text-text">Atur ulang kata sandi</h2>
          <p className="text-sm text-text-muted">Masukkan email atau nomor telepon Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <AuthInput
            label="Email atau nomor HP"
            placeholder="contoh@gmail.com atau +62 8xx xxx xxxx"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            type="text"
            autoComplete="username"
            required
            error={error}
            loading={loading}
          />

          <AuthButton type="submit" loading={loading}>
            Kirim Kode Verifikasi
          </AuthButton>
        </form>

        <p className="text-center text-sm text-text-muted">
          Ingat kata sandi?{' '}
          <Link
            href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}
            className="text-primary font-semibold hover:underline"
          >
            Masuk
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-white">Memuat...</div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}