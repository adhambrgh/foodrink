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

  const hasContact = email.trim() || phone.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasContact) {
      setError('Isi email atau nomor telepon');
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

    const contact = email.trim() ? email.trim() : phone.trim();

    const { error } = await signUp(contact, password, name);

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.push(`/verify?type=signup&contact=${encodeURIComponent(contact)}&redirectTo=${encodeURIComponent(redirectTo)}`);
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

          <div className="flex items-center gap-4 my-2">
            <div className="flex-1 h-px bg-line" />
            <span className="text-xs text-text-muted whitespace-nowrap">atau</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          <AuthInput
            label="Nomor telepon"
            placeholder="+62 Masukkan nomor HP"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            error={error}
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