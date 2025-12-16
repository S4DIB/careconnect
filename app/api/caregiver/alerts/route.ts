// API route for caregiver alerts and notifications
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

    // Get all linked users
    const { data: linkedUsers } = await supabase
      .from('caregiver_links')
      .select('elderly_user_id')
      .eq('caregiver_id', user.id);

    if (!linkedUsers || linkedUsers.length === 0) {
      return NextResponse.json({ alerts: [] });
    }

    const linkedUserIds = linkedUsers.map((link: any) => link.elderly_user_id);

    const alerts: any[] = [];

    // 1. Check for low stock alerts
    const { data: stockAlerts } = await supabase
      .from('stock_alerts')
      .select('*, medication:medications(name, dosage), user:users(full_name, email)')
      .in('user_id', linkedUserIds)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false });

    stockAlerts?.forEach((alert: any) => {
      alerts.push({
        id: alert.id,
        type: 'low_stock',
        severity: 'warning',
        message: alert.message,
        user: alert.user,
        medication: alert.medication,
        created_at: alert.created_at,
      });
    });

    // 2. Check for skipped medications (3+ in last 7 days per medication)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: medicationLogs } = await supabase
      .from('medication_logs')
      .select('*, medication:medications(name, dosage), user:users(full_name, email)')
      .in('user_id', linkedUserIds)
      .eq('status', 'skipped')
      .gte('logged_at', sevenDaysAgo.toISOString());

    // Group by medication and user
    const skippedByMed: Record<string, any> = {};
    medicationLogs?.forEach((log: any) => {
      const key = `${log.user_id}-${log.medication_id}`;
      if (!skippedByMed[key]) {
        skippedByMed[key] = {
          count: 0,
          medication: log.medication,
          user: log.user,
          logs: [],
        };
      }
      skippedByMed[key].count++;
      skippedByMed[key].logs.push(log);
    });

    // Add alerts for medications skipped 3+ times
    Object.values(skippedByMed).forEach((data: any) => {
      if (data.count >= 3) {
        alerts.push({
          id: `skipped-${data.user.id}-${data.medication.id}`,
          type: 'medication_skipped',
          severity: 'high',
          message: `${data.user.full_name || data.user.email} has skipped ${data.medication.name} ${data.count} times in the last 7 days`,
          user: data.user,
          medication: data.medication,
          count: data.count,
          created_at: data.logs[0].logged_at,
        });
      }
    });

    // 3. Check for concerning health keywords in recent check-ins
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: recentCheckins } = await supabase
      .from('health_checkins')
      .select('*, user:users(full_name, email)')
      .in('user_id', linkedUserIds)
      .gte('created_at', threeDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    const concerningKeywords = ['pain', 'dizzy', 'chest pain', 'emergency', 'hospital', 'fell', 'bleeding'];

    recentCheckins?.forEach((checkin: any) => {
      const hasConcerningKeyword = checkin.detected_keywords?.some((keyword: string) =>
        concerningKeywords.includes(keyword.toLowerCase())
      );

      if (hasConcerningKeyword) {
        alerts.push({
          id: `health-${checkin.id}`,
          type: 'health_concern',
          severity: 'critical',
          message: `${checkin.user.full_name || checkin.user.email} reported concerning symptoms: ${checkin.detected_keywords.join(', ')}`,
          user: checkin.user,
          keywords: checkin.detected_keywords,
          transcript: checkin.transcript,
          created_at: checkin.created_at,
        });
      }
    });

    // 4. Check for missed check-ins (no check-in in last 2 days)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    for (const userId of linkedUserIds) {
      const { data: recentUserCheckins } = await supabase
        .from('health_checkins')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', twoDaysAgo.toISOString())
        .limit(1);

      if (!recentUserCheckins || recentUserCheckins.length === 0) {
        const { data: userData } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', userId)
          .single();

        if (userData) {
          alerts.push({
            id: `no-checkin-${userId}`,
            type: 'no_checkin',
            severity: 'medium',
            message: `${userData.full_name || userData.email} hasn't checked in for 2+ days`,
            user: userData,
            created_at: twoDaysAgo.toISOString(),
          });
        }
      }
    }

    // Sort by severity (critical > high > medium > warning) and date
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, warning: 3 };
    alerts.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json({ alerts, total: alerts.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Mark stock alert as resolved
export async function PATCH(request: NextRequest) {
  try {
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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { alertId } = await request.json();

    // Resolve stock alert
    const { error } = await supabase
      .from('stock_alerts')
      .update({ is_resolved: true })
      .eq('id', alertId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Alert resolved' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

