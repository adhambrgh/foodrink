import dynamic from 'next/dynamic';
import SupabaseProvider from '@/components/providers/supabase-provider';

const BottomNav = dynamic(() => import('@/components/customer/bottom-nav'), {
  ssr: false,
  loading: () => null,
});

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseProvider>
      {children}
      <BottomNav />
    </SupabaseProvider>
  );
}