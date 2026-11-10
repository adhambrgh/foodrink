'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface ReceiptCheckmarkProps {
  variant: 'success' | 'pending' | 'failed';
  size?: number;
  className?: string;
}

const CHECKMARK_PATH = 'M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z';
const X_PATH = 'M18 6L6 18M6 6l12 12';

export default function ReceiptCheckmark({ variant, size = 64, className = '' }: ReceiptCheckmarkProps) {
  const reducedMotion = useReducedMotion();
  const pathRef = useRef<SVGPathElement>(null);
  const pathLength = CHECKMARK_PATH.length > 0 ? 40 : 0;

  const getPath = () => {
    switch (variant) {
      case 'success':
        return CHECKMARK_PATH;
      case 'failed':
        return X_PATH;
      case 'pending':
      default:
        return '';
    }
  };

  const getColor = () => {
    switch (variant) {
      case 'success':
        return '#1F7A4D';
      case 'failed':
        return '#BA1A1A';
      case 'pending':
      default:
        return '#F26B1D';
    }
  };

  if (variant === 'pending') {
    return (
      <motion.div
        initial={false}
        animate={{ rotate: reducedMotion ? 0 : 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        className={className}
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke={getColor()}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="31.4 31.4"
            strokeDashoffset="0"
            className="opacity-75"
          />
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke={getColor()}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="31.4 31.4"
            strokeDashoffset="0"
            className="opacity-25"
          />
        </svg>
      </motion.div>
    );
  }

  return (
    <motion.svg
      initial={false}
      animate={{ scale: reducedMotion ? 1 : [0, 1.1, 1] }}
      transition={{ duration: reducedMotion ? 0 : 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={variant === 'success' ? 'Pembayaran berhasil' : 'Pembayaran gagal'}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="11"
        fill={getColor()}
        initial={{ scale: 0 }}
        animate={{ scale: reducedMotion ? 1 : [0, 1.05, 1] }}
        transition={{ duration: reducedMotion ? 0 : 0.4, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
      />
      <motion.path
        ref={pathRef}
        d={getPath()}
        stroke={variant === 'success' ? '#FFFFFF' : '#FFFFFF'}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: reducedMotion ? 1 : 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.6, delay: 0.3, ease: 'easeOut' }}
      />
    </motion.svg>
  );
}