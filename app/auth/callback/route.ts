import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', options);
          },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && user) {
      // Check if this is a new user by looking for existing user_settings
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('email', user.email)
        .single();

      if (!existingSettings) {
        // This is a new user, redirect to onboarding
        return NextResponse.redirect(new URL('/profile?onboarding=true', requestUrl.origin));
      }
    }
  }

  // Redirect to the home page if not a new user
  return NextResponse.redirect(new URL('/browse', requestUrl.origin));
} 