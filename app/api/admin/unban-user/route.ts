import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  throw new Error('Missing Supabase environment variables');
}

// Server-side admin client with service role
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { userId, adminId } = body;

    // Input validation
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!isValidUUID(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    if (!adminId || typeof adminId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    if (!isValidUUID(adminId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin ID format' },
        { status: 400 }
      );
    }

    console.log('Server-side unban user:', { userId, adminId });

    // Verify admin status
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', adminId)
      .single();

    if (adminError || !adminData?.is_admin) {
      console.error('Admin verification failed:', adminError);
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only admins can unban users' },
        { status: 403 }
      );
    }

    // Verify user exists and get current ban status
    const { data: existingUser, error: userCheckError } = await supabaseAdmin
      .from('users')
      .select('id, email, is_banned')
      .eq('id', userId)
      .single();

    if (userCheckError || !existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is not banned
    if (!existingUser.is_banned) {
      return NextResponse.json(
        { success: false, error: 'User is not banned' },
        { status: 400 }
      );
    }

    // Update user to unbanned status
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ is_banned: false })
      .eq('id', userId);

    if (updateError) {
      console.error('Error unbanning user:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to unban user' },
        { status: 500 }
      );
    }

    console.log('User unbanned successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Exception in unban user API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
