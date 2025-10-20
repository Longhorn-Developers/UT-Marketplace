import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabaseClient';

// GET /api/terms - Fetch current terms and conditions
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('terms_and_conditions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // If no terms exist, return default terms
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          id: null,
          title: 'Terms and Conditions',
          content: 'No terms and conditions found',
          last_updated: new Date().toISOString(),
          version: 1
        });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching terms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch terms and conditions' },
      { status: 500 }
    );
  }
}

// POST /api/terms - Update terms and conditions (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Insert new terms version
    const { data, error } = await supabase
      .from('terms_and_conditions')
      .insert({
        title,
        content,
        version: await getNextVersion(),
        last_updated: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating terms:', error);
    return NextResponse.json(
      { error: 'Failed to update terms and conditions' },
      { status: 500 }
    );
  }
}

// Helper function to get next version number
async function getNextVersion(): Promise<number> {
  const { data } = await supabase
    .from('terms_and_conditions')
    .select('version')
    .order('version', { ascending: false })
    .limit(1)
    .single();

  return (data?.version || 0) + 1;
}
