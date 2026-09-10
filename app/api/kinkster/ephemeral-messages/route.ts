import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chamberToken = searchParams.get('chamberToken');

    if (!chamberToken) {
      return NextResponse.json({ error: 'Chamber token required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Purge messages older than 24 hours
    const cutOff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await adminClient
      .from('kinkster_ephemeral_messages')
      .delete()
      .eq('chamber_token', chamberToken)
      .lt('created_at', cutOff);

    // 2. Fetch active messages
    const { data: messages } = await adminClient
      .from('kinkster_ephemeral_messages')
      .select(`
        id,
        chamber_token,
        sender_id,
        message_type,
        content,
        media_url,
        is_burnt,
        burn_countdown_seconds,
        created_at,
        kinkster_profiles(alias, avatar_url)
      `)
      .eq('chamber_token', chamberToken)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      success: true,
      messages: (messages || []).map((m: any) => ({
        id: m.id,
        senderId: m.sender_id,
        sender_id: m.sender_id,
        senderAlias: m.kinkster_profiles?.alias || 'member',
        isOwn: m.sender_id === user.id,
        messageType: m.message_type,
        message_type: m.message_type,
        content: (m.is_burnt || m.is_burned) ? '[Burned Photo • Destroyed]' : m.content,
        mediaUrl: (m.is_burnt || m.is_burned) ? null : m.media_url,
        media_url: (m.is_burnt || m.is_burned) ? null : m.media_url,
        isBurnt: !!(m.is_burnt || m.is_burned),
        is_burnt: !!(m.is_burnt || m.is_burned),
        is_burned: !!(m.is_burnt || m.is_burned),
        burnCountdown: m.burn_countdown_seconds || 5,
        createdAt: m.created_at,
        created_at: m.created_at,
      })),
    });
  } catch (err: any) {
    console.error('Ephemeral messages fetch error:', err);
    return NextResponse.json({ success: true, messages: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { chamberToken, content, messageType, mediaUrl, isBurnOnRead } = body;
    const resolvedMessageType = messageType || (isBurnOnRead ? 'burn_photo' : 'text');

    if (!chamberToken || (!content && !mediaUrl)) {
      return NextResponse.json({ error: 'Chamber token and content are required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { data: newMsg, error } = await adminClient
      .from('kinkster_ephemeral_messages')
      .insert({
        chamber_token: chamberToken,
        sender_id: user.id,
        message_type: resolvedMessageType,
        content: content || (resolvedMessageType === 'burn_photo' ? '🔥 [Burn on Read Photo]' : '🎙️ [Voice Whisper]'),
        media_url: mediaUrl || null,
        is_burnt: false,
        is_burned: false,
        burn_countdown_seconds: 5,
      })
      .select()
      .single();

    if (error) throw error;

    const normalizedMsg = Array.isArray(newMsg) ? newMsg[0] : newMsg;
    return NextResponse.json({ success: true, message: normalizedMsg });
  } catch (err: any) {
    console.error('Ephemeral message send error:', err);
    return NextResponse.json({ error: err.message || 'Failed to send whisper' }, { status: 500 });
  }
}

// Burn a photo on demand once the 5s timer expires
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { messageId, id } = body;
    const targetId = messageId || id;

    if (!targetId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const now = new Date().toISOString();

    // 1. Shred in canonical kinkster_messages table
    await adminClient
      .from('kinkster_messages')
      .update({
        is_burnt: true,
        burnt_at: now,
        content: '[Burned Photo • Shredded]',
        media_url: null,
      })
      .eq('id', targetId);

    // 2. Also shred in legacy chamber table if present
    await adminClient
      .from('kinkster_ephemeral_messages')
      .update({
        is_burnt: true,
        is_burned: true,
        burnt_at: now,
        burned_at: now,
        content: '[Burned Photo • Shredded]',
        media_url: null,
      })
      .eq('id', targetId);

    return NextResponse.json({ success: true, burnt: true, burned: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
