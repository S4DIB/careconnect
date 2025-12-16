// API route for caregiver to view linked user check-ins
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const elderlyUserId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!elderlyUserId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Verify caregiver is linked to this user
    const { data: link } = await supabase
      .from('caregiver_links')
      .select('id')
      .eq('caregiver_id', user.id)
      .eq('elderly_user_id', elderlyUserId)
      .single();

    if (!link) {
      return NextResponse.json(
        { error: 'You are not authorized to view this user\'s check-ins' },
        { status: 403 }
      );
    }

    // Fetch check-ins
    const { data: checkins, error } = await supabase
      .from('health_checkins')
      .select('*')
      .eq('user_id', elderlyUserId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ checkins: checkins || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

