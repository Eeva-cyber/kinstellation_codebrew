import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not add code between createServerClient and getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Always allow: invite pages, public assets, API routes
  if (pathname.startsWith('/invite/')) {
    return supabaseResponse;
  }

  // Dev bypass: set DEV_SKIP_AUTH=true in .env.local to skip auth checks locally
  if (process.env.DEV_SKIP_AUTH === 'true') {
    return supabaseResponse;
  }

  // Redirect /login to landing page (auth is handled by SignInModal)
  if (pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // /onboarding is open without auth — account creation happens there
  // /canvas requires auth — redirect to landing page if not authenticated
  if (pathname.startsWith('/canvas') && !user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
