import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  throw new Error('Missing Supabase environment variables');
}

const db = createClient(supabaseUrl, supabaseServiceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function POST() {
  try {
    const now = new Date().toISOString();

    const { data, error } = await db
      .from('users')
      .update({ is_suspended: false, suspension_until: null })
      .eq('is_suspended', true)
      .lt('suspension_until', now)
      .select('id');

    if (error) {
      console.error('Error lifting expired suspensions:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const lifted = data?.length ?? 0;
    if (lifted > 0) {
      console.log(`Lifted ${lifted} expired suspension(s)`);
    }

    return NextResponse.json({ success: true, lifted });
  } catch (error) {
    console.error('Exception in lift-expired-suspensions:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
