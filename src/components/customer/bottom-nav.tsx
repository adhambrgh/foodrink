'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ReceiptText, ShoppingBag, Package, UserCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const links = [
  { href: '/beranda', label: 'Beranda', icon: Home },
  { href: '/produk', label: 'Produk', icon: Package },
  { href: '/keranjang', label: 'Keranjang', icon: ShoppingBag, raised: true },
  { href: '/pesanan', label: 'Pesanan', icon: ReceiptText },
  { href: '/akun', label: 'Akun', icon: UserCircle },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const previousScrollY = useRef(0);

  useEffect(() => {
    previousScrollY.current = window.scrollY;
    setHidden(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      const movingDown = currentScrollY > previousScrollY.current;
      const shouldHide = movingDown && currentScrollY > 80;

      setHidden(shouldHide);
      previousScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-surface-variant pb-safe transition-transform duration-300 ${hidden ? 'translate-y-[calc(100%+2rem)]' : 'translate-y-0'}`}
    >
      <div className="mx-auto flex max-w-md items-center justify-around h-16 px-1">
        {links.map(({ href, label, icon: Icon, raised }) => (
          <Link
            key={href}
            href={href}
            className={`relative flex min-w-14 flex-col items-center justify-center gap-0.5 text-xs ${raised ? '-top-4' : ''} ${pathname === href ? 'text-primary font-semibold' : 'text-text-muted'} z-10`}
          >
            <span className={raised ? 'flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg' : ''}>
              <Icon className={raised ? 'h-6 w-6' : 'h-5 w-5'} />
            </span>
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
