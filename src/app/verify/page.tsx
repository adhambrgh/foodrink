'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { AuthLayout, AuthButton, OtpInput, AuthLogo } from '@/components/auth';

const DURATION = 300; // 5 minutes in seconds

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const type = searchParams.get('type') || 'signup';
  const contact = searchParams.get('contact') || '';
  const redirectTo = searchParams.get('redirectTo') || '/beranda';

  const [otp, setOtp] = useState('');
  const [remaining, setRemaining] = useState(DURATION);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEmail = contact.includes('@');
  const maskedContact = isEmail
    ? contact.replace(/(.{0,4})(.*)@/, '$1*****@')
    : '******' + contact.slice(-3);

  const startTimer = useCallback(() => {
    setRemaining(DURATION);
  }, []);

  useEffect(() => {
    startTimer();
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [startTimer]);

  const handleVerify = async () => {
    if (otp.length < 4) return;

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.verifyOtp({
      email: isEmail ? contact : undefined,
      phone: !isEmail ? contact : undefined,
      token: otp,
      type: type === 'signup' ? 'signup' : 'recovery',
    } as any);

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.push(decodeURIComponent(redirectTo));
      router.refresh();
    }
  };

  const handleResend = async () => {
    if (remaining > 0 || resending) return;

    setResending(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: isEmail ? contact : undefined,
      phone: !isEmail ? contact : undefined,
    } as any);

    setResending(false);

    if (error) {
      setError(error.message);
    } else {
      startTimer();
      setOtp('');
    }
  };

  const formatTime = (seconds: number) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href={type === 'signup' ? '/register' : '/forgot-password'}
            className="p-2 rounded-lg text-text hover:bg-surface-variant transition-colors"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-base font-medium text-text">Verifikasi</span>
          <div className="w-10" />
        </div>

        <AuthLogo className="mt-2 mb-3" />

        <h1 className="text-center text-2xl font-bold text-text tracking-tight leading-tight">
          Masukkan<br />
          <span className="text-primary">Kode Verifikasi</span>
        </h1>

        <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="space-y-5">
          <OtpInput
            length={4}
            value={otp}
            onChange={setOtp}
            onComplete={handleVerify}
            autoFocus
            disabled={loading}
          />

          <p className="text-center text-lg font-semibold text-primary tabular-nums">
            {formatTime(remaining)}
          </p>

          <p className="text-center text-sm font-medium text-text leading-relaxed">
            Kami mengirim kode verifikasi ke{' '}
            <span className="text-primary-dark font-semibold">
              {isEmail ? 'email' : 'nomor'}
            </span>{' '}
            <b className="text-primary-dark">{maskedContact}</b>.
            Silakan cek kotak masukmu.
          </p>

          <button
            type="button"
            onClick={handleResend}
            disabled={remaining > 0 || resending}
            className="w-full text-sm text-primary-dark font-medium underline hover:no-underline disabled:opacity-50 disabled:cursor-not-allowed"
            aria-disabled={remaining > 0 || resending}
          >
            {resending ? 'Mengirim ulang...' : 'Saya belum menerima kode? Kirim ulang'}
          </button>

          {error && (
            <div className="p-3 rounded-lg bg-error/10 text-error text-sm text-center" role="alert">
              {error}
            </div>
          )}

          <AuthButton type="submit" loading={loading} disabled={otp.length < 4}>
            Verifikasi
          </AuthButton>
        </form>
      </div>
    </AuthLayout>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-white">Memuat...</div>}>
      <VerifyForm />
    </Suspense>
  );
}