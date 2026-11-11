'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/supabase/client';
import { AuthLayout, AuthInput, AuthButton, AuthLogo } from '@/components/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/beranda';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(identifier, password);

    if (error) {
      setError(error.message);
    } else {
      router.push(decodeURIComponent(redirectTo));
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <AuthLogo className="mt-2 mb-3" />

        <h1 className="text-center text-2xl font-bold text-text tracking-tight">Masuk</h1>

        <div className="text-center space-y-1">
          <h2 className="text-lg font-semibold text-text">Selamat datang kembali</h2>
          <p className="text-sm text-text-muted">Masuk ke akunmu untuk mulai memesan</p>
        </div>

        {searchParams.get('registered') && (
          <div className="p-3 rounded-lg bg-success-light text-success text-sm text-center">
            Akun berhasil didaftarkan. Silakan cek email Anda untuk konfirmasi, lalu login.
          </div>
        )}

        {searchParams.get('deleted') && (
          <div className="p-3 rounded-lg bg-error/10 text-error text-sm text-center">
            Akun Anda telah dinonaktifkan. Hubungi admin jika ingin mengaktifkan kembali.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <AuthInput
            label="Email atau nomor HP"
            placeholder="contoh@gmail.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            type="text"
            autoComplete="username"
            required
            error={error}
            loading={loading}
          />

          <AuthInput
            label="Kata sandi"
            placeholder="Masukkan kata sandi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
            showPasswordToggle
            error={error}
            loading={loading}
          />

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-text hover:underline"
            >
              Lupa kata sandi?
            </Link>
          </div>

          <AuthButton type="submit" loading={loading}>
            Masuk
          </AuthButton>
        </form>

        <p className="text-center text-sm text-text-muted">
          Belum punya akun?{' '}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-white">Memuat...</div>}>
      <LoginForm />
    </Suspense>
  );
}