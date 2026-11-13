'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/supabase/client';
import { AuthLayout, AuthButton, AuthLogo } from '@/components/auth';
import { cn } from '@/lib/utils';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/beranda';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const validateIdentifier = (value: string) => {
    if (!value.trim()) {
      return 'Email atau nomor HP wajib diisi';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(\+62|62|0)8\d{8,11}$/;
    if (!emailRegex.test(value.trim()) && !phoneRegex.test(value.trim().replace(/[\s\-()]/g, ''))) {
      return 'Format email atau nomor HP tidak valid';
    }
    return undefined;
  };

  const validatePassword = (value: string) => {
    if (!value) {
      return 'Kata sandi wajib diisi';
    }
    if (value.length < 6) {
      return 'Kata sandi minimal 6 karakter';
    }
    return undefined;
  };

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIdentifier(value);
    if (errors.identifier) {
      setErrors(prev => ({ ...prev, identifier: undefined }));
    }
  };

  const handleIdentifierBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const error = validateIdentifier(e.target.value);
    if (error) {
      setErrors(prev => ({ ...prev, identifier: error }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  const handlePasswordBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const error = validatePassword(e.target.value);
    if (error) {
      setErrors(prev => ({ ...prev, password: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const identifierError = validateIdentifier(identifier);
    const passwordError = validatePassword(password);

    if (identifierError || passwordError) {
      setErrors({ identifier: identifierError, password: passwordError });
      setLoading(false);
      return;
    }

    const { error } = await signIn(identifier.trim(), password);

    if (error) {
      const msg = error.message || '';
      if (msg.includes('Invalid login credentials') || msg.includes('Email not confirmed')) {
        setErrors({ identifier: 'Email/HP atau kata sandi salah' });
      } else {
        setErrors({ identifier: msg });
      }
    } else {
      router.push(decodeURIComponent(redirectTo));
      router.refresh();
    }

    setLoading(false);
  };

  const inputClasses = (error?: string) => cn(
    'w-full h-[52px] px-4 rounded-[14px] bg-field text-text text-base outline-none transition-colors',
    'placeholder:text-[#A3ACB6]',
    'focus:border-primary focus:bg-white',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    error ? 'border-2 border-error' : 'border-2 border-transparent'
  );

  const labelClasses = 'block text-sm font-semibold text-text mb-2';

  const errorId = (field: string) => `${field}-error`;

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
          <div className="w-full">
            <label htmlFor="identifier" className={labelClasses}>
              Email atau nomor HP
            </label>
            <input
              id="identifier"
              type="text"
              className={inputClasses(errors.identifier)}
              style={{ fontSize: '1rem !important', lineHeight: '1.5 !important' }}
              placeholder="contoh@gmail.com"
              value={identifier}
              onChange={handleIdentifierChange}
              onBlur={handleIdentifierBlur}
              autoComplete="username"
              required
              disabled={loading}
              aria-invalid={errors.identifier ? 'true' : 'false'}
              aria-describedby={errors.identifier ? errorId('identifier') : undefined}
            />
            {errors.identifier && (
              <p id={errorId('identifier')} className="mt-1.5 text-sm font-medium text-error" role="alert">
                {errors.identifier}
              </p>
            )}
          </div>

          <div className="w-full">
            <label htmlFor="password" className={labelClasses}>
              Kata sandi
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                className={cn(inputClasses(errors.password), 'pr-14')}
                style={{ fontSize: '1rem !important', lineHeight: '1.5 !important' }}
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={handlePasswordChange}
                onBlur={handlePasswordBlur}
                autoComplete="current-password"
                required
                disabled={loading}
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? errorId('password') : undefined}
              />
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onTouchStart={e => e.preventDefault()}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-lg text-primary hover:bg-primary/10 transition-colors"
                aria-label="Tampilkan kata sandi"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
            {errors.password && (
              <p id={errorId('password')} className="mt-1.5 text-sm font-medium text-error" role="alert">
                {errors.password}
              </p>
            )}
          </div>

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