'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const AuthButton = forwardRef<HTMLButtonElement, AuthButtonProps>(
  ({ loading, variant = 'primary', disabled, children, className, ...props }, ref) => {
    const baseStyles = 'w-full h-[52px] rounded-[14px] text-base font-semibold transition-all disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2';

    const variants = {
      primary: 'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark',
      secondary: 'bg-primary-soft text-primary-dark hover:bg-primary-soft/80 active:bg-primary-soft',
      outline: 'border-2 border-primary text-primary bg-transparent hover:bg-primary/5 active:bg-primary/10',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            <span>Memproses...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

AuthButton.displayName = 'AuthButton';