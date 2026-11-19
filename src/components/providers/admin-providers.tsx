'use client';

import SupabaseProvider from '@/components/providers/supabase-provider';

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return <SupabaseProvider>{children}</SupabaseProvider>;
}