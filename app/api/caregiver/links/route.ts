// API route for caregiver links
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a caregiver
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'caregiver') {
      return NextResponse.json(
        { error: 'Only caregivers can create links' },
        { status: 403 }
      );
    }

    const { elderly_user_id } = await request.json();

    if (!elderly_user_id) {
      return NextResponse.json(
        { error: 'Elderly user ID is required' },
        { status: 400 }
      );
    }

    // Create link
    const { data, error } = await supabase
      .from('caregiver_links')
      .insert({
        caregiver_id: user.id,
        elderly_user_id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Link created successfully',
      link: data,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get linked users
    const { data, error } = await supabase
      .from('caregiver_links')
      .select('*, elderly_user:users!caregiver_links_elderly_user_id_fkey(*)')
      .eq('caregiver_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ links: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

