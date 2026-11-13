'use client';

import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AuthLayout({ children, className = '' }: AuthLayoutProps) {
  return (
    <div
      className={`w-full max-w-[430px] min-h-[100dvh] mx-auto bg-white shadow-[0_0_40px_rgba(15,31,46,0.08)] ${className}`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0)',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-primary text-white rounded-md"
      >
        Lewati ke konten utama
      </a>
      <main id="main-content" className="px-6 pb-8 pt-7">{children}</main>
    </div>
  );
}