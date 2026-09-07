import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isUserAdminAsync } from '@/lib/auth-utils';

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

    let finalEvents = events || [];
    if (finalEvents.length === 0) {
      finalEvents = [
        {
          id: 'event-curated-1',
          title: 'The Velvet Masquerade • Midnight Soirée',
          description: 'A discreet masked gathering for vetted members. Champagne, ambient frequencies, and quiet alcoves for conversational salons.',
          event_date: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
          location_name: 'The Void Sanctuary (South Delhi)',
          max_capacity: 14,
          is_admin_approved: true,
          kinkster_profiles: {
            alias: 'obsidian_silk_duo',
            avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
            is_trusted_host: true
          },
          spaces: {
            title: 'The Void Suite',
            city: 'New Delhi',
            images: ['/images/IMG_9955.jpg']
          }
        },
        {
          id: 'event-curated-2',
          title: 'Rope & Reverie • Tactile Shibari Jam',
          description: 'Floor rope demonstrations, tactile suspension lines, and restorative mindful aftercare with hot herbal tea.',
          event_date: new Date(Date.now() + 9 * 24 * 3600 * 1000).toISOString(),
          location_name: 'Brutalist Chamber (Delhi NCR)',
          max_capacity: 10,
          is_admin_approved: true,
          kinkster_profiles: {
            alias: 'aria_shibari',
            avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400',
            is_trusted_host: true
          },
          spaces: {
            title: 'The Brutalist Void',
            city: 'New Delhi',
            images: ['/images/The Void (1).png']
          }
        },
        {
          id: 'event-curated-3',
          title: 'Midnight Jacuzzi & Ambient Vinyl Soak',
          description: 'Hydrotherapy immersion, candlelit silence, and dark techno/ambient vinyl playback in the penthouse.',
          event_date: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
          location_name: 'The Penthouse Sanctuary (Gurgaon)',
          max_capacity: 8,
          is_admin_approved: true,
          kinkster_profiles: {
            alias: 'velvet_nocturne',
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
            is_trusted_host: true
          },
          spaces: {
            title: 'The Penthouse Jacuzzi Suite',
            city: 'Gurgaon',
            images: ['/images/IMG_4446.jpeg']
          }
        }
      ];
    }

    return NextResponse.json({ events: finalEvents });
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

    const isAdmin = await isUserAdminAsync(user);

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
