'use client';

import { useEffect, useRef, useState, KeyboardEvent, ChangeEvent, ClipboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
  error?: boolean;
}

export function OtpInput({
  length = 4,
  value,
  onChange,
  onComplete,
  disabled,
  autoFocus,
  error,
}: OtpInputProps) {
  const inputsRef = useRef<HTMLInputElement[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0].focus();
      setFocusedIndex(0);
    }
  }, [autoFocus]);

  useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete();
    }
  }, [value, length, onComplete]);

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const digit = e.target.value.replace(/\D/g, '').slice(0, 1);
    const newValue = value.slice(0, index) + digit + value.slice(index + 1);
    onChange(newValue);

    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
    if (e.key.length === 1 && !isNaN(Number(e.key)) && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, length);
    const newValue = digits.padEnd(length, '');
    onChange(newValue);
    inputsRef.current[Math.min(digits.length, length - 1)]?.focus();
    setFocusedIndex(Math.min(digits.length, length - 1));
  };

  const handleFocus = (index: number) => setFocusedIndex(index);

  const digits = value.padEnd(length, '').slice(0, length);

  return (
    <div
      className="flex gap-3"
      role="group"
      aria-label={`Kode verifikasi ${length} digit`}
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el: HTMLInputElement | null) => { if (el) inputsRef.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digits[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(i)}
          disabled={disabled}
          className={cn(
            'flex-1 min-w-0 h-[64px] text-center text-3xl font-semibold text-text outline-none transition-all',
            'rounded-[14px] border-2',
            error
              ? 'border-error bg-white'
              : focusedIndex === i
              ? 'border-primary bg-white shadow-[0_0_0_3px_rgba(249,149,26,0.18)]'
              : digits[i]
              ? 'border-primary bg-white'
              : 'border-[#F4C98B] bg-white',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}