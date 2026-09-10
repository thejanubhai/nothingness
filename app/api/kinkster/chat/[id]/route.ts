import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { MessagingService } from '@/lib/messaging/service';
import { resolveConversationContext } from '@/lib/messaging/context';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const conversationId = params.id;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const messagingService = new MessagingService(adminSupabase);

    // Verify user is a participant
    const { data: participant } = await adminSupabase
      .from('kinkster_conversation_participants')
      .select('status, role, is_muted')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!participant || participant.status === 'blocked' || participant.status === 'declined') {
      return NextResponse.json({ error: 'Conversation inaccessible.' }, { status: 403 });
    }

    // Fetch conversation details
    const { data: conversation } = await adminSupabase
      .from('kinkster_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
    }

    // Parse cursor for pagination (cursor = message timestamp or id)
    const { searchParams } = new URL(req.url);
    const before = searchParams.get('before'); // created_at ISO string
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    let query = adminSupabase
      .from('kinkster_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: rawMessages, error: mErr } = await query;
    if (mErr) throw mErr;

    // Filter out expired ephemeral messages server-side
    const now = Date.now();
    const validMessages = (rawMessages || []).filter(
      (m: any) => !m.expires_at || new Date(m.expires_at).getTime() > now
    );

    // Reverse to chronological order (oldest to newest)
    validMessages.reverse();

    // Fetch other participants
    const { data: otherParticipants } = await adminSupabase
      .from('kinkster_conversation_participants')
      .select('user_id, role, status, kinkster_profiles(id, alias, avatar_url, bio, is_in_person_vetted)')
      .eq('conversation_id', conversationId)
      .neq('user_id', user.id);

    const otherProfile = otherParticipants?.[0]?.kinkster_profiles as any;

    // Resolve context card
    const resolvedContext = await resolveConversationContext(
      adminSupabase,
      conversation.context_type,
      conversation.context_id,
      user.id
    );

    // Mark as read
    await messagingService.markConversationAsRead(conversationId, user.id);

    return NextResponse.json({
      success: true,
      conversation,
      receiver: otherProfile || null,
      context: resolvedContext,
      participantStatus: participant.status,
      isMuted: participant.is_muted,
      hasMore: (rawMessages || []).length === limit,
      messages: validMessages.map((m: any) => ({
        id: m.id,
        conversation_id: m.conversation_id,
        sender_id: m.sender_id,
        is_me: m.sender_id === user.id,
        message_type: m.message_type,
        content: m.is_burnt ? '[Burned Photo • Destroyed]' : m.content,
        media_url: m.is_burnt ? null : m.media_url,
        media_metadata: m.media_metadata,
        is_view_once: m.is_view_once,
        is_burnt: m.is_burnt,
        burnt_at: m.burnt_at,
        burn_countdown_seconds: m.burn_countdown_seconds,
        status: m.status,
        context_type: m.context_type,
        context_id: m.context_id,
        context_data: m.context_data,
        created_at: m.created_at,
      })),
    });
  } catch (err: any) {
    console.error('Conversation detail GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// Safety and participant actions: mute, leave, block, report
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const conversationId = params.id;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, targetUserId, reason, details } = await req.json();
    const adminSupabase = createAdminClient();

    if (action === 'mute') {
      const { data: part } = await adminSupabase
        .from('kinkster_conversation_participants')
        .select('is_muted')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .single();

      const nextMuted = !part?.is_muted;
      await adminSupabase
        .from('kinkster_conversation_participants')
        .update({ is_muted: nextMuted, updated_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      return NextResponse.json({ success: true, is_muted: nextMuted });
    }

    if (action === 'leave') {
      await adminSupabase
        .from('kinkster_conversation_participants')
        .update({ status: 'left', is_hidden: true, updated_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      return NextResponse.json({ success: true, message: 'Left conversation' });
    }

    if (action === 'block') {
      if (!targetUserId) {
        return NextResponse.json({ error: 'Target user ID required to block.' }, { status: 400 });
      }

      await adminSupabase
        .from('kinkster_blocks')
        .upsert({ blocker_id: user.id, blocked_id: targetUserId }, { onConflict: 'blocker_id,blocked_id' });

      await adminSupabase
        .from('kinkster_conversation_participants')
        .update({ status: 'blocked', is_hidden: true, updated_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      return NextResponse.json({ success: true, message: 'Member blocked.' });
    }

    if (action === 'report') {
      if (!reason) {
        return NextResponse.json({ error: 'Report reason is required.' }, { status: 400 });
      }

      await adminSupabase.from('kinkster_reports').insert({
        reporter_id: user.id,
        target_type: 'conversation',
        target_id: conversationId,
        reason,
        details: details || '',
        status: 'pending',
      });

      return NextResponse.json({ success: true, message: 'Report submitted confidentially.' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Conversation action POST error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
