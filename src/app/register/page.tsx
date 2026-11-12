'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/supabase/client';
import { AuthLayout, AuthInput, AuthButton, AuthLogo } from '@/components/auth';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/beranda';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email wajib diisi');
      return;
    }

    if (password !== confirmPassword) {
      setError('Kata sandi tidak cocok');
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter');
      return;
    }

    setLoading(true);

    const { data, error } = await signUp(email.trim(), password, name, phone.trim() || undefined);

    setLoading(false);

    if (error) {
      const msg = error.message || '';
      if (msg.includes('User already registered')) {
        setError('Email sudah terdaftar. Silakan masuk.');
      } else if (msg.includes('Database error') && phone.trim()) {
        setError('Nomor HP sudah terdaftar di akun lain');
      } else {
        setError(msg);
      }
    } else if (data.session) {
      // Email confirmations disabled - user confirmed immediately
      router.push(decodeURIComponent(redirectTo));
      router.refresh();
    } else {
      // Fallback (shouldn't happen with confirmations off)
      router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <AuthLogo className="mt-2 mb-3" />

        <h1 className="text-center text-2xl font-bold text-text tracking-tight">Daftar</h1>

        <div className="text-center space-y-1">
          <h2 className="text-lg font-semibold text-text">Ayo Mulai</h2>
          <p className="text-sm text-text-muted">Buat akun baru</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <AuthInput
            label="Nama lengkap"
            placeholder="Contoh: Adham Baarigh"
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            autoComplete="name"
            required
            error={error}
            loading={loading}
          />

          <AuthInput
            label="Email"
            placeholder="contoh@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            error={error}
            loading={loading}
          />

          <AuthInput
            label="Nomor telepon (untuk login)"
            placeholder="+62 Masukkan nomor HP"
            helperText="Nomor ini bisa dipakai untuk login selain email"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            loading={loading}
          />

          <AuthInput
            label="Kata sandi"
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            required
            showPasswordToggle
            error={error}
            loading={loading}
          />

          <AuthInput
            label="Konfirmasi kata sandi"
            placeholder="Ulangi kata sandi"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            required
            showPasswordToggle
            error={error}
            loading={loading}
          />

          <AuthButton type="submit" loading={loading}>
            Daftar
          </AuthButton>
        </form>

        <p className="text-center text-sm text-text-muted">
          Sudah punya akun?{' '}
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-white">Memuat...</div>}>
      <RegisterForm />
    </Suspense>
  );
}