'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, Menu, Receipt, Tags, Heart, ChevronRight, MessageSquare } from 'lucide-react';
import { useState } from 'react';

import { Bell } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: Home, exact: true },
  { href: '/admin/menu', label: 'Kelola Menu', icon: Menu },
  { href: '/admin/kategori', label: 'Kategori', icon: Tags },
  { href: '/admin/pesanan', label: 'Pesanan', icon: Receipt },
  { href: '/admin/reviews', label: 'Review', icon: MessageSquare },
  { href: '/admin/banner', label: 'Banner', icon: MessageSquare },
  { href: '/admin/notifikasi', label: 'Notifikasi', icon: Bell },
];

function NavLinks({ className = '' }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={`flex flex-col gap-0.5 ${className}`}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + '/');

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
              active
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-text-muted hover:text-text hover:bg-surface-variant/60'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminNav() {
  return (
    <>
      <div className="p-5">
        <div className="flex items-center gap-3">
          <Image
            src="/images/logo.jpeg"
            alt="Foodrink"
            width={36}
            height={36}
            className="rounded-full"
          />
          <div>
            <h1 className="text-base font-bold text-text font-heading">Foodrink</h1>
            <p className="text-[11px] text-text-muted">Admin Portal</p>
          </div>
        </div>
      </div>

      <NavLinks className="px-3" />
    </>
  );
}

export function MobileAdminNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-border md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2 flex items-center justify-between text-sm font-medium text-text"
      >
        <span>Menu</span>
        <ChevronRight className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="bg-surface border-t border-border px-2 pb-3 animate-slide-down">
          <NavLinks className="px-1" />
        </div>
      )}
    </div>
  );
}