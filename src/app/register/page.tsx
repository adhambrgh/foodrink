'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/supabase/client';
import { AuthLayout, AuthButton, AuthLogo } from '@/components/auth';
import { cn } from '@/lib/utils';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/beranda';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const normalizePhone = (input: string) => {
    const v = input.replace(/[\s\-()]/g, '');
    if (!v) return null;
    if (v.startsWith('+')) return v;
    if (v.startsWith('0')) return '+62' + v.slice(1);
    if (v.startsWith('62')) return '+' + v;
    return v;
  };

  const validateName = (value: string) => {
    if (!value.trim()) {
      return 'Nama lengkap wajib diisi';
    }
    if (value.trim().length < 2) {
      return 'Nama minimal 2 karakter';
    }
    return undefined;
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      return 'Email wajib diisi';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      return 'Format email tidak valid';
    }
    return undefined;
  };

  const validatePhone = (value: string) => {
    if (!value.trim()) return undefined;
    const normalized = normalizePhone(value);
    const phoneRegex = /^\+628\d{8,11}$/;
    if (!phoneRegex.test(normalized || '')) {
      return 'Format nomor HP tidak valid (contoh: +628123456789)';
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

  const validateConfirmPassword = (value: string) => {
    if (!value) {
      return 'Konfirmasi kata sandi wajib diisi';
    }
    if (value !== password) {
      return 'Kata sandi tidak cocok';
    }
    return undefined;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: undefined }));
    }
  };

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const error = validateName(e.target.value);
    if (error) {
      setErrors(prev => ({ ...prev, name: error }));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handleEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const error = validateEmail(e.target.value);
    if (error) {
      setErrors(prev => ({ ...prev, email: error }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(value);
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: undefined }));
    }
  };

  const handlePhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const error = validatePhone(e.target.value);
    if (error) {
      setErrors(prev => ({ ...prev, phone: error }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
    if (errors.confirmPassword && confirmPassword) {
      const confirmError = validateConfirmPassword(confirmPassword);
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handlePasswordBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const error = validatePassword(e.target.value);
    if (error) {
      setErrors(prev => ({ ...prev, password: error }));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handleConfirmPasswordBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const error = validateConfirmPassword(e.target.value);
    if (error) {
      setErrors(prev => ({ ...prev, confirmPassword: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const phoneError = validatePhone(phone);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword);

    if (nameError || emailError || phoneError || passwordError || confirmPasswordError) {
      setErrors({ name: nameError, email: emailError, phone: phoneError, password: passwordError, confirmPassword: confirmPasswordError });
      setLoading(false);
      return;
    }

    const { data, error } = await signUp(email.trim(), password, name.trim(), phone.trim() || undefined);

    setLoading(false);

    if (error) {
      const msg = error.message || '';
      if (msg.includes('User already registered')) {
        setErrors({ email: 'Email sudah terdaftar. Silakan masuk.' });
      } else if (msg.includes('Database error') && phone.trim()) {
        setErrors({ phone: 'Nomor HP sudah terdaftar di akun lain' });
      } else {
        setErrors({ email: msg });
      }
    } else if (data.session) {
      router.push(decodeURIComponent(redirectTo));
      router.refresh();
    } else {
      router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
    }
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

  const passwordInput = (props: {
    id: string;
    label: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
    error?: string;
    autoComplete: string;
    showPassword: boolean;
    onToggleShow: () => void;
  }) => (
    <div className="w-full">
      <label htmlFor={props.id} className={labelClasses}>
        {props.label}
      </label>
      <div className="relative">
        <input
          id={props.id}
          type={props.showPassword ? 'text' : 'password'}
          className={cn(inputClasses(props.error), 'pr-14')}
          style={{ fontSize: '1rem !important', lineHeight: '1.5 !important' }}
          placeholder={props.placeholder}
          value={props.value}
          onChange={props.onChange}
          onBlur={props.onBlur}
          autoComplete={props.autoComplete}
          required
          disabled={loading}
          aria-invalid={props.error ? 'true' : 'false'}
          aria-describedby={props.error ? errorId(props.id) : undefined}
        />
        <button
          type="button"
          onMouseDown={e => e.preventDefault()}
          onTouchStart={e => e.preventDefault()}
          onClick={props.onToggleShow}
          disabled={loading}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-lg text-primary hover:bg-primary/10 transition-colors"
          aria-label={props.showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          aria-pressed={props.showPassword}
        >
          {props.showPassword ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {props.error && (
        <p id={errorId(props.id)} className="mt-1.5 text-sm font-medium text-error" role="alert">
          {props.error}
        </p>
      )}
    </div>
  );

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
          <div className="w-full">
            <label htmlFor="name" className={labelClasses}>
              Nama lengkap
            </label>
            <input
              id="name"
              type="text"
              className={inputClasses(errors.name)}
              style={{ fontSize: '1rem !important', lineHeight: '1.5 !important' }}
              placeholder="Contoh: Adham Baarigh"
              value={name}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              autoComplete="name"
              required
              disabled={loading}
              aria-invalid={errors.name ? 'true' : 'false'}
              aria-describedby={errors.name ? errorId('name') : undefined}
            />
            {errors.name && (
              <p id={errorId('name')} className="mt-1.5 text-sm font-medium text-error" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          <div className="w-full">
            <label htmlFor="email" className={labelClasses}>
              Email
            </label>
            <input
              id="email"
              type="email"
              className={inputClasses(errors.email)}
              style={{ fontSize: '1rem !important', lineHeight: '1.5 !important' }}
              placeholder="contoh@gmail.com"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              autoComplete="email"
              required
              disabled={loading}
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? errorId('email') : undefined}
            />
            {errors.email && (
              <p id={errorId('email')} className="mt-1.5 text-sm font-medium text-error" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <div className="w-full">
            <label htmlFor="phone" className={labelClasses}>
              Nomor telepon (untuk login)
            </label>
            <input
              id="phone"
              type="tel"
              className={inputClasses(errors.phone)}
              style={{ fontSize: '1rem !important', lineHeight: '1.5 !important' }}
              placeholder="+62 Masukkan nomor HP"
              value={phone}
              onChange={handlePhoneChange}
              onBlur={handlePhoneBlur}
              autoComplete="tel"
              inputMode="tel"
              disabled={loading}
              aria-invalid={errors.phone ? 'true' : 'false'}
              aria-describedby={errors.phone ? errorId('phone') : undefined}
            />
            {errors.phone && (
              <p id={errorId('phone')} className="mt-1.5 text-sm font-medium text-error" role="alert">
                {errors.phone}
              </p>
            )}
            {!errors.phone && (
              <p id="phone-helper" className="mt-1.5 text-sm text-text-muted">
                Nomor ini bisa dipakai untuk login selain email
              </p>
            )}
          </div>

          {passwordInput({
            id: 'password',
            label: 'Kata sandi',
            placeholder: 'Minimal 6 karakter',
            value: password,
            onChange: handlePasswordChange,
            onBlur: handlePasswordBlur,
            error: errors.password,
            autoComplete: 'new-password',
            showPassword,
            onToggleShow: () => setShowPassword(prev => !prev),
          })}

          {passwordInput({
            id: 'confirmPassword',
            label: 'Konfirmasi kata sandi',
            placeholder: 'Ulangi kata sandi',
            value: confirmPassword,
            onChange: handleConfirmPasswordChange,
            onBlur: handleConfirmPasswordBlur,
            error: errors.confirmPassword,
            autoComplete: 'new-password',
            showPassword: showConfirmPassword,
            onToggleShow: () => setShowConfirmPassword(prev => !prev),
          })}

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