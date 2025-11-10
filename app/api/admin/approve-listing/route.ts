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
    const { listingId, adminId } = await request.json();

    console.log('🔐 Server-side approve listing:', { listingId, adminId });

    // Verify admin status
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', adminId)
      .single();

    if (adminError || !adminData?.is_admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only admins can approve listings' },
        { status: 403 }
      );
    }

    // Update listing status to approved
    const { error: updateError } = await supabaseAdmin
      .from('listings')
      .update({
        status: 'approved',
        denial_reason: null
      })
      .eq('id', listingId);

    if (updateError) {
      console.error('Error approving listing:', updateError);
      return NextResponse.json(
        { success: false, error: `Failed to approve listing: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Listing approved successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Exception in approve listing API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
