import Image from 'next/image';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/images/logo.jpeg"
          alt="Foodrink"
          width={80}
          height={80}
          className="rounded-full animate-pulse"
        />
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}