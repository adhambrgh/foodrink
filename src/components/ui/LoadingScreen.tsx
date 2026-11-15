'use client';

import Image from 'next/image';

const spin = `from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

export default function LoadingScreen() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/images/logo.jpeg"
          alt="Foodrink"
          width={100}
          height={100}
          className="rounded-full animate-pulse"
        />
        <div className="relative w-12 h-12">
          <svg
            className="absolute inset-0 w-full h-full animate-[spin_1s_linear_infinite]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            role="status"
            aria-label="Memuat"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          <div
            className={`absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-[${spin}_1s_linear_infinite]`}
          />
        </div>
        <p className="text-xs text-[#8a756b] font-medium">Memuat...</p>
      </div>
    </div>
  );
}