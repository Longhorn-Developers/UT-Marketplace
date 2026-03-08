import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  throw new Error('Missing Supabase environment variables');
}

// Create a Supabase client with service role for admin operations
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
    const { listingId, adminId, reason } = body;

    // Input validation
    if (!listingId || typeof listingId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    if (!isValidUUID(listingId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid listing ID format' },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Denial reason is required' },
        { status: 400 }
      );
    }

    if (reason.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Reason too long (max 500 characters)' },
        { status: 400 }
      );
    }

    console.log('Server-side deny listing:', { listingId, adminId, reason: reason.substring(0, 50) });

    // Verify admin status
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', adminId)
      .single();

    if (adminError || !adminData?.is_admin) {
      console.error('Admin verification failed:', adminError);
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only admins can deny listings' },
        { status: 403 }
      );
    }

    // Verify listing exists before updating
    const { data: existingListing, error: listingCheckError } = await supabaseAdmin
      .from('listings')
      .select('id, status')
      .eq('id', listingId)
      .single();

    if (listingCheckError || !existingListing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Update listing status to denied with reason
    const { error: updateError } = await supabaseAdmin
      .from('listings')
      .update({
        status: 'denied',
        denial_reason: reason.trim()
      })
      .eq('id', listingId);

    if (updateError) {
      console.error('Error denying listing:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to deny listing' },
        { status: 500 }
      );
    }

    console.log('Listing denied successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Exception in deny listing API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
