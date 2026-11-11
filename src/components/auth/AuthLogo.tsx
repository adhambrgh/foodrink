'use client';

import { cn } from '@/lib/utils';

interface AuthLogoProps {
  className?: string;
  alt?: string;
}

export function AuthLogo({ className = '', alt = 'FoodDrink' }: AuthLogoProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <img
        src="/images/logo.jpeg"
        alt={alt}
        className="h-[72px] w-[72px] rounded-full object-cover ring-2 ring-primary/20 shadow-sm"
        loading="eager"
        fetchPriority="high"
      />
    </div>
  );
}