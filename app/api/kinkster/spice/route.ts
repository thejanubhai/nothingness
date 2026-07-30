import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch incoming pending spice requests for this user
    const { data: requests, error } = await supabase
      .from('kinkster_spice_requests')
      .select(`
        *,
        kinkster_profiles!sender_id (
          alias,
          avatar_url,
          bio
        )
      `)
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ requests: requests || [] });
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

    const { target_alias } = await req.json();

    if (!target_alias) {
      return NextResponse.json({ error: 'Target alias is required.' }, { status: 400 });
    }

    // Lookup recipient profile
    const { data: receiverProfile } = await supabase
      .from('kinkster_profiles')
      .select('id')
      .eq('alias', target_alias.toLowerCase())
      .single();

    if (!receiverProfile) {
      return NextResponse.json({ error: 'Target alias not found.' }, { status: 404 });
    }

    if (receiverProfile.id === user.id) {
      return NextResponse.json({ error: 'You cannot Spice Up yourself.' }, { status: 400 });
    }

    // Check if reverse request exists (recipient already spiced sender)
    const { data: reverseRequest } = await supabase
      .from('kinkster_spice_requests')
      .select('id')
      .eq('sender_id', receiverProfile.id)
      .eq('receiver_id', user.id)
      .single();

    if (reverseRequest) {
      // Mutual Match Achieved! Update status to accepted
      await supabase
        .from('kinkster_spice_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', reverseRequest.id);

      return NextResponse.json({ success: true, is_mutual: true, message: "It's a Mutual Spice Up! In-app chat unlocked." });
    }

    // Upsert Spice Up request
    const { data: spiceReq, error: insertError } = await supabase
      .from('kinkster_spice_requests')
      .upsert({
        sender_id: user.id,
        receiver_id: receiverProfile.id,
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, is_mutual: false, spiceReq });
  } catch (err: any) {
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

    const { request_id, action } = await req.json();

    if (!request_id || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Request ID and valid action (accept/reject) are required.' }, { status: 400 });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    const { error: updateError } = await supabase
      .from('kinkster_spice_requests')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', request_id)
      .eq('receiver_id', user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: action === 'accept' ? "Spice Up Back confirmed! Chat unlocked." : "Request discretely dismissed."
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
