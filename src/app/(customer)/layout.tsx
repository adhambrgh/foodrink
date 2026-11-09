import BottomNav from '@/components/customer/bottom-nav';
import SupabaseProvider from '@/components/providers/supabase-provider';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseProvider>
      {children}
      <BottomNav />
    </SupabaseProvider>
  );
}