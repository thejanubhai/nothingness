import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUserAdmin } from '@/lib/auth-utils';

async function checkAdminAuth(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  return isUserAdmin(user);
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!(await checkAdminAuth(supabase))) {
      return NextResponse.json({ error: 'Unauthorized. Admin required.' }, { status: 403 });
    }

    const adminClient = createAdminClient();

    // Fetch all events
    const { data: events, error: evErr } = await adminClient
      .from('sanctuary_events')
      .select(`
        *,
        spaces (
          id,
          title,
          city
        )
      `)
      .order('event_date', { ascending: false });

    if (evErr) return NextResponse.json({ error: evErr.message }, { status: 500 });

    // Fetch all applications
    const { data: apps } = await adminClient
      .from('sanctuary_event_applications')
      .select('*');

    // Fetch all passes
    const { data: passes } = await adminClient
      .from('sanctuary_passes')
      .select('*');

    // Fetch settings
    const { data: settings } = await adminClient
      .from('sanctuary_pass_settings')
      .select('*')
      .maybeSingle();

    // Fetch spaces for dropdown
    const { data: spaces } = await adminClient
      .from('spaces')
      .select('id, title, city')
      .order('title', { ascending: true });

    return NextResponse.json({
      success: true,
      events: events || [],
      applications: apps || [],
      passes: passes || [],
      settings: settings || { one_time_pass_price: 1499 },
      spaces: spaces || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!(await checkAdminAuth(supabase))) {
      return NextResponse.json({ error: 'Unauthorized. Admin required.' }, { status: 403 });
    }

    const adminClient = createAdminClient();
    const body = await req.json();

    const {
      id,
      title,
      tagline,
      description,
      tier,
      space_id,
      venue_notes,
      event_date,
      end_time,
      dress_code,
      consent_marshall_name,
      price_couples,
      price_females,
      price_males,
      price_nonbinary,
      max_couples,
      max_females,
      max_males,
      max_nonbinary,
      secret_location_address,
      secret_location_coordinates,
      secret_location_instructions,
      location_revealed_hours_before,
      status,
    } = body;

    if (!title || !event_date) {
      return NextResponse.json({ error: 'Title and Event Date are required.' }, { status: 400 });
    }

    const payload = {
      title,
      tagline: tagline || null,
      description: description || 'Exclusive Nothingness Gathering.',
      tier: tier || 'soiree',
      space_id: space_id || null,
      venue_notes: venue_notes || 'Nothingness Private Sanctuary',
      event_date,
      end_time: end_time || null,
      dress_code: dress_code || 'Noir Luxury',
      consent_marshall_name: consent_marshall_name || 'Aria (Floor Lead)',
      price_couples: price_couples !== undefined ? Number(price_couples) : 3999,
      price_females: price_females !== undefined ? Number(price_females) : 1499,
      price_males: price_males !== undefined ? Number(price_males) : 4999,
      price_nonbinary: price_nonbinary !== undefined ? Number(price_nonbinary) : 1999,
      max_couples: max_couples !== undefined ? Number(max_couples) : 6,
      max_females: max_females !== undefined ? Number(max_females) : 4,
      max_males: max_males !== undefined ? Number(max_males) : 3,
      max_nonbinary: max_nonbinary !== undefined ? Number(max_nonbinary) : 2,
      secret_location_address: secret_location_address || 'Revealed 3 hours prior',
      secret_location_coordinates: secret_location_coordinates || '28.5244,77.2066',
      secret_location_instructions: secret_location_instructions || 'Private elevator access.',
      location_revealed_hours_before: location_revealed_hours_before || 3,
      status: status || 'published',
      updated_at: new Date().toISOString(),
    };

    let eventRecord;
    if (id) {
      const { data, error } = await adminClient
        .from('sanctuary_events')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      eventRecord = data;
    } else {
      const { data, error } = await adminClient
        .from('sanctuary_events')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      eventRecord = data;
    }

    return NextResponse.json({ success: true, event: eventRecord });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!(await checkAdminAuth(supabase))) {
      return NextResponse.json({ error: 'Unauthorized. Admin required.' }, { status: 403 });
    }

    const { id } = await req.json();
    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from('sanctuary_events')
      .delete()
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
