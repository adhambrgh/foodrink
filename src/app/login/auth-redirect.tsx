import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useSupabase } from '@/components/providers/supabase-provider';

export default function AuthRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, loading } = useSupabase();

  useEffect(() => {
    if (!loading && session) {
      const target = searchParams.get('redirectTo') || '/';
      router.replace(target);
    }
  }, [loading, session, router, searchParams]);

  // Render nothing; this component sits in a page to handle redirect after login
  return null;
}
