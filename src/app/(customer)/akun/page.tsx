'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Bell, Shield, Settings, CreditCard, Heart } from 'lucide-react';
import Link from 'next/link';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function AkunPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface p-4">
        <LoadingScreen />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-surface px-4 pb-28 pt-safe pt-4">
      <header className="mb-5 flex items-center justify-between border-b border-black/5 pb-3">
        <Link href="/beranda" prefetch={true} aria-label="Kembali ke beranda" className="rounded-full p-2 text-text transition-colors hover:bg-surface-variant">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Foodrink</p>
          <h1 className="font-sans text-lg leading-tight text-text">Akun Saya</h1>
        </div>
        <Link href="/notifikasi" prefetch={true} aria-label="Buka notifikasi" className="rounded-full bg-primary p-2 text-white">
          <Bell className="h-4 w-4" />
        </Link>
      </header>

      {/* Profile */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="font-medium text-text">
              {profile?.name || 'Pengguna'}
            </p>
            <p className="text-sm text-text-muted">
              {profile?.phone || 'Belum diisi'}
            </p>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="space-y-0 bg-white rounded-lg border border-gray-100 overflow-hidden">
        <Link
          href="/akun/profil"
          className="flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-text-muted" />
            <span className="text-text">Profil</span>
          </div>
        </Link>
        <Link
          href="/akun/alamat"
          className="flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-text-muted" />
            <span className="text-text">Alamat</span>
          </div>
        </Link>
        <Link
          href="/akun/metode-pembayaran"
          className="flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-text-muted" />
            <span className="text-text">Metode Pembayaran</span>
          </div>
        </Link>
        <Link
          href="/akun/notifikasi"
          className="flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-text-muted" />
            <span className="text-text">Keamanan</span>
          </div>
        </Link>
        <Link
          href="/akun/favorit"
          className="flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-text-muted" />
            <span className="text-text">Favorit Saya</span>
          </div>
        </Link>
        <Link
          href="/akun/pengaturan"
          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-text-muted" />
            <span className="text-text">Pengaturan</span>
          </div>
        </Link>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full mt-4 py-3 bg-white border border-gray-200 rounded-lg text-error font-medium hover:bg-gray-50 transition-colors"
      >
        Keluar
      </button>
    </main>
  );
}