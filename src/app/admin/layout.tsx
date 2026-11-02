import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import Link from 'next/link';
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
    <html lang="id" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="bg-background text-foreground min-h-screen flex">
        <aside className="hidden md:flex flex-col w-56 shrink-0 bg-surface border-r border-border">
          <AdminNav />
          <div className="mt-auto px-4 py-4 border-t border-border">
            <p className="text-xs text-text-muted truncate">{profile?.name || user.email?.split('@')[0]}</p>
            <p className="text-[10px] text-outline mt-0.5">&copy; 2025 FoodDrink</p>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-border sticky top-0 z-10">
            <Link href="/admin" className="text-lg font-bold text-text font-heading">FoodDrink</Link>
            <Store className="w-5 h-5 text-text-muted" />
          </header>
          <MobileAdminNav />
          <main className="min-h-[calc(100vh-57px)] bg-background">
            <div className="max-w-5xl mx-auto">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
