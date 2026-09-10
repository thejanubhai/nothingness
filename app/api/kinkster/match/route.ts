import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { evaluateGeographicTier, LocationCoordinates } from '@/lib/location/relevance';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // 1. Fetch user discovery location preference
    let userLoc: LocationCoordinates | null = null;
    let locationDiscoveryEnabled = true;

    const { data: currentProfile } = await adminSupabase
      .from('kinkster_profiles')
      .select('discovery_location_city, discovery_location_region, discovery_location_country, discovery_location_enabled')
      .eq('id', user.id)
      .maybeSingle();

    if (currentProfile) {
      userLoc = {
        city: currentProfile.discovery_location_city || 'Delhi',
        region: currentProfile.discovery_location_region || 'North India',
        country: currentProfile.discovery_location_country || 'India',
      };
      locationDiscoveryEnabled = currentProfile.discovery_location_enabled !== false;
    }

    // 2. Fetch current user's preferences
    const { data: userPrefs, error: userPrefsError } = await adminSupabase
      .from('kinkster_preferences')
      .select('kink_id, intensity')
      .eq('kinkster_id', user.id);

    if (userPrefsError) {
      return NextResponse.json({ error: userPrefsError.message }, { status: 500 });
    }

    const userKinkMap = new Map<string, number>();
    (userPrefs || []).forEach(p => userKinkMap.set(p.kink_id, p.intensity));

    // 3. Fetch all other active vetted Kinksters
    const { data: profiles, error: profileError } = await adminSupabase
      .from('kinkster_profiles')
      .select(`
        id,
        alias,
        bio,
        avatar_url,
        interests,
        health_badges,
        audio_vibe_url,
        is_trusted_host,
        discovery_location_city,
        discovery_location_region,
        discovery_location_country,
        created_at,
        kinkster_preferences (
          kink_id,
          intensity,
          kinkster_kinks (
            name,
            category
          )
        )
      `)
      .eq('is_activated', true)
      .neq('id', user.id);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // 4. Compute Vibe Match Score (%) and location relevance for each DB profile
    const matchedProfiles = (profiles || []).map((prof: any) => {
      const otherPrefs: any[] = prof.kinkster_preferences || [];
      let totalOverlapPoints = 0;
      const maxPossiblePoints = Math.max(1, userKinkMap.size * 5);

      const kinkTags: string[] = [];

      otherPrefs.forEach(op => {
        kinkTags.push(op.kinkster_kinks?.name || op.kink_id);
        if (userKinkMap.has(op.kink_id)) {
          const userIntensity = userKinkMap.get(op.kink_id)!;
          const diff = Math.abs(userIntensity - op.intensity);
          totalOverlapPoints += (5 - diff);
        }
      });

      let matchScore = 65;
      if (userKinkMap.size > 0 && otherPrefs.length > 0) {
        const rawScore = Math.round((totalOverlapPoints / maxPossiblePoints) * 35);
        matchScore = Math.min(99, 65 + rawScore);
      } else if (otherPrefs.length > 0) {
        matchScore = 78;
      }

      const geoResult = evaluateGeographicTier(
        userLoc,
        {
          city: prof.discovery_location_city,
          region: prof.discovery_location_region,
          country: prof.discovery_location_country,
        },
        locationDiscoveryEnabled
      );

      return {
        id: prof.id,
        alias: prof.alias,
        bio: prof.bio,
        avatar_url: prof.avatar_url,
        interests: prof.interests || [],
        kink_tags: kinkTags,
        match_score: matchScore,
        location_scope: geoResult.tier,
        location_score: geoResult.score,
        health_badges: prof.health_badges || [],
        audio_vibe_url: prof.audio_vibe_url || null,
        is_trusted_host: prof.is_trusted_host || false
      };
    });

    // Sort by highest match score
    matchedProfiles.sort((a, b) => b.match_score - a.match_score);

    return NextResponse.json({
      matches: matchedProfiles,
      locationContext: {
        city: userLoc?.city || 'Delhi',
        region: userLoc?.region || 'North India',
        country: userLoc?.country || 'India',
        enabled: locationDiscoveryEnabled,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
