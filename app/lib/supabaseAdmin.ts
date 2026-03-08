import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

// For admin operations, we try to use the service role key if available
// This bypasses Row Level Security (RLS) policies
let adminClient;

console.log(' Checking SUPABASE_SERVICE_ROLE_KEY:', {
  exists: !!supabaseServiceRole,
  length: supabaseServiceRole?.length || 0,
  first10Chars: supabaseServiceRole?.substring(0, 10) || 'N/A'
});

if (supabaseServiceRole) {
  console.log(' Using SUPABASE_SERVICE_ROLE_KEY for admin client');
  // Service role client - bypasses RLS -> caution for later (revise)
  adminClient = createClient(supabaseUrl, supabaseServiceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
} else {
  // Fallback: Use anon key but log a warning
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseAnonKey) {
    throw new Error('Missing both SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  console.error(' SUPABASE_SERVICE_ROLE_KEY not found. Admin operations may fail due to RLS policies.');
  console.error(' Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file for proper admin functionality.');
  console.error(' Current env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));

  adminClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}

export const supabaseAdmin = adminClient;