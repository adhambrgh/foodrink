'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import ReceiptCheckmark from './ReceiptCheckmark';

type Variant = 'cod' | 'paid' | 'pending' | 'failed';

interface ReceiptHeroCardProps {
  variant: Variant;
  orderId: string;
  total: number;
  className?: string;
}

const VARIANT_LABELS: Record<Variant, { label: string; badgeColor: string; statusColor: string }> = {
  cod: { label: 'Pesanan COD Dikonfirmasi', badgeColor: 'bg-amber-100 text-amber-800', statusColor: 'text-amber-600' },
  paid: { label: 'Pembayaran Berhasil', badgeColor: 'bg-success/10 text-success', statusColor: 'text-success' },
  pending: { label: 'Menunggu Pembayaran', badgeColor: 'bg-primary/10 text-primary', statusColor: 'text-primary' },
  failed: { label: 'Pembayaran Gagal', badgeColor: 'bg-error/10 text-error', statusColor: 'text-error' },
};

const VARIANT_ICON: Record<Variant, 'success' | 'pending' | 'failed'> = {
  cod: 'success',
  paid: 'success',
  pending: 'pending',
  failed: 'failed',
};

export default function ReceiptHeroCard({ variant, orderId, total, className = '' }: ReceiptHeroCardProps) {
  const reducedMotion = useReducedMotion();
  const [displayTotal, setDisplayTotal] = useState(0);
  const { label, badgeColor, statusColor } = VARIANT_LABELS[variant];
  const iconVariant = VARIANT_ICON[variant];

  useEffect(() => {
    if (reducedMotion || variant === 'pending' || variant === 'failed') {
      setDisplayTotal(total);
      return;
    }
    const duration = 800;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayTotal(Math.round(total * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [total, reducedMotion, variant]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.4, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-2xl p-6 text-center ${className}`}
      style={{
        background: variant === 'cod' || variant === 'paid'
          ? 'linear-gradient(135deg, #F26B1D 0%, #EA580C 100%)'
          : variant === 'pending'
          ? 'linear-gradient(135deg, #F26B1D 0%, #F97316 100%)'
          : 'linear-gradient(135deg, #BA1A1A 0%, #DC2626 100%)',
      }}
      role="status"
      aria-live="polite"
    >
      <ReceiptCheckmark variant={iconVariant} size={72} className="mx-auto mb-4" />

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.3, delay: 0.2 }}
        className="font-sans text-2xl font-bold text-white mb-2"
      >
        {label}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.3, delay: 0.25 }}
        className="text-white/90 text-sm mb-4 font-medium"
      >
        Pesanan Anda <span className="font-bold">#{orderId.slice(0, 8)}</span> telah dikonfirmasi
      </motion.p>

      <motion.span
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.3, delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
        className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold ${badgeColor}`}
      >
        {variant === 'cod' ? 'Bayar di Tempat' : variant === 'paid' ? 'Lunas' : variant === 'pending' ? 'Menunggu Bayar' : 'Gagal'}
      </motion.span>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.4, delay: 0.35 }}
        className="mt-6 pt-4 border-t border-white/20"
      >
        <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Total Pembayaran</p>
        <motion.p
          className="font-sans text-3xl font-bold text-white tabular-nums"
          style={{ fontVariant: 'tabular-nums' }}
        >
          {formatCurrency(displayTotal)}
        </motion.p>
      </motion.div>
    </motion.div>
  );
}