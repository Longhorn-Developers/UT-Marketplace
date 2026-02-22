import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdminPath, isProtectedApiPath, isProtectedPath, isPublicPath } from './app/lib/routes/access';

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

  const pathname = request.nextUrl.pathname;
  const isPublic = isPublicPath(pathname);
  const isProtected = isProtectedPath(pathname) || isProtectedApiPath(pathname);
  const isAdmin = isAdminPath(pathname);

  if (isPublic) {
    return response;
  }

  const { data: { session } } = await supabase.auth.getSession();

  if ((isProtected || isAdmin) && !session?.user) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  if (isAdmin && session?.user) {
    const { data: adminProfile, error: adminError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (adminError || !adminProfile?.is_admin) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  if ((isProtected || isAdmin) && session?.user) {
    const { data: profile } = await supabase
      .from('users')
      .select('onboard_complete')
      .eq('id', session.user.id)
      .single();

    if (!profile?.onboard_complete) {
      return NextResponse.redirect(new URL('/auth/confirmation/onboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next|.*\\..*|api).*)',
    '/api/user-settings/:path*',
  ],
}; 
