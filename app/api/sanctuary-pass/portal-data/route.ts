import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';


function sanitizeEvents(rawEvents: any[], isVetted: boolean) {
  return rawEvents.map((evt: any) => {
    const requiresVetting = evt.tier === 'rave' || evt.tier === 'soiree' || evt.requires_munch_vetting === true;
    const isLocked = requiresVetting && !isVetted;

    // Pick clean cover image (avoid any promo text photos)
    let coverImage = evt.cover_image_url;
    if (!coverImage || coverImage.includes('we heard your feedback') || coverImage.includes('muscache')) {
      if (evt.tier === 'munch') coverImage = '/images/The Void (1).png';
      else if (evt.tier === 'rave') coverImage = '/images/IMG_9955.jpg';
      else coverImage = '/images/IMG_4446.jpeg';
    }

    if (isLocked) {
      return {
        id: evt.id,
        title: evt.title,
        tagline: evt.tagline,
        description: evt.description,
        tier: evt.tier,
        requires_munch_vetting: true,
        is_locked: true,
        cover_image_url: coverImage,
        // Classified / Redacted fields to protect guest privacy & secret dates
        event_date: null,
        display_date: '🔒 Date Classified • Level 2 Vetted Only',
        end_time: null,
        display_time: '🔒 Midnight • Members Only',
        venue_notes: '🔒 Secret Penthouse Sanctuary • Location Classified',
        spaces: {
          title: 'Confidential Sanctuary Penthouse',
          city: 'South Delhi (Classified)',
          images: [coverImage],
        },
        dress_code: evt.dress_code,
        consent_marshall_name: '🔒 Confidential Floor Guild',
        price_couples: evt.price_couples,
        price_females: evt.price_females,
        price_males: evt.price_males,
        price_nonbinary: evt.price_nonbinary,
        max_couples: evt.max_couples,
        max_females: evt.max_females,
        max_males: evt.max_males,
        max_nonbinary: evt.max_nonbinary,
      };
    }

    return {
      ...evt,
      is_locked: false,
      cover_image_url: coverImage,
      spaces: {
        title: evt.spaces?.title || (evt.tier === 'munch' ? 'The Dialogue Salon' : 'The Penthouse Sanctuary'),
        city: evt.spaces?.city || 'South Delhi',
        images: [coverImage],
      },
    };
  });
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    const adminClient = createAdminClient();

    // Fetch Sanctuary Pass price
    const { data: settings } = await adminClient
      .from('sanctuary_pass_settings')
      .select('one_time_pass_price')
      .maybeSingle();

    const passPrice = settings?.one_time_pass_price || 1499;

    // Fetch Published DB Events
    const { data: dbEvents, error: dbEventsError } = await adminClient
      .from('sanctuary_events')
      .select(`
        *,
        spaces (
          title,
          city,
          images
        )
      `)
      .neq('status', 'draft')
      .order('event_date', { ascending: true });

    if (dbEventsError) {
      console.error('Error fetching sanctuary events:', dbEventsError);
      return NextResponse.json({ error: dbEventsError.message }, { status: 500 });
    }

    const rawEvents = dbEvents || [];

    // 1. If unauthenticated, return public state with locked teasers for higher tiers!
    if (authError || !user) {
      return NextResponse.json({
        success: true,
        isLoggedIn: false,
        isIdVerified: false,
        hasSanctuaryPass: false,
        isInPersonVetted: false,
        passPrice,
        userAlias: 'Guest',
        events: sanitizeEvents(rawEvents, false),
        applications: [],
      });
    }

    // 2. Authenticated user data
    const { data: guestProfile } = await adminClient
      .from('guest_profiles')
      .select('is_verified, in_person_vetted, face_id_vetted, live_face_url')
      .or(`user_id.eq.${user.id},phone.eq.${user.phone || ''}`)
      .limit(1)
      .maybeSingle();

    const { data: pass } = await adminClient
      .from('sanctuary_passes')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: profile } = await adminClient
      .from('kinkster_profiles')
      .select('alias, in_person_vetted, face_id_vetted, live_face_url')
      .eq('id', user.id)
      .maybeSingle();

    const userAlias = profile?.alias || 'guest_' + user.id.slice(0, 5);

    const isInPersonVetted = !!(guestProfile?.in_person_vetted || profile?.in_person_vetted);
    const isFaceIdVetted = !!(guestProfile?.face_id_vetted || profile?.face_id_vetted);

    const { data: applications } = await adminClient
      .from('sanctuary_event_applications')
      .select('*')
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      isLoggedIn: true,
      isIdVerified: !!guestProfile?.is_verified,
      hasSanctuaryPass: pass?.status === 'active',
      isInPersonVetted,
      isFaceIdVetted,
      liveFaceUrl: guestProfile?.live_face_url || profile?.live_face_url || null,
      passPrice,
      userAlias,
      events: sanitizeEvents(rawEvents, isInPersonVetted),
      applications: applications || [],
    });
  } catch (err: any) {
    console.error('Portal Data Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
