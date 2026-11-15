'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';

interface AuthPromptProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

export function AuthPrompt({ open, onClose, message }: AuthPromptProps) {
  const pathname = usePathname();

  if (!open) return null;

  const redirectTo = encodeURIComponent(pathname || '/beranda');

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 pb-24 sm:items-center sm:pb-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-prompt-title"
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="auth-prompt-title" className="text-base font-semibold text-text">
            Masuk untuk melanjutkan
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="-mr-1 -mt-1 rounded-full p-1 text-text-muted transition-colors hover:bg-black/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          {message ?? 'Kamu perlu masuk untuk melanjutkan.'}
        </p>

        <div className="mt-5 space-y-2">
          <Link
            href={`/login?redirectTo=${redirectTo}`}
            className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Masuk
          </Link>
          <Link
            href={`/register?redirectTo=${redirectTo}`}
            className="flex h-11 w-full items-center justify-center rounded-lg border border-outline bg-white text-sm font-semibold text-text transition-colors hover:bg-surface"
          >
            Buat akun
          </Link>
        </div>
      </div>
    </div>
  );
}
