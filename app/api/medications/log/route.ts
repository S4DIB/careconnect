// API route for medication logs
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    const { medication_id, status, scheduled_time } = await request.json();

    // Validate input
    if (!medication_id || !status || !scheduled_time) {
      return NextResponse.json(
        { error: 'Medication ID, status, and scheduled_time are required' },
        { status: 400 }
      );
    }

    if (!['taken', 'later', 'skipped'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Log medication
    const { data: logData, error: logError } = await supabase
      .from('medication_logs')
      .insert({
        medication_id,
        user_id: user.id,
        status,
        scheduled_time,
      })
      .select()
      .single();

    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 400 });
    }

    // If taken, reduce stock
    if (status === 'taken') {
      // Get current medication
      const { data: medication, error: medError } = await supabase
        .from('medications')
        .select('*')
        .eq('id', medication_id)
        .single();

      if (medError || !medication) {
        return NextResponse.json({ error: 'Medication not found' }, { status: 404 });
      }

      const newStock = medication.total_stock - 1;

      // Update stock
      const { error: updateError } = await supabase
        .from('medications')
        .update({ total_stock: newStock })
        .eq('id', medication_id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }

      // Check if stock is low
      if (newStock <= medication.low_stock_threshold && newStock > 0) {
        // Create stock alert
        await supabase.from('stock_alerts').insert({
          medication_id,
          user_id: user.id,
          message: `Low stock alert: ${medication.name} has only ${newStock} doses remaining`,
        });
      }
    }

    return NextResponse.json({
      message: 'Medication logged successfully',
      log: logData,
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
    const medicationId = searchParams.get('medication_id');

    let query = supabase
      .from('medication_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false });

    if (medicationId) {
      query = query.eq('medication_id', medicationId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ logs: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

