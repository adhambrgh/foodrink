'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { CartProvider } from '@/hooks/use-cart';

type SupabaseContext = {
  session: Session | null;
  loading: boolean;
};

const Context = createContext<SupabaseContext>({
  session: null,
  loading: true,
});

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Context.Provider value={{ session, loading }}>
      <CartProvider>{children}</CartProvider>
    </Context.Provider>
  );
}

export const useSupabase = () => useContext(Context);
export const useSession = () => {
  const context = useContext(Context);
  return { session: context.session, loading: context.loading };
};