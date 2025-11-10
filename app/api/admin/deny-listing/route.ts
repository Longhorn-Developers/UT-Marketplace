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

export async function POST(request: NextRequest) {
  try {
    const { listingId, adminId, reason } = await request.json();

    console.log('🔐 Server-side deny listing:', { listingId, adminId, reason });

    // Verify admin status
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', adminId)
      .single();

    if (adminError || !adminData?.is_admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only admins can deny listings' },
        { status: 403 }
      );
    }

    // Update listing status to denied with reason
    const { error: updateError } = await supabaseAdmin
      .from('listings')
      .update({
        status: 'denied',
        denial_reason: reason
      })
      .eq('id', listingId);

    if (updateError) {
      console.error('Error denying listing:', updateError);
      return NextResponse.json(
        { success: false, error: `Failed to deny listing: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Listing denied successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Exception in deny listing API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
