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
    const { listingId, reportId, adminId } = await request.json();

    console.log('🔐 Server-side delete listing:', { listingId, reportId, adminId });

    // Verify admin status
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', adminId)
      .single();

    if (adminError || !adminData?.is_admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only admins can delete listings' },
        { status: 403 }
      );
    }

    // Get report details to find the listing
    const { data: report, error: reportError } = await supabaseAdmin
      .from('listing_reports')
      .select('listing_id')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    console.log('Step 1: Deleting favorites for listing:', report.listing_id);
    // Delete favorites
    await supabaseAdmin
      .from('user_favorites')
      .delete()
      .eq('listing_id', report.listing_id);

    console.log('Step 2: Deleting all reports for listing:', report.listing_id);
    // Delete all reports for this listing
    await supabaseAdmin
      .from('listing_reports')
      .delete()
      .eq('listing_id', report.listing_id);

    console.log('Step 3: Deleting listing:', report.listing_id);
    // Delete the listing
    const { error: deleteError } = await supabaseAdmin
      .from('listings')
      .delete()
      .eq('id', report.listing_id);

    if (deleteError) {
      console.error('Error deleting listing:', deleteError);
      return NextResponse.json(
        { success: false, error: `Failed to delete listing: ${deleteError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Listing deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Exception in delete listing API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
