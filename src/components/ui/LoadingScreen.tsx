'use client';

import Image from 'next/image';

export default function LoadingScreen() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Image
          src="/images/logo.jpeg"
          alt="Foodrink"
          width={100}
          height={100}
          className="rounded-full animate-pulse"
        />
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    </div>
  );
}