import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rankContentByLocation, LocationCoordinates } from '@/lib/location/relevance';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const aliasParam = searchParams.get('alias');
    const groupIdParam = searchParams.get('group_id') || searchParams.get('groupId');

    const adminSupabase = createAdminClient();

    // 1. Fetch user discovery location preference
    let userLoc: LocationCoordinates | null = null;
    let locationDiscoveryEnabled = true;

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

    // 2. Build Query for Posts
    let query = adminSupabase
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
        group_id,
        kinkster_profiles!inner (
          alias,
          avatar_url,
          is_activated
        ),
        groups (
          id,
          name,
          slug,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (aliasParam) {
      query = query.eq('kinkster_profiles.alias', aliasParam.toLowerCase());
    }

    if (groupIdParam) {
      // Also check junction post_topics for this group
      const { data: junctionRows } = await adminSupabase
        .from('post_topics')
        .select('post_id')
        .eq('group_id', groupIdParam);

      const junctionPostIds = (junctionRows || []).map((r: any) => r.post_id);
      if (junctionPostIds.length > 0) {
        query = query.or(`group_id.eq.${groupIdParam},id.in.(${junctionPostIds.join(',')})`);
      } else {
        query = query.eq('group_id', groupIdParam);
      }
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('Error fetching kinkster posts from Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. User Likes
    let likedPostIds = new Set<string>();
    try {
      const { data: userLikes } = await adminSupabase
        .from('kinkster_post_likes')
        .select('post_id')
        .eq('kinkster_id', user.id);
      if (userLikes) {
        userLikes.forEach((l: any) => likedPostIds.add(l.post_id));
      }
    } catch (_) {}

    // 4. Comment Counts
    let commentCountsMap: Record<string, number> = {};
    try {
      const { data: comments } = await adminSupabase
        .from('kinkster_post_comments')
        .select('post_id');
      if (comments) {
        comments.forEach((c: any) => {
          commentCountsMap[c.post_id] = (commentCountsMap[c.post_id] || 0) + 1;
        });
      }
    } catch (_) {}

    const formattedPosts = (posts || []).map((p: any) => ({
      ...p,
      is_liked: likedPostIds.has(p.id),
      likes_count: p.likes_count || 0,
      comments_count: commentCountsMap[p.id] || 0,
    }));

    // 5. Apply Invisible Location Relevance Ranking
    // If querying by specific user alias, keep chronological order
    if (aliasParam) {
      return NextResponse.json({ posts: formattedPosts });
    }

    const ranked = rankContentByLocation(
      formattedPosts,
      userLoc,
      (p: any) => ({ city: p.city, region: p.region, country: p.country }),
      (p: any) => p.created_at,
      (p: any) => p.likes_count,
      locationDiscoveryEnabled
    );

    const finalPosts = ranked.map(r => ({
      ...r.item,
      geoTier: r.geoTier,
    }));

    return NextResponse.json({ posts: finalPosts });
  } catch (err: any) {
    console.error('Posts GET exception:', err);
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

    // Verify user profile is activated
    const { data: kinksterProfile } = await supabase
      .from('kinkster_profiles')
      .select('id, is_activated, discovery_location_city, discovery_location_region, discovery_location_country')
      .eq('id', user.id)
      .eq('is_activated', true)
      .single();

    if (!kinksterProfile) {
      return NextResponse.json(
        { error: 'You must activate Kinkster Mode before creating posts.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { media_type, media_url, caption, group_id, groupId, city, region, country } = body;

    if (!media_url) {
      return NextResponse.json({ error: 'Media URL is required.' }, { status: 400 });
    }

    const targetGroupId = group_id || groupId || null;

    // Coarse content location: Use explicit location provided or fallback to user's coarse discovery city
    const postCity = city || kinksterProfile.discovery_location_city || null;
    const postRegion = region || kinksterProfile.discovery_location_region || null;
    const postCountry = country || kinksterProfile.discovery_location_country || 'India';

    const adminSupabase = createAdminClient();

    const { data: post, error: insertError } = await adminSupabase
      .from('kinkster_posts')
      .insert({
        kinkster_id: user.id,
        media_type: media_type || 'image',
        media_url,
        caption: caption || '',
        group_id: targetGroupId,
        city: postCity,
        region: postRegion,
        country: postCountry,
      })
      .select(`
        *,
        kinkster_profiles (
          alias,
          avatar_url
        ),
        groups (
          id,
          name,
          slug
        )
      `)
      .single();

    if (insertError) {
      console.error('Post insertion error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // If targetGroupId is specified, also link in post_topics junction table
    if (targetGroupId) {
      try {
        await adminSupabase
          .from('post_topics')
          .insert({
            post_id: post.id,
            group_id: targetGroupId,
          });
      } catch (_) {}
    }

    return NextResponse.json({ success: true, post });
  } catch (err: any) {
    console.error('Post creation exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
