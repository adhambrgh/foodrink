'use client';

import { forwardRef, InputHTMLAttributes, useId, useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: string | null;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
  loading?: boolean;
  helperText?: string;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, icon, showPasswordToggle, loading, helperText, className, id: providedId, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;
    const [showPassword, setShowPassword] = useState(false);

    const inputType = showPasswordToggle && showPassword ? 'text' : props.type;

    const describedBy = [error && errorId, helperText && helperId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full">
        <label htmlFor={id} className="block text-sm font-semibold text-text mb-2">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={inputType}
            className={cn(
              'w-full h-[52px] px-4 rounded-[14px] bg-field text-text text-base outline-none transition-colors',
              'placeholder:text-[#A3ACB6]',
              'focus:border-primary focus:bg-white',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error ? 'border-2 border-error' : 'border-2 border-transparent',
              icon ? 'pr-14' : undefined,
              loading ? 'pr-14' : undefined,
              className
            )}
            autoComplete={showPasswordToggle ? 'off' : (props.autoComplete || 'new-password')}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            aria-errormessage={error ? errorId : undefined}
            disabled={loading}
            {...props}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-primary animate-spin" aria-hidden="true" />
            </div>
          )}
          {showPasswordToggle && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-[10px] text-primary hover:bg-primary/10 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          )}
          {icon && !loading && !showPasswordToggle && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary">{icon}</div>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm font-medium text-error" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-sm text-text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';