'use client';

import { motion } from 'framer-motion';
import { Truck, CheckCircle2, Clock, AlertCircle, Package } from 'lucide-react';

type Variant = 'cod' | 'paid' | 'pending' | 'failed';

interface ReceiptNextStepsProps {
  variant: Variant;
  className?: string;
}

const VARIANT_CONTENT: Record<Variant, { icon: React.ReactNode; title: string; message: string; bg: string; border: string }> = {
  cod: {
    icon: <Truck className="w-5 h-5 text-amber-600" />,
    title: 'Pesanan COD Dikonfirmasi',
    message: 'Admin akan menyiapkan dan mengantarkan pesanan Anda. Bayar saat pesanan tiba di tempat.',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  paid: {
    icon: <CheckCircle2 className="w-5 h-5 text-success" />,
    title: 'Pembayaran Berhasil',
    message: 'Pesanan akan diproses oleh admin. Anda akan mendapat notifikasi saat status berubah.',
    bg: 'bg-success/10',
    border: 'border-success/30',
  },
  pending: {
    icon: <Clock className="w-5 h-5 text-primary" />,
    title: 'Menunggu Pembayaran',
    message: 'Selesaikan pembayaran di Midtrans untuk memproses pesanan Anda.',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
  },
  failed: {
    icon: <AlertCircle className="w-5 h-5 text-error" />,
    title: 'Pembayaran Gagal',
    message: 'Transaksi tidak berhasil diproses. Silakan coba lagi atau hubungi support.',
    bg: 'bg-error/10',
    border: 'border-error/30',
  },
};

export default function ReceiptNextSteps({ variant, className = '' }: ReceiptNextStepsProps) {
  const content = VARIANT_CONTENT[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
      className={`flex items-start gap-3 p-4 rounded-xl border ${content.bg} ${content.border} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex-shrink-0 mt-0.5">{content.icon}</div>
      <div className="flex-1 text-sm">
        <p className="font-medium text-text">{content.title}</p>
        <p className="mt-1 text-text-muted">{content.message}</p>
      </div>
    </motion.div>
  );
}