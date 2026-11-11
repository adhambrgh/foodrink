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
        className="w-[100px] h-[100px] object-cover rounded-[20px]"
        loading="eager"
        fetchPriority="high"
      />
    </div>
  );
}