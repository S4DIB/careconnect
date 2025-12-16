// API route for caregiver links
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

    const { elderly_user_email } = await request.json();

    if (!elderly_user_email) {
      return NextResponse.json(
        { error: 'Elderly user email is required' },
        { status: 400 }
      );
    }

    // Find elderly user by email
    const { data: elderlyUser, error: findError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('email', elderly_user_email)
      .eq('role', 'elderly_user')
      .single();

    if (findError || !elderlyUser) {
      return NextResponse.json(
        { error: 'Elderly user not found. Make sure they have signed up as an Elderly User.' },
        { status: 404 }
      );
    }

    // Check if link already exists
    const { data: existingLink } = await supabase
      .from('caregiver_links')
      .select('id')
      .eq('caregiver_id', user.id)
      .eq('elderly_user_id', elderlyUser.id)
      .single();

    if (existingLink) {
      return NextResponse.json(
        { error: 'You are already linked to this user' },
        { status: 400 }
      );
    }

    // Create link
    const { data, error } = await supabase
      .from('caregiver_links')
      .insert({
        caregiver_id: user.id,
        elderly_user_id: elderlyUser.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Successfully linked to ' + (elderlyUser.full_name || elderlyUser.email),
      link: data,
      elderly_user: elderlyUser,
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

    // Get linked users
    const { data, error } = await supabase
      .from('caregiver_links')
      .select('*, elderly_user:users!caregiver_links_elderly_user_id_fkey(id, email, full_name, role, created_at)')
      .eq('caregiver_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ links: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    const linkId = searchParams.get('id');

    if (!linkId) {
      return NextResponse.json({ error: 'Link ID is required' }, { status: 400 });
    }

    // Delete link
    const { error } = await supabase
      .from('caregiver_links')
      .delete()
      .eq('id', linkId)
      .eq('caregiver_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Link removed successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

