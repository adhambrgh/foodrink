import { createBrowserClient } from '@supabase/ssr';
export { createBrowserClient } from '@supabase/ssr';
import { normalizePhone } from '@/lib/utils';

// Initialize Supabase client for browser/client-side usage
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const signIn = async (identifier: string, password: string) => {
  // Kalau input bukan email, anggap nomor HP: cari email via profiles.phone
  let email = identifier.trim();
  if (!identifier.includes('@')) {
    const phone = normalizePhone(identifier);
    const { data: foundEmail, error: lookupError } = await supabase
      .rpc('get_email_by_phone', { p_phone: phone });

    if (lookupError || !foundEmail) {
      return { data: null, error: { message: 'Nomor HP tidak terdaftar. Periksa kembali atau gunakan email.' } };
    }
    email = foundEmail;
  }

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

export const signUp = (email: string, password: string, name: string, phone?: string) =>
  supabase.auth.signUp({
    email,
    password,
    options: { data: { name, ...(phone ? { phone } : {}) } },
  });