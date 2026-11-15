import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

type CookieSetting = { name: string; value: string; options?: Record<string, unknown> };

// Routes that require a logged-in customer. Everything else is publicly browsable.
const protectedRoutes = [
  '/keranjang',
  '/checkout',
  '/akun',
  '/pesanan',
  '/notifikasi',
  '/upload-bukti-qris',
];

const adminPublicRoutes = ['/admin/login'];

const adminRoutes = ['/admin'];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieSetting[]) {
          cookiesToSet.forEach(({ name, value }: CookieSetting) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value);
          });
        },
      },
    }
  );

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Admin login page is public
  const isAdminPublic = adminPublicRoutes.some(
    (route) => path === route || path.startsWith(route)
  );

  if (isAdminPublic) {
    return response;
  }

  const isAdminRoute = adminRoutes.some((route) => path.startsWith(route));

  // Admin area
  if (isAdminRoute) {
    if (!user) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirectTo', path);
      return NextResponse.redirect(loginUrl);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    return response;
  }

  // Customer routes
  const isProtected = protectedRoutes.some(
    (route) => path === route || path.startsWith(route)
  );

  if (!user) {
    // Guests may browse public catalog pages; protected pages require login.
    if (isProtected) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', path);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // Signed-in user: check soft-deleted account
  const { data: profile } = await supabase
    .from('profiles')
    .select('deleted_at')
    .eq('id', user.id)
    .single();

  if (profile?.deleted_at) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('deleted', 'true');
    const redirectResponse = NextResponse.redirect(loginUrl);
    redirectResponse.cookies.delete('sb-access-token');
    redirectResponse.cookies.delete('sb-refresh-token');
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
