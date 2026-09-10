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

    // Fetch user's pending request records
    const { data: pendingRequests, error } = await adminSupabase
      .from('kinkster_conversation_participants')
      .select(`
        conversation_id,
        status,
        created_at,
        kinkster_conversations (
          id,
          type,
          context_type,
          context_id,
          context_data,
          created_by,
          last_message_preview,
          last_message_at,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'pending_request')
      .eq('is_hidden', false);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!pendingRequests || pendingRequests.length === 0) {
      return NextResponse.json({ requests: [] });
    }

    const convoIds = pendingRequests.map((p: any) => p.conversation_id);

    // Fetch sender profile details for each request
    const { data: senders } = await adminSupabase
      .from('kinkster_conversation_participants')
      .select('conversation_id, user_id, kinkster_profiles(id, alias, avatar_url, bio, is_in_person_vetted)')
      .in('conversation_id', convoIds)
      .neq('user_id', user.id);

    const senderMap = new Map<string, any>();
    for (const s of senders || []) {
      if (!senderMap.has(s.conversation_id)) {
        senderMap.set(s.conversation_id, s.kinkster_profiles);
      }
    }

    // Resolve context for each request
    const requestsWithContext = await Promise.all(
      pendingRequests.map(async (pr: any) => {
        const convo = pr.kinkster_conversations;
        const senderProfile = senderMap.get(pr.conversation_id);
        const resolvedContext = convo?.context_type
          ? await resolveConversationContext(adminSupabase, convo.context_type, convo.context_id, user.id)
          : null;

        return {
          conversation_id: pr.conversation_id,
          sender: senderProfile || {
            alias: 'member',
            avatar_url: '/images/IMG_9955.jpg',
            bio: '',
            is_in_person_vetted: false,
          },
          last_message: convo?.last_message_preview || '',
          last_message_time: convo?.last_message_at || convo?.created_at,
          context: resolvedContext,
          created_at: pr.created_at,
        };
      })
    );

    return NextResponse.json({ requests: requestsWithContext });
  } catch (err: any) {
    console.error('Requests GET error:', err);
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

    const { conversation_id, action } = await req.json();

    if (!conversation_id || !['accept', 'decline', 'block', 'report'].includes(action)) {
      return NextResponse.json({ error: 'Valid conversation_id and action (accept/decline/block/report) required.' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const messagingService = new MessagingService(adminSupabase);

    if (action === 'report') {
      await adminSupabase.from('kinkster_reports').insert({
        reporter_id: user.id,
        target_type: 'conversation',
        target_id: conversation_id,
        reason: 'Unsolicited request abuse',
        status: 'pending',
      });
      // Also decline and hide
      await messagingService.handleMessageRequest(conversation_id, user.id, 'decline');
      return NextResponse.json({ success: true, action: 'report' });
    }

    const result = await messagingService.handleMessageRequest(conversation_id, user.id, action);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Requests POST error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
