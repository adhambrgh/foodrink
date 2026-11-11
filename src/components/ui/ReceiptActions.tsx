
'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import { Home, Package, Download, Share2, Check, X } from 'lucide-react';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

interface ReceiptActionsProps {
  orderId: string;
  receiptRef: React.RefObject<HTMLDivElement>;
  className?: string;
}

export default function ReceiptActions({ orderId, receiptRef, className = '' }: ReceiptActionsProps) {
  const reducedMotion = useReducedMotion();
  const [toast, setToast] = useState<ToastState | null>(null);
  const [saving, setSaving] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSaveAsImage = useCallback(async () => {
    const element = receiptRef.current;
    if (!element) return;

    setSaving(true);
    showToast('Menyiapkan gambar...', 'success');

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FAF8F5',
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const link = document.createElement('a');
      link.download = `struk-${orderId.slice(0, 8)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      showToast('Struk disimpan ke galeri', 'success');
    } catch (error) {
      console.error('Save image error:', error);
      showToast('Gagal menyimpan gambar', 'error');
    } finally {
      setSaving(false);
    }
  }, [orderId, receiptRef, showToast]);

  const handleShare = useCallback(async () => {
    const text = `Struk Pesanan #${orderId.slice(0, 8)} - Foodrink`;
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Struk Foodrink', text, url });
        showToast('Berhasil dibagikan', 'success');
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        showToast('Link disalin ke clipboard', 'success');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share error:', error);
        showToast('Gagal membagikan', 'error');
      }
    }
  }, [orderId, showToast]);

  const actions = [
    { label: 'Beranda', href: '/beranda', variant: 'ghost' as const, icon: Home, onClick: undefined },
    { label: 'Pesanan Saya', href: '/pesanan', variant: 'primary' as const, icon: Package, onClick: undefined },
    { label: 'Simpan Gambar', href: undefined, variant: 'outline' as const, icon: Download, onClick: handleSaveAsImage },
    { label: 'Bagikan', href: undefined, variant: 'outline' as const, icon: Share2, onClick: handleShare },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.3, delay: 0.5 }}
        className={`sticky bottom-0 z-20 bg-white border-t border-neutral-100 p-4 pb-safe ${className}`}
      >
        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
          {actions.map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.2, delay: 0.5 + index * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                if (action.onClick) {
                  e.preventDefault();
                  action.onClick();
                }
              }}
              disabled={action.label === 'Simpan Gambar' && saving}
              className={`
                flex items-center justify-center gap-2 h-12 px-4 rounded-xl font-medium text-sm transition-colors
                ${action.variant === 'primary'
                  ? 'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark/90'
                  : action.variant === 'ghost'
                  ? 'bg-surface-variant text-text hover:bg-surface-mid active:bg-surface-mid/90'
                  : 'border border-neutral-200 bg-white text-text hover:bg-surface-low active:bg-surface-mid'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <action.icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              {action.label === 'Simpan Gambar' && saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  <span>Menyimpan...</span>
                </>
              ) : (
                action.label
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium flex items-center gap-2"
          style={{ backgroundColor: toast.type === 'success' ? '#1F7A4D' : '#BA1A1A' }}
          role="alert"
          aria-live="polite"
        >
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.message}
        </motion.div>
      )}
    </>
  );
}