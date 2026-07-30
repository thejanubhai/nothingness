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

    if (!receiverAlias) {
      return NextResponse.json({ error: 'Target alias is required.' }, { status: 400 });
    }

    // Lookup target user profile by alias
    const { data: receiverProfile } = await supabase
      .from('kinkster_profiles')
      .select('id, alias, avatar_url')
      .eq('alias', receiverAlias.toLowerCase())
      .single();

    if (!receiverProfile) {
      return NextResponse.json({ error: 'Recipient alias not found.' }, { status: 404 });
    }

    // Fetch conversation thread between logged-in user and receiver
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
