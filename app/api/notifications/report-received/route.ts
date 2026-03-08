import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  throw new Error('Missing Supabase environment variables');
}

const db = createClient(supabaseUrl, supabaseServiceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId || !UUID_REGEX.test(userId)) {
      return NextResponse.json({ success: false, error: 'Valid user ID required' }, { status: 400 });
    }

    await db.from('notifications').insert({
      user_id: userId,
      type: 'report_received',
      title: 'Report Received',
      message:
        'Thank you for reporting. We are reviewing your report and will keep you updated.',
      is_read: false,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in report-received notification:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
