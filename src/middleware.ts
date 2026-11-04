import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

type CookieSetting = { name: string; value: string; options?: Record<string, unknown> };

const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/unauthorized',
  '/api/checkout',
  '/api/midtrans/notification',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
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

  // Check if route is public (for customers)
  const isPublic = publicRoutes.some((route) =>
    path === route || path.startsWith(route)
  );

  if (isPublic) {
    return response;
  }

  // Check if route is admin public (login page)
  const isAdminPublic = adminPublicRoutes.some((route) =>
    path === route || path.startsWith(route)
  );

  if (isAdminPublic) {
    return response;
  }

  // Check if user is authenticated
  if (!user) {
    // Customer routes redirect to customer login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', path);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes check
  const isAdminRoute = adminRoutes.some((route) =>
    path.startsWith(route)
  );

  if (isAdminRoute) {
    // Check if admin has a profile with admin role, or create one if missing
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // If profile doesn't exist or role is admin, allow access
    const isAdmin = profile?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};