import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import Link from 'next/link';
import Image from 'next/image';
import { Store } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminNav, MobileAdminNav } from './admin-nav';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', weight: ['600', '700'] });

async function getProfile(userId: string) {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', userId)
    .single();
  return profile;
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const profile = await getProfile(user.id);

  return (
    <div className={`${inter.variable} ${jakarta.variable} grid min-h-screen grid-cols-1 bg-surface text-foreground md:grid-cols-[14rem_minmax(0,1fr)]`}>
      {/* Sidebar kiri */}
      <aside className="hidden min-h-screen flex-col border-r border-border bg-surface md:flex">
        <AdminNav />
        <div className="mt-auto border-t border-border px-4 py-4">
          <p className="truncate text-xs text-text-muted">{profile?.name || user.email?.split('@')[0]}</p>
          <p className="mt-0.5 text-[10px] text-outline">&copy; 2025 FoodDrink</p>
        </div>
      </aside>

      {/* Isi halaman kanan sidebar */}
      <section className="flex min-w-0 flex-col bg-surface">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2" aria-label="Foodrink Admin">
            <Image
              src="/images/logo.jpeg"
              alt="Foodrink"
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="font-heading text-lg font-bold text-text">FoodDrink</span>
          </Link>
          <Store className="h-5 w-5 text-text-muted" />
        </header>

        <MobileAdminNav />

        <main className="min-w-0 flex-1 overflow-auto bg-surface">
          <div className="w-full p-4 md:p-6">{children}</div>
        </main>
      </section>
    </div>
  );
}
