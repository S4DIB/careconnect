// API route for caregiver to view medication adherence reports
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';

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
    const period = searchParams.get('period') || 'week'; // 'week' or 'month'

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
        { error: 'You are not authorized to view this user\'s data' },
        { status: 403 }
      );
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (period === 'month') {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    } else {
      startDate = startOfWeek(now);
      endDate = endOfWeek(now);
    }

    // Fetch medication logs for the period
    const { data: logs, error: logsError } = await supabase
      .from('medication_logs')
      .select('*, medication:medications(*)')
      .eq('user_id', elderlyUserId)
      .gte('logged_at', startDate.toISOString())
      .lte('logged_at', endDate.toISOString())
      .order('logged_at', { ascending: false });

    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 400 });
    }

    // Calculate adherence statistics
    const totalLogs = logs?.length || 0;
    const takenCount = logs?.filter((log: any) => log.status === 'taken').length || 0;
    const skippedCount = logs?.filter((log: any) => log.status === 'skipped').length || 0;
    const laterCount = logs?.filter((log: any) => log.status === 'later').length || 0;

    const adherenceRate = totalLogs > 0 ? (takenCount / totalLogs) * 100 : 0;

    // Calculate per-medication adherence
    const medicationStats: Record<string, any> = {};

    logs?.forEach((log: any) => {
      const medId = log.medication_id;
      if (!medicationStats[medId]) {
        medicationStats[medId] = {
          medication: log.medication,
          total: 0,
          taken: 0,
          skipped: 0,
          later: 0,
          adherenceRate: 0,
        };
      }
      medicationStats[medId].total++;
      if (log.status === 'taken') medicationStats[medId].taken++;
      if (log.status === 'skipped') medicationStats[medId].skipped++;
      if (log.status === 'later') medicationStats[medId].later++;
    });

    // Calculate adherence rate for each medication
    Object.values(medicationStats).forEach((stat: any) => {
      stat.adherenceRate = stat.total > 0 ? (stat.taken / stat.total) * 100 : 0;
    });

    return NextResponse.json({
      period,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      overall: {
        totalLogs,
        takenCount,
        skippedCount,
        laterCount,
        adherenceRate: adherenceRate.toFixed(1),
      },
      byMedication: Object.values(medicationStats),
      recentLogs: logs?.slice(0, 20) || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

