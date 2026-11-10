import { createBrowserClient } from '@supabase/ssr';
export { createBrowserClient } from '@supabase/ssr';

// Initialize Supabase client for browser/client-side usage
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('deleted_at')
      .eq('id', data.user.id)
      .single();

    if (profile?.deleted_at) {
      await supabase.auth.signOut();
      return { error: { message: 'Akun Anda telah dinonaktifkan. Hubungi admin jika ingin mengaktifkan kembali.' } };
    }
  }

  return { data, error };
};

export const signUp = (email: string, password: string, name: string) =>
  supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });