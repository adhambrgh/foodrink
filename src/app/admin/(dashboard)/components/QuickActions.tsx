'use client';

import Link from 'next/link';
import { Package, ShoppingCart, TrendingUp, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuickAction {
  href: string;
  label: string;
  icon: React.ReactNode;
  variant: 'primary' | 'secondary';
  accent: string;
  delay?: number;
}

const actions: QuickAction[] = [
  {
    href: '/admin/menu/new',
    label: 'Tambah Produk',
    icon: <Plus className="w-7 h-7" />,
    variant: 'primary',
    accent: 'text-primary',
    delay: 0,
  },
  {
    href: '/admin/menu',
    label: 'Kelola Menu',
    icon: <Package className="w-5 h-5" />,
    variant: 'secondary',
    accent: 'text-emerald-600',
    delay: 1,
  },
  {
    href: '/admin/pesanan',
    label: 'Lihat Pesanan',
    icon: <ShoppingCart className="w-5 h-5" />,
    variant: 'secondary',
    accent: 'text-amber-600',
    delay: 2,
  },
  {
    href: '/admin/banner/new',
    label: 'Kelola Banner',
    icon: <TrendingUp className="w-5 h-5" />,
    variant: 'secondary',
    accent: 'text-violet-600',
    delay: 3,
  },
];

const variantStyles = {
  primary: 'p-6 lg:p-8 rounded-2xl',
  secondary: 'p-4 lg:p-5 rounded-xl',
};

export function QuickActions() {
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={prefersReducedMotion ? false : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full"
    >
      <h2 className="text-sm font-semibold text-text mb-4">Aksi Cepat</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {actions.map((action) => (
          <motion.div
            key={action.href}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={prefersReducedMotion ? false : { opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94], delay: (action.delay ?? 0) * 0.08 }}
            whileHover={action.variant === 'primary' ? { y: -4, boxShadow: '0 12px 24px -8px rgba(180, 83, 9, 0.3)' } : { y: -2 }}
            className={`
              group
              bg-surface-card border border-border
              ${variantStyles[action.variant]}
              hover:border-primary/30 hover:shadow-lg
              transition-all duration-300
              flex flex-col items-center gap-3 text-center
            `}
          >
            <Link href={action.href} className="w-full flex flex-col items-center gap-3" aria-label={action.label}>
              <div className={`p-3 rounded-xl bg-surface-variant/60 ${action.accent}`}>
                {action.icon}
              </div>
              <span className="text-sm lg:text-base font-medium text-text text-center">
                {action.label}
              </span>
            </Link>
            {action.variant === 'primary' && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                +
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}