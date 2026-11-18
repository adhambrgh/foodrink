'use client';

import { forwardRef, ReactNode, HTMLAttributes } from 'react';
import { motion } from 'framer-motion';

interface ChartWrapperProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onDrag'> {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  loading?: boolean;
  error?: string | null;
  id?: string;
}

export const ChartWrapper = forwardRef<HTMLDivElement, ChartWrapperProps>(
  ({ title, subtitle, children, action, loading, error, id, className, style, ...props }, ref) => {
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (loading) {
      return (
        <div
          ref={ref}
          id={id}
          className={`relative bg-surface-card border border-border rounded-2xl p-6 ${className || ''}`}
          style={style as React.CSSProperties}
          {...props}
          role="region"
          aria-label={`${title} (memuat)`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="h-5 w-3/12 bg-surface-variant animate-pulse rounded mb-1" />
              <div className="h-3 w-1/4 bg-surface-variant animate-pulse rounded" />
            </div>
            <div className="h-8 w-8 bg-surface-variant animate-pulse rounded-full" />
          </div>
          <div className="space-y-3" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-surface-variant animate-pulse rounded" />
            ))}
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div
          ref={ref}
          id={id}
          className={`relative bg-surface-card border border-border rounded-2xl p-6 ${className || ''}`}
          style={style as React.CSSProperties}
          {...props}
          role="alert"
        >
          <div className="flex items-center gap-3 text-center py-8">
            <svg className="w-10 h-10 text-amber-500 flex-shrink-0 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-medium text-text">Something went wrong</p>
              <p className="text-sm text-text-muted mt-1">We&apos;re on it. Try refreshing in a moment.</p>
              <p className="text-xs text-text-muted mt-2 font-mono">{error}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        id={id}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        animate={prefersReducedMotion ? false : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`relative bg-surface-card border border-border rounded-2xl p-6 ${className || ''}`}
        style={style as React.CSSProperties}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-text font-heading truncate">{title}</h3>
            {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
        <div className="w-full" role="img" aria-label={title}>
          {children}
        </div>
      </motion.div>
    );
  }
);

ChartWrapper.displayName = 'ChartWrapper';