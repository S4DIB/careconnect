// API route for voice messages
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

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const recipient_id = formData.get('recipient_id') as string;
    const duration_seconds = parseInt(formData.get('duration_seconds') as string);

    if (!audioFile || !recipient_id) {
      return NextResponse.json(
        { error: 'Audio file and recipient_id are required' },
        { status: 400 }
      );
    }

    // Upload audio to Supabase Storage
    const fileName = `${user.id}/${Date.now()}-${audioFile.name}`;
    
    console.log('Uploading file:', fileName, 'Type:', audioFile.type, 'Size:', audioFile.size);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voice-messages')
      .upload(fileName, audioFile, {
        contentType: audioFile.type || 'audio/webm',
        upsert: false,
        cacheControl: '3600',
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('voice-messages').getPublicUrl(fileName);

    // Save message metadata
    const { data: messageData, error: messageError } = await supabase
      .from('voice_messages')
      .insert({
        sender_id: user.id,
        recipient_id,
        audio_url: publicUrl,
        duration_seconds: duration_seconds || null,
      })
      .select()
      .single();

    if (messageError) {
      return NextResponse.json({ error: messageError.message }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Voice message sent successfully',
      voice_message: messageData,
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

    // Get messages where user is sender or recipient
    const { data, error } = await supabase
      .from('voice_messages')
      .select('*, sender:users!voice_messages_sender_id_fkey(id, full_name, email), recipient:users!voice_messages_recipient_id_fkey(id, full_name, email)')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ messages: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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

    const { id, is_read } = await request.json();

    if (!id || is_read === undefined) {
      return NextResponse.json(
        { error: 'Message ID and is_read are required' },
        { status: 400 }
      );
    }

    // Update message read status
    const { data, error } = await supabase
      .from('voice_messages')
      .update({ is_read })
      .eq('id', id)
      .eq('recipient_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Message updated successfully',
      voice_message: data,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

