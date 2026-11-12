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
  ({ label, error, icon, showPasswordToggle, loading, helperText, className, id: providedId, type = 'text', autoComplete, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;
    const [showPassword, setShowPassword] = useState(false);

    const describedBy = [error && errorId, helperText && helperId].filter(Boolean).join(' ') || undefined;

    const isPassword = type === 'password';
    const shouldShowEye = isPassword && showPasswordToggle !== false;
    const effectiveType = shouldShowEye && showPassword ? 'text' : type;

    const hasRightElement = icon || loading || shouldShowEye;
    const rightPadding = hasRightElement ? 'pr-14' : undefined;

    const defaultAutoComplete = isPassword ? 'current-password' : undefined;
    const effectiveAutoComplete = autoComplete ?? defaultAutoComplete;

    const isDisabled = (props.disabled as boolean | undefined) || loading;

    const { disabled: _disabled, ...restProps } = props;

    return (
      <div className="w-full">
        <label htmlFor={id} className="block text-sm font-semibold text-text mb-2">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={effectiveType}
            className={cn(
              'w-full h-[52px] px-4 rounded-[14px] bg-field text-text text-base outline-none transition-colors',
              'placeholder:text-[#A3ACB6]',
              'focus:border-primary focus:bg-white',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error ? 'border-2 border-error' : 'border-2 border-transparent',
              rightPadding,
              loading ? 'pr-14' : undefined,
              className
            )}
            style={{
              fontSize: '1rem !important',
              lineHeight: '1.5 !important',
            }}
            autoComplete={autoComplete ?? (isPassword ? 'current-password' : undefined)}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            aria-errormessage={error ? errorId : undefined}
            disabled={loading || (props.disabled as boolean | undefined)}
            {...props}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-primary animate-spin" aria-hidden="true" />
            </div>
          )}
          {shouldShowEye && (
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onTouchStart={e => e.preventDefault()}
              disabled={loading || (props.disabled as boolean | undefined)}
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-lg text-primary hover:bg-primary/10 transition-colors',
                loading && 'opacity-50 cursor-not-allowed'
              )}
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
          {icon && !loading && !shouldShowEye && (
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