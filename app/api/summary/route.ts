// API route for daily health summaries
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateDailySummary } from '@/utils/healthAnalysis';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
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

    const { date, user_id } = await request.json();
    const targetUserId = user_id || user.id;
    const targetDate = date || format(new Date(), 'yyyy-MM-dd');

    // Fetch today's check-ins
    const { data: checkins, error: checkinError } = await supabase
      .from('health_checkins')
      .select('*')
      .eq('user_id', targetUserId)
      .gte('created_at', `${targetDate}T00:00:00`)
      .lte('created_at', `${targetDate}T23:59:59`);

    if (checkinError) {
      return NextResponse.json({ error: checkinError.message }, { status: 400 });
    }

    // Fetch today's medication logs
    const { data: logs, error: logsError } = await supabase
      .from('medication_logs')
      .select('*')
      .eq('user_id', targetUserId)
      .gte('logged_at', `${targetDate}T00:00:00`)
      .lte('logged_at', `${targetDate}T23:59:59`);

    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 400 });
    }

    // Generate summary
    const summary = generateDailySummary(checkins || [], logs || []);

    // Save summary
    const { data: summaryData, error: summaryError } = await supabase
      .from('daily_summaries')
      .upsert(
        {
          user_id: targetUserId,
          date: targetDate,
          ...summary,
        },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single();

    if (summaryError) {
      return NextResponse.json({ error: summaryError.message }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Summary generated successfully',
      summary: summaryData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || user.id;
    const limit = parseInt(searchParams.get('limit') || '7');

    // Fetch summaries
    const { data, error } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ summaries: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

