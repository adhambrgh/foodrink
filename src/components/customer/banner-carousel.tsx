'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type Banner = {
  id: string;
  title: string;
  subtitle?: string | null;
  image_url: string;
  link_url?: string | null;
};

export default function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [active, setActive] = useState(0);
  const slides = banners.filter((b) => !!b.image_url);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => setActive((a) => (a + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl">
      <div className="relative">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {slides.map((b) => (
            <div key={b.id} className="w-full shrink-0">
              {b.link_url ? (
                <Link href={b.link_url} className="block relative h-40 md:h-56 bg-surface-variant/60">
                  <Image src={b.image_url} alt={b.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h2 className="text-lg md:text-xl font-bold">{b.title}</h2>
                    {b.subtitle && <p className="text-xs md:text-sm opacity-90 mt-0.5">{b.subtitle}</p>}
                  </div>
                </Link>
              ) : (
                <div className="relative h-40 md:h-56">
                  <Image src={b.image_url} alt={b.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h2 className="text-lg md:text-xl font-bold">{b.title}</h2>
                    {b.subtitle && <p className="text-xs md:text-sm opacity-90 mt-0.5">{b.subtitle}</p>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-2 mt-3">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-2 rounded-full transition-all ${i === active ? 'w-6 bg-primary' : 'w-2 bg-text-muted/40'}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}