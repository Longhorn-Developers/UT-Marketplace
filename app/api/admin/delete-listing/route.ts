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
    const { reportId, adminId } = body;

    // Input validation
    if (!reportId || typeof reportId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Report ID is required' },
        { status: 400 }
      );
    }

    if (!isValidUUID(reportId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid report ID format' },
        { status: 400 }
      );
    }

    console.log('Server-side delete listing:', { reportId, adminId });

    // Verify admin status
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', adminId)
      .single();

    if (adminError || !adminData?.is_admin) {
      console.error('Admin verification failed:', adminError);
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

    const listingId = report.listing_id;

    // Verify listing exists
    const { data: existingListing, error: listingCheckError } = await supabaseAdmin
      .from('listings')
      .select('id, title, user_id')
      .eq('id', listingId)
      .single();

    if (listingCheckError || !existingListing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    console.log('Deleting favorites for listing:', listingId);
    // Delete favorites - Check for errors
    const { error: favError } = await supabaseAdmin
      .from('user_favorites')
      .delete()
      .eq('listing_id', listingId);

    if (favError) {
      console.error('Failed to delete favorites:', favError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete favorites' },
        { status: 500 }
      );
    }

    console.log('Deleting all reports for listing:', listingId);
    // Delete all reports for this listing - Check for errors
    const { error: reportsError } = await supabaseAdmin
      .from('listing_reports')
      .delete()
      .eq('listing_id', listingId);

    if (reportsError) {
      console.error('Failed to delete reports:', reportsError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete reports' },
        { status: 500 }
      );
    }

    console.log('Deleting listing:', listingId);
    // Delete the listing - Only if previous steps succeeded
    const { error: deleteError } = await supabaseAdmin
      .from('listings')
      .delete()
      .eq('id', listingId);

    if (deleteError) {
      console.error('Error deleting listing:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete listing' },
        { status: 500 }
      );
    }

    // Log admin action for audit trail
    await supabaseAdmin.from('admin_audit_log').insert({
      admin_id: adminId,
      action: 'delete_listing',
      target_id: listingId,
      details: {
        listing_title: existingListing.title,
        listing_user_id: existingListing.user_id,
        report_id: reportId
      },
      created_at: new Date().toISOString()
    }).then(({ error }) => {
      if (error) console.warn('Failed to log admin action:', error);
    });

    console.log('Listing deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Exception in delete listing API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
