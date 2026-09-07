import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const receiverAlias = searchParams.get('alias');

    // If alias is provided: return conversation thread for that recipient
    if (receiverAlias) {
      const { data: receiverProfile } = await supabase
        .from('kinkster_profiles')
        .select('id, alias, avatar_url')
        .eq('alias', receiverAlias.toLowerCase())
        .single();

      if (!receiverProfile) {
        return NextResponse.json({ error: 'Recipient alias not found.' }, { status: 404 });
      }

      const { data: messages, error } = await supabase
        .from('kinkster_direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverProfile.id}),and(sender_id.eq.${receiverProfile.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        receiver: receiverProfile,
        messages: messages || []
      });
    }

    // If alias is NOT provided: return list of active conversations/inbox threads
    const { data: allMessages, error: msgsError } = await supabase
      .from('kinkster_direct_messages')
      .select('id, sender_id, receiver_id, message, media_url, is_read, created_at')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (msgsError) {
      return NextResponse.json({ error: msgsError.message }, { status: 500 });
    }

    const otherUserIds = new Set<string>();
    const threadMap: Record<string, { lastMessage: any; unreadCount: number }> = {};

    for (const msg of allMessages || []) {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      otherUserIds.add(otherId);

      if (!threadMap[otherId]) {
        threadMap[otherId] = {
          lastMessage: msg,
          unreadCount: 0,
        };
      }
      if (msg.receiver_id === user.id && !msg.is_read) {
        threadMap[otherId].unreadCount += 1;
      }
    }

    // Also include mutual spice matches so conversations can start instantly
    const { data: spiceAccepted } = await supabase
      .from('kinkster_spice_requests')
      .select('sender_id, receiver_id')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    for (const sp of spiceAccepted || []) {
      const otherId = sp.sender_id === user.id ? sp.receiver_id : sp.sender_id;
      otherUserIds.add(otherId);
      if (!threadMap[otherId]) {
        threadMap[otherId] = {
          lastMessage: {
            message: 'Mutual Spice 🔥 Say hello!',
            created_at: new Date().toISOString(),
            is_read: true,
          },
          unreadCount: 0,
        };
      }
    }

    let conversations: any[] = [];
    if (otherUserIds.size > 0) {
      const { data: profiles } = await supabase
        .from('kinkster_profiles')
        .select('id, alias, avatar_url, bio')
        .in('id', Array.from(otherUserIds));

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      conversations = Array.from(otherUserIds).map(id => {
        const prof = profileMap.get(id);
        const thread = threadMap[id];
        return {
          id,
          alias: prof?.alias || 'anonymous',
          avatar_url: prof?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
          bio: prof?.bio || '',
          last_message: thread?.lastMessage?.message || '',
          last_message_time: thread?.lastMessage?.created_at,
          unread_count: thread?.unreadCount || 0,
        };
      });

      conversations.sort((a, b) => new Date(b.last_message_time || 0).getTime() - new Date(a.last_message_time || 0).getTime());
    }

    return NextResponse.json({ conversations });
  } catch (err: any) {
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

    // Ensure sender profile is activated
    const { data: senderProfile } = await supabase
      .from('kinkster_profiles')
      .select('id, is_activated')
      .eq('id', user.id)
      .eq('is_activated', true)
      .single();

    if (!senderProfile) {
      return NextResponse.json(
        { error: 'You must activate Kinkster Mode before sending in-app messages.' },
        { status: 403 }
      );
    }

    const { receiver_alias, message, media_url, is_view_once } = await req.json();

    if (!receiver_alias || (!message && !media_url)) {
      return NextResponse.json({ error: 'Message content and recipient alias are required.' }, { status: 400 });
    }

    // Lookup recipient by alias
    const { data: receiverProfile } = await supabase
      .from('kinkster_profiles')
      .select('id')
      .eq('alias', receiver_alias.toLowerCase())
      .eq('is_activated', true)
      .single();

    if (!receiverProfile) {
      return NextResponse.json({ error: 'Recipient alias not found or not activated.' }, { status: 404 });
    }

    const { data: newMessage, error: insertError } = await supabase
      .from('kinkster_direct_messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverProfile.id,
        message: message || '',
        media_url: media_url || null,
        is_view_once: is_view_once || false
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: newMessage });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
