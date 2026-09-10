import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rankContentByLocation, LocationCoordinates } from '@/lib/location/relevance';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('group_id') || searchParams.get('groupId');
    const tier = searchParams.get('tier');

    const adminSupabase = createAdminClient();

    // 1. Fetch user discovery location preference
    let userLoc: LocationCoordinates | null = null;
    let locationDiscoveryEnabled = true;

    if (user) {
      const { data: profile } = await adminSupabase
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

    // 2. Query Sanctuary Events
    let query = adminSupabase
      .from('sanctuary_events')
      .select(`
        *,
        spaces (
          id,
          title,
          city,
          images
        ),
        groups (
          id,
          name,
          slug,
          category,
          avatar_url
        )
      `)
      .neq('status', 'draft')
      .order('event_date', { ascending: true });

    if (groupId) {
      // Check direct group_id and junction event_topics
      const { data: junctionEvents } = await adminSupabase
        .from('event_topics')
        .select('event_id')
        .eq('group_id', groupId);

      const junctionIds = (junctionEvents || []).map((j: any) => j.event_id);
      if (junctionIds.length > 0) {
        query = query.or(`group_id.eq.${groupId},id.in.(${junctionIds.join(',')})`);
      } else {
        query = query.eq('group_id', groupId);
      }
    }

    if (tier && tier !== 'all') {
      query = query.eq('tier', tier);
    }

    const { data: dbEvents, error } = await query;

    if (error) {
      console.error('Error querying sanctuary_events:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rawEvents = dbEvents || [];

    // 3. User Applications map
    const applicationsMap: Record<string, any> = {};
    if (user) {
      const { data: apps } = await adminSupabase
        .from('sanctuary_event_applications')
        .select('*')
        .eq('user_id', user.id);

      (apps || []).forEach((app: any) => {
        applicationsMap[app.event_id] = app;
      });
    }

    // 4. Apply Invisible Location Relevance Ranking
    const ranked = rankContentByLocation(
      rawEvents,
      userLoc,
      (e: any) => ({ city: e.spaces?.city }),
      (e: any) => e.event_date,
      undefined,
      locationDiscoveryEnabled
    );

    const finalEvents = ranked.map(r => ({
      ...r.item,
      geoTier: r.geoTier,
    }));

    return NextResponse.json({
      success: true,
      events: finalEvents,
      applications: applicationsMap,
    });
  } catch (err: any) {
    console.error('Kinkster Events GET exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
