import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rankContentByLocation, LocationCoordinates } from '@/lib/location/relevance';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';
    const dimension = searchParams.get('type') || 'all'; // 'all' | 'people' | 'communities' | 'events' | 'posts' | 'topics'

    if (!query) {
      return NextResponse.json({
        success: true,
        query: '',
        people: [],
        communities: [],
        events: [],
        posts: [],
        topics: [],
      });
    }

    const adminClient = createAdminClient();

    // Fetch user discovery location preference if authenticated
    let userLoc: LocationCoordinates | null = null;
    let locationDiscoveryEnabled = true;

    if (user) {
      const { data: profile } = await adminClient
        .from('kinkster_profiles')
        .select('discovery_location_city, discovery_location_region, discovery_location_country, discovery_location_enabled')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        userLoc = {
          city: profile.discovery_location_city || 'Delhi',
          region: profile.discovery_location_region || 'North India',
          country: profile.discovery_location_country || 'India',
        };
        locationDiscoveryEnabled = profile.discovery_location_enabled !== false;
      }
    }

    const safePattern = `%${query.toLowerCase()}%`;

    // 1. Communities & Topics (Exact canonical 50 records + legacy)
    let matchedCommunities: any[] = [];
    let matchedTopics: any[] = [];
    if (dimension === 'all' || dimension === 'communities' || dimension === 'topics') {
      const { data: groups, error: groupErr } = await adminClient
        .from('groups')
        .select('id, name, slug, description, category, visibility, avatar_url, cover_url, is_canonical, display_order')
        .eq('moderation_state', 'active')
        .or(`name.ilike.${safePattern},slug.ilike.${safePattern},description.ilike.${safePattern},category.ilike.${safePattern}`)
        .order('is_canonical', { ascending: false })
        .order('display_order', { ascending: true })
        .limit(20);

      if (!groupErr && groups) {
        matchedCommunities = groups.filter((g: any) => g.is_canonical);
        matchedTopics = groups.map((g: any) => ({
          id: g.id,
          name: g.name,
          slug: g.slug,
          is_canonical: g.is_canonical,
        }));
      }
    }

    // 2. People / Vetted Profiles (Zero leak of private columns)
    let matchedPeople: any[] = [];
    if (dimension === 'all' || dimension === 'people') {
      const { data: profiles, error: profErr } = await adminClient
        .from('kinkster_profiles')
        .select('id, alias, bio, avatar_url, interests, is_in_person_vetted, is_trusted_host')
        .eq('is_activated', true)
        .or(`alias.ilike.${safePattern},bio.ilike.${safePattern}`)
        .limit(20);

      if (!profErr && profiles) {
        // Filter out the searching user's own profile
        matchedPeople = (profiles || []).filter((p: any) => p.id !== user?.id);
      }
    }

    // 3. Events (Published real events)
    let matchedEvents: any[] = [];
    if (dimension === 'all' || dimension === 'events') {
      const { data: events, error: eventErr } = await adminClient
        .from('sanctuary_events')
        .select(`
          id,
          title,
          tagline,
          description,
          tier,
          event_date,
          end_time,
          dress_code,
          spaces (
            title,
            city
          ),
          groups (
            id,
            name,
            slug
          )
        `)
        .eq('status', 'published')
        .or(`title.ilike.${safePattern},tagline.ilike.${safePattern},description.ilike.${safePattern}`)
        .order('event_date', { ascending: true })
        .limit(20);

      if (!eventErr && events) {
        // Rank events by user's location
        const ranked = rankContentByLocation(
          events,
          userLoc,
          (e: any) => ({ city: e.spaces?.city }),
          (e: any) => e.event_date,
          undefined,
          locationDiscoveryEnabled
        );
        matchedEvents = ranked.map(r => ({ ...r.item, geoTier: r.geoTier }));
      }
    }

    // 4. Posts (Real posts matching caption)
    let matchedPosts: any[] = [];
    if (dimension === 'all' || dimension === 'posts') {
      const { data: posts, error: postErr } = await adminClient
        .from('kinkster_posts')
        .select(`
          id,
          media_type,
          media_url,
          caption,
          likes_count,
          created_at,
          city,
          region,
          country,
          kinkster_profiles!kinkster_id (
            alias,
            avatar_url
          ),
          groups (
            id,
            name,
            slug
          )
        `)
        .ilike('caption', safePattern)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!postErr && posts) {
        const rankedPosts = rankContentByLocation(
          posts,
          userLoc,
          (p: any) => ({ city: p.city, region: p.region, country: p.country }),
          (p: any) => p.created_at,
          (p: any) => p.likes_count,
          locationDiscoveryEnabled
        );
        matchedPosts = rankedPosts.map(r => ({ ...r.item, geoTier: r.geoTier }));
      }
    }

    return NextResponse.json({
      success: true,
      query,
      resultsCount: matchedCommunities.length + matchedPeople.length + matchedEvents.length + matchedPosts.length,
      communities: matchedCommunities,
      topics: matchedTopics,
      people: matchedPeople,
      events: matchedEvents,
      posts: matchedPosts,
    });
  } catch (err: any) {
    console.error('Universal Search error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
