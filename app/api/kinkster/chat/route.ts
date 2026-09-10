import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { MessagingService } from '@/lib/messaging/service';
import { resolveConversationContext } from '@/lib/messaging/context';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const messagingService = new MessagingService(adminSupabase);
    const { searchParams } = new URL(req.url);
    const receiverAlias = searchParams.get('alias');
    const tab = searchParams.get('tab') || 'all';
    const query = (searchParams.get('query') || '').trim().toLowerCase();

    // CASE 1: Fetch specific thread by recipient @alias
    if (receiverAlias) {
      const cleanAlias = receiverAlias.replace('@', '').toLowerCase();
      const { data: receiverProfile } = await adminSupabase
        .from('kinkster_profiles')
        .select('id, alias, avatar_url, bio, is_in_person_vetted')
        .eq('alias', cleanAlias)
        .maybeSingle();

      if (!receiverProfile) {
        return NextResponse.json({ error: 'Recipient alias not found.' }, { status: 404 });
      }

      // Look up or establish direct conversation
      const { conversation, requiresRequest } = await messagingService.getOrCreateDirectConversation({
        senderId: user.id,
        recipientId: receiverProfile.id,
      });

      // Fetch messages for this conversation
      const { data: messages, error: msgsError } = await adminSupabase
        .from('kinkster_messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (msgsError) {
        return NextResponse.json({ error: msgsError.message }, { status: 500 });
      }

      // Resolve context banner if conversation has context
      const context = await resolveConversationContext(
        adminSupabase,
        conversation.context_type,
        conversation.context_id,
        user.id
      );

      // Auto mark as read on open
      await messagingService.markConversationAsRead(conversation.id, user.id);

      return NextResponse.json({
        success: true,
        conversation,
        receiver: receiverProfile,
        context,
        requiresRequest,
        messages: (messages || []).map((m: any) => ({
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
    }

    // CASE 2: List user's conversations / inbox threads with filter tabs
    // Fetch user's participant records
    let participantQuery = adminSupabase
      .from('kinkster_conversation_participants')
      .select(`
        conversation_id,
        role,
        status,
        last_read_at,
        unread_count,
        is_muted,
        is_hidden,
        kinkster_conversations (
          id,
          type,
          title,
          context_type,
          context_id,
          context_data,
          created_by,
          last_message_at,
          last_message_preview,
          retention_policy,
          expires_at,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .eq('is_hidden', false);

    if (tab === 'requests') {
      participantQuery = participantQuery.eq('status', 'pending_request');
    } else {
      participantQuery = participantQuery.in('status', ['active', 'muted']);
    }

    const { data: userParticipants, error: pErr } = await participantQuery;

    if (pErr) {
      return NextResponse.json({ error: pErr.message }, { status: 500 });
    }

    const convosList = (userParticipants || [])
      .map((p: any) => ({
        ...p.kinkster_conversations,
        participantStatus: p.status,
        unreadCount: p.unread_count || 0,
        isMuted: p.is_muted,
        lastReadAt: p.last_read_at,
      }))
      .filter((c: any) => !!c && !!c.id);

    // Apply tab filters
    const filteredByTab = convosList.filter((c: any) => {
      if (tab === 'requests') return c.participantStatus === 'pending_request';
      if (tab === 'people') return c.type === 'DIRECT';
      if (tab === 'resonance') return c.type === 'RESONANCE';
      if (tab === 'events') return c.type === 'EVENT' || c.context_type === 'event';
      if (tab === 'communities') return c.type === 'COMMUNITY' || c.context_type === 'community';
      if (tab === 'ephemeral') return c.type === 'EPHEMERAL' || (c.retention_policy && c.retention_policy !== 'permanent');
      return true; // 'all'
    });

    if (filteredByTab.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    // Fetch other participants' profile data for these conversations
    const convoIds = filteredByTab.map((c: any) => c.id);
    const { data: allParticipants } = await adminSupabase
      .from('kinkster_conversation_participants')
      .select('conversation_id, user_id, kinkster_profiles(id, alias, avatar_url, bio, is_in_person_vetted)')
      .in('conversation_id', convoIds)
      .neq('user_id', user.id);

    const convoOtherMap = new Map<string, any>();
    for (const ap of allParticipants || []) {
      if (!convoOtherMap.has(ap.conversation_id)) {
        convoOtherMap.set(ap.conversation_id, ap.kinkster_profiles);
      }
    }

    const formattedConversations = filteredByTab.map((c: any) => {
      const otherProfile = convoOtherMap.get(c.id);
      return {
        id: c.id,
        type: c.type,
        title: c.title || (otherProfile ? `@${otherProfile.alias}` : 'Sanctuary Conversation'),
        alias: otherProfile?.alias || 'anonymous',
        avatar_url: otherProfile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        bio: otherProfile?.bio || '',
        is_vetted: !!otherProfile?.is_in_person_vetted,
        context_type: c.context_type,
        context_id: c.context_id,
        context_data: c.context_data,
        last_message: c.last_message_preview || '',
        last_message_time: c.last_message_at,
        unread_count: c.unreadCount || 0,
        retention_policy: c.retention_policy,
        expires_at: c.expires_at,
        is_muted: c.isMuted,
        status: c.participantStatus,
      };
    });

    // Apply search query filter if present
    const searched = query
      ? formattedConversations.filter(
          (c) =>
            c.alias.toLowerCase().includes(query) ||
            c.title.toLowerCase().includes(query) ||
            c.last_message.toLowerCase().includes(query)
        )
      : formattedConversations;

    // Order by latest message
    searched.sort(
      (a, b) => new Date(b.last_message_time || 0).getTime() - new Date(a.last_message_time || 0).getTime()
    );

    return NextResponse.json({ conversations: searched });
  } catch (err: any) {
    console.error('Chat GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
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
    const {
      conversation_id,
      receiver_alias,
      message,
      media_url,
      message_type = 'text',
      is_view_once = false,
      idempotency_key,
      context_type,
      context_id,
      context_data,
    } = body;

    const adminSupabase = createAdminClient();
    const messagingService = new MessagingService(adminSupabase);

    let targetConvoId = conversation_id;

    // If conversation_id not supplied, resolve from receiver_alias
    if (!targetConvoId && receiver_alias) {
      const cleanAlias = receiver_alias.replace('@', '').toLowerCase();
      const { data: targetProfile } = await adminSupabase
        .from('kinkster_profiles')
        .select('id')
        .eq('alias', cleanAlias)
        .maybeSingle();

      if (!targetProfile) {
        return NextResponse.json({ error: 'Recipient alias not found.' }, { status: 404 });
      }

      const { conversation } = await messagingService.getOrCreateDirectConversation({
        senderId: user.id,
        recipientId: targetProfile.id,
        contextType: context_type,
        contextId: context_id,
        contextData: context_data,
      });

      targetConvoId = conversation.id;
    }

    if (!targetConvoId) {
      return NextResponse.json({ error: 'Conversation ID or recipient alias is required.' }, { status: 400 });
    }

    if (!message && !media_url) {
      return NextResponse.json({ error: 'Message text or media is required.' }, { status: 400 });
    }

    const { message: sentMessage, isDuplicate } = await messagingService.sendMessage({
      conversationId: targetConvoId,
      senderId: user.id,
      content: message || '',
      messageType: is_view_once ? 'burn_photo' : message_type,
      mediaUrl: media_url || null,
      isViewOnce: is_view_once,
      idempotencyKey: idempotency_key || null,
      contextType: context_type || null,
      contextId: context_id || null,
      contextData: context_data || {},
    });

    return NextResponse.json({
      success: true,
      isDuplicate,
      message: sentMessage,
    });
  } catch (err: any) {
    console.error('Chat POST error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversation_id, alias } = await req.json();
    const adminSupabase = createAdminClient();
    const messagingService = new MessagingService(adminSupabase);

    let targetConvoId = conversation_id;

    if (!targetConvoId && alias) {
      const cleanAlias = alias.replace('@', '').toLowerCase();
      const { data: targetProfile } = await adminSupabase
        .from('kinkster_profiles')
        .select('id')
        .eq('alias', cleanAlias)
        .maybeSingle();

      if (targetProfile) {
        const { conversation } = await messagingService.getOrCreateDirectConversation({
          senderId: user.id,
          recipientId: targetProfile.id,
        });
        targetConvoId = conversation.id;
      }
    }

    if (!targetConvoId) {
      return NextResponse.json({ error: 'Target conversation ID or recipient alias required.' }, { status: 400 });
    }

    await messagingService.markConversationAsRead(targetConvoId, user.id);

    return NextResponse.json({ success: true, message: 'Conversation marked as read.' });
  } catch (err: any) {
    console.error('Chat PATCH error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
