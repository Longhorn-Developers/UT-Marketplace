import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { UserService } from '../../lib/database/UserService';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') || '/';

  // If this is an email confirmation, redirect to the confirmation page
  if (type === 'signup') {
    const email = requestUrl.searchParams.get('email') || '';
    // Redirect to the confirmation page with confirmed status
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/confirmation?confirmed=true&email=${encodeURIComponent(email)}`
    );
  }

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
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/signin?error=${encodeURIComponent('Could not authenticate user')}`
      );
    }
    
    if (user) {
      // Check if this is a new user (first time signing in)
      const existingProfile = await UserService.getUserProfile(user.id);
      
      if (!existingProfile) {
        // This is a new user - create their profile and redirect to onboarding
        await UserService.upsertUserProfile({
          id: user.id,
          email: user.email || '',
          display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          profile_image_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          bio: null,
          phone: null,
          location: null,
          onboard_complete: false,
          notification_preferences: {
            email_notifications: true,
            browser_notifications: true
          }
        });
        
        // Redirect to onboarding for new users
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/confirmation/onboard`
        );
      }
      
      // Check if existing user has completed onboarding
      if (!existingProfile.onboard_complete) {
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/confirmation/onboard`
        );
      }
    }
    
    // If this is an email confirmation, redirect to the confirmation page
    if (user?.new_email) {
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/confirmation?confirmed=true&email=${encodeURIComponent(user.new_email)}`
      );
    }
  }

  // Default redirect after sign in
  return NextResponse.redirect(requestUrl.origin + next);
}