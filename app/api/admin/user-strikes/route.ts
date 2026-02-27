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

/**
 * POST /api/admin/user-strikes
 * Body: { userIds: string[] }
 * Returns: Record<userId, totalStrikeCount>
 */
export async function POST(request: NextRequest) {
  try {
    const { userIds } = await request.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({});
    }

    // Cap to prevent abuse
    const ids: string[] = userIds.slice(0, 100);

    const { data, error } = await db
      .from('user_strikes')
      .select('user_id, strike_value')
      .in('user_id', ids);

    if (error || !data) {
      return NextResponse.json({});
    }

    const totals: Record<string, number> = {};
    for (const row of data) {
      totals[row.user_id] = (totals[row.user_id] ?? 0) + (row.strike_value ?? 1);
    }

    return NextResponse.json(totals);
  } catch (error) {
    console.error('Error fetching user strikes:', error);
    return NextResponse.json({});
  }
}
