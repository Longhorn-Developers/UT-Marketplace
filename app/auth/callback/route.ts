import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { UserService } from '../../lib/database/UserService';

// Validate email domain for UT Austin
const validateEmailDomain = (email: string): boolean => {
  return email.toLowerCase().endsWith('@utexas.edu');
};

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') || '/';

  // If no code is present, fall back to a safe redirect.
  if (!code) {
    if (type === 'signup') {
      const email = requestUrl.searchParams.get('email') || '';
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/confirmation?email=${encodeURIComponent(email)}`
      );
    }

    return NextResponse.redirect(requestUrl.origin + next);
  }

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
    // Validate email domain for new users
    if (user.email && !validateEmailDomain(user.email)) {
      console.error('Invalid email domain for user:', user.email);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/signin?error=${encodeURIComponent('Please use your UT Austin email address')}`
      );
    }
    
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
        status: 'active',
        email_verified_at: new Date().toISOString(),
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
    
    // If an existing user is still pending, activate them after verification.
    if (existingProfile.status && existingProfile.status !== 'active') {
      await UserService.updateUserProfile({
        id: user.id,
        status: 'active',
        email_verified_at: new Date().toISOString(),
      });
    }

    // Admins go straight to admin dashboard
    if ((existingProfile as any)?.is_admin) {
      return NextResponse.redirect(`${requestUrl.origin}/admin`);
    }

    // Check if existing user has completed onboarding
    if (!existingProfile.onboard_complete) {
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/confirmation/onboard`
      );
    }
  }
  
  // If this is an email change confirmation, keep existing behavior.
  if (user?.new_email) {
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/confirmation?confirmed=true&email=${encodeURIComponent(user.new_email)}`
    );
  }

  // Default redirect after sign in
  return NextResponse.redirect(requestUrl.origin + next);
}
