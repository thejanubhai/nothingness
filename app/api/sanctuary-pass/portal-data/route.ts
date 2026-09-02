import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Helper to generate dynamic upcoming flagship gatherings
function getFlagshipGatherings() {
  const now = new Date();
  
  // Event 1: Next Saturday (e.g. 3-8 days ahead)
  const d1 = new Date(now);
  d1.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7 || 7));
  d1.setHours(22, 0, 0, 0);

  // Event 2: Next Thursday
  const d2 = new Date(now);
  d2.setDate(now.getDate() + ((4 - now.getDay() + 7) % 7 || 5));
  d2.setHours(19, 30, 0, 0);

  // Event 3: Following Friday (12-14 days ahead)
  const d3 = new Date(now);
  d3.setDate(now.getDate() + ((5 - now.getDay() + 14) % 7 || 12));
  d3.setHours(23, 0, 0, 0);

  return [
    {
      id: 'flagship-velvet-masquerade',
      title: 'The Velvet Masquerade: Midnight Noir & Sensory Immersion',
      tagline: 'Anonymity, Ambient Dark Vinyl & Masked Chemistry',
      tier: 'rave' as const,
      event_date: d1.toISOString(),
      end_time: '04:00 AM',
      dress_code: 'Noir Luxury • Silk Cravats, Leather Corsetry & Velvet Masks',
      consent_marshall_name: 'Aria & Kael',
      price_couples: 6999,
      price_females: 1999,
      price_males: 7999,
      price_nonbinary: 2499,
      max_couples: 15,
      max_females: 20,
      max_males: 5,
      max_nonbinary: 10,
      description: 'An underground midnight masquerade across our secluded South Delhi penthouse sanctuary. Live dark ambient soundscapes, curated craft bar, discreet lounge alcoves, and mandatory camera-ban tamper seals. Floor leads present at all times to maintain flawless etiquette.',
      spaces: {
        title: 'The Penthouse Sanctuary',
        city: 'South Delhi',
        images: ['/images/IMG_9955.jpg']
      }
    },
    {
      id: 'flagship-shibari-salon',
      title: 'Rope & Reverie: The Shibari Dialogue Salon',
      tagline: 'Sensory Artistry, Power Exchange & Mindful Aftercare',
      tier: 'munch' as const,
      event_date: d2.toISOString(),
      end_time: '11:30 PM',
      dress_code: 'Minimalist Noir • Textured Linen & Structured Silhouettes',
      consent_marshall_name: 'Master Rigger Dev & Maya',
      price_couples: 3999,
      price_females: 1499,
      price_males: 4499,
      price_nonbinary: 1999,
      max_couples: 12,
      max_females: 15,
      max_males: 8,
      max_nonbinary: 6,
      description: 'An intimate evening of technical suspension demonstrations, discussion on psychological power dynamics in modern relationships, anatomical safety considerations, and deep aftercare protocols. Accompanied by fine wine and quiet music.',
      spaces: {
        title: 'The Brutalist Void',
        city: 'New Delhi',
        images: ['/images/The Void (1).png']
      }
    },
    {
      id: 'flagship-obsidian-soiree',
      title: 'The Obsidian Soirée: Deep Surrender & High Discretion',
      tagline: 'Strictly Capped to 8 Couples • Private Jacuzzis & Suspension Suites',
      tier: 'soiree' as const,
      event_date: d3.toISOString(),
      end_time: '05:00 AM',
      dress_code: 'Noir Elegance • Dark Silk Robes & Statement Collars',
      consent_marshall_name: 'Sovereign Floor Guild',
      price_couples: 9999,
      price_females: 2999,
      price_males: 9999,
      price_nonbinary: 3499,
      max_couples: 8,
      max_females: 10,
      max_males: 3,
      max_nonbinary: 4,
      description: 'Our most intimate and exclusive gathering. Strictly limited to vetted couples and sovereign members. Features private jacuzzi soaks, industrial ceiling suspension rigs, sensory isolation chambers, and bespoke champagne service.',
      spaces: {
        title: 'The Obsidian Suite',
        city: 'South Delhi',
        images: ['/images/IMG_4446.jpeg']
      }
    }
  ];
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
    const { data: dbEvents } = await adminClient
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

    // If no DB events, supply our curated flagship gatherings so guests are always hooked
    const events = (dbEvents && dbEvents.length > 0) ? dbEvents : getFlagshipGatherings();

    // 1. If unauthenticated, return public state with real upcoming gatherings!
    if (authError || !user) {
      return NextResponse.json({
        success: true,
        isLoggedIn: false,
        isIdVerified: false,
        hasSanctuaryPass: false,
        passPrice,
        userAlias: 'Guest',
        events,
        applications: [],
      });
    }

    // 2. Authenticated user data
    const { data: guestProfile } = await adminClient
      .from('guest_profiles')
      .select('is_verified')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: pass } = await adminClient
      .from('sanctuary_passes')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: profile } = await adminClient
      .from('kinkster_profiles')
      .select('alias')
      .eq('id', user.id)
      .maybeSingle();

    const userAlias = profile?.alias || 'guest_' + user.id.slice(0, 5);

    const { data: applications } = await adminClient
      .from('sanctuary_event_applications')
      .select('*')
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      isLoggedIn: true,
      isIdVerified: !!guestProfile?.is_verified,
      hasSanctuaryPass: pass?.status === 'active',
      passPrice,
      userAlias,
      events,
      applications: applications || [],
    });
  } catch (err: any) {
    console.error('Portal Data Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
