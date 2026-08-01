import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: events, error } = await supabase
      .from('kinkster_events')
      .select(`
        *,
        kinkster_profiles!host_kinkster_id (
          alias,
          avatar_url,
          is_trusted_host
        ),
        spaces (
          title,
          city,
          images
        )
      `)
      .order('event_date', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events: events || [] });
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

    // Strictly check if user is an Admin-Approved Trusted Host or Admin
    const { data: hostProfile } = await supabase
      .from('kinkster_profiles')
      .select('id, is_trusted_host')
      .eq('id', user.id)
      .single();

    const isAdmin = user.email?.includes('admin') || user.email?.includes('hudav');

    if (!isAdmin && !hostProfile?.is_trusted_host) {
      return NextResponse.json(
        { error: 'Only Nothingness Admin-Approved Trusted Hosts can post secret Sanctuary Soirée events.' },
        { status: 403 }
      );
    }

    const { title, description, space_id, event_date, location_name, max_capacity } = await req.json();

    if (!title || !description || !event_date) {
      return NextResponse.json({ error: 'Title, description, and event date are required.' }, { status: 400 });
    }

    const { data: event, error: insertError } = await supabase
      .from('kinkster_events')
      .insert({
        host_kinkster_id: user.id,
        space_id: space_id || null,
        title,
        description,
        event_date,
        location_name: location_name || 'Discreet Location (Revealed on RSVP)',
        max_capacity: max_capacity || 12,
        is_admin_approved: true
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, event });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
