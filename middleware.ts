import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
  
  // Skip onboarding check for auth-related routes
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    return response;
  }

  // If user is authenticated, check onboarding status
  if (session?.user) {
    const { data: profile } = await supabase
      .from('users')
      .select('onboard_complete')
      .eq('id', session.user.id)
      .single();
      
    // If onboarding not complete, redirect to onboarding
    if (!profile?.onboard_complete) {
      return NextResponse.redirect(new URL('/auth/confirmation/onboard', request.url));
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