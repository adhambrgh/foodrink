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
      <main className="px-6 pb-8 pt-7">{children}</main>
    </div>
  );
}