import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that suspended users cannot access
const SUSPENSION_BLOCKED_PATHS = ['/create', '/messages'];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Skip checks for auth-related routes
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    return response;
  }

  // Skip checks for the suspended page itself (prevent redirect loop)
  if (request.nextUrl.pathname.startsWith('/suspended')) {
    return response;
  }

  if (session?.user) {
    const { data: profile } = await supabase
      .from('users')
      .select('onboard_complete, is_banned, is_suspended, suspension_until')
      .eq('id', session.user.id)
      .single();

    // Redirect to onboarding if not complete
    if (!profile?.onboard_complete) {
      return NextResponse.redirect(new URL('/auth/confirmation/onboard', request.url));
    }

    // Block banned users from all protected routes
    if (profile?.is_banned) {
      return NextResponse.redirect(new URL('/suspended?reason=banned', request.url));
    }

    // Check active suspension: is_suspended=true AND suspension_until is in the future
    const isSuspensionActive =
      profile?.is_suspended &&
      profile?.suspension_until &&
      new Date(profile.suspension_until) > new Date();

    if (isSuspensionActive) {
      const pathname = request.nextUrl.pathname;
      const isBlocked = SUSPENSION_BLOCKED_PATHS.some(p => pathname.startsWith(p));
      if (isBlocked) {
        const until = encodeURIComponent(profile.suspension_until!);
        return NextResponse.redirect(
          new URL(`/suspended?reason=suspended&until=${until}`, request.url)
        );
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/settings/:path*',
    '/create/:path*',
    '/my-listings/:path*',
    '/messages/:path*',
    '/favorites/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/api/user-settings/:path*',
  ],
}; 