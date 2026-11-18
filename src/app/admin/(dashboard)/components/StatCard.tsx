'use client';

import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { CHART_COLORS } from '@/lib/chart-colors';
import { formatCurrency } from '@/lib/utils';
import { Sparkline } from './Sparkline';

type StatVariant = 'large' | 'medium' | 'small';

interface StatCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: React.ReactNode;
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accentColor: string;
  variant?: StatVariant;
  trend?: number[];
  trendLabel?: string;
  delay?: number;
}

const variantStyles: Record<StatVariant, { padding: string; radius: string; iconSize: string; valueSize: string; labelSize: string }> = {
  large: { padding: 'p-8', radius: 'rounded-2xl', iconSize: 'w-8 h-8', valueSize: 'text-3xl', labelSize: 'text-xs' },
  medium: { padding: 'p-6', radius: 'rounded-xl', iconSize: 'w-6 h-6', valueSize: 'text-2xl', labelSize: 'text-xs' },
  small: { padding: 'p-4', radius: 'rounded-lg', iconSize: 'w-5 h-5', valueSize: 'text-xl', labelSize: 'text-xs' },
};

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, icon, accentColor, variant = 'medium', trend, trendLabel, delay = 0, className, children, ...props }, ref) => {
    const { padding, radius, iconSize, valueSize, labelSize } = variantStyles[variant];
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return (
      <motion.div
        ref={ref}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        animate={prefersReducedMotion ? false : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay: delay * 0.1 }}
        className={`bg-surface-card border border-border ${padding} ${radius} ${className || ''}`}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg bg-surface-variant/60 ${iconSize}`}>
              {icon}
            </div>
            <span className={`${labelSize} text-text-muted font-medium`}>{label}</span>
          </div>
          {trend && trend.length > 0 && (
            <Sparkline data={trend} color={accentColor} width={60} height={24} />
          )}
        </div>
        <p className={`${valueSize} font-bold text-text font-heading tabular-nums`}>
          {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
        </p>
        {trendLabel && (
          <p className={`${labelSize} text-text-muted mt-1`}>{trendLabel}</p>
        )}
        {children}
      </motion.div>
    );
  }
);

StatCard.displayName = 'StatCard';