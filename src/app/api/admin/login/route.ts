import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';
import { logAudit, getClientIp, getUserAgent } from '@/lib/audit-log';

const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

export async function POST(request: Request) {
  // Rate limiting by IP
  const ip = getClientIp(request);
  const userAgent = getUserAgent(request);

  const { allowed, remaining, resetAt } = rateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Terlalu banyak percobaan login. Coba lagi nanti.' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(resetAt).toISOString(),
        }
      }
    );
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }

    // Create Supabase server client
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: CookieToSet[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, { ...SECURE_COOKIE_OPTIONS, ...options });
            });
          },
        },
      }
    );

    // Sign in
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Log failed login attempt
      await logAudit({
        adminId: 'unknown',
        action: 'login',
        resourceType: 'auth',
        details: { email, error: error.message, success: false },
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, name')
        .eq('id', data.user.id)
        .single();

      if (profile?.role !== 'admin') {
        await supabase.auth.signOut();

        // Log failed admin access attempt
        await logAudit({
          adminId: data.user.id,
          action: 'login',
          resourceType: 'auth',
          details: { email, error: 'not_admin', success: false },
          ipAddress: ip,
          userAgent,
        });

        return NextResponse.json(
          { error: 'Akun Anda bukan admin' },
          { status: 403 }
        );
      }

      // Log successful admin login
      await logAudit({
        adminId: data.user.id,
        action: 'login',
        resourceType: 'auth',
        details: { email, name: profile.name, success: true },
        ipAddress: ip,
        userAgent,
      });
    }

    return NextResponse.json(
      { success: true, redirectTo: '/admin' },
      {
        headers: {
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(resetAt).toISOString(),
        }
      }
    );
  } catch {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}