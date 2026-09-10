import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rankContentByLocation, LocationCoordinates } from '@/lib/location/relevance';

// Legacy slug aliases to canonical slugs
const LEGACY_SLUG_MAP: Record<string, string> = {
  'shibari-aesthetics': 'shibari-rope-bondage',
  'sensory-mindfulness': 'sensory-play',
  'noir-masquerade': 'role-play',
  'south-delhi-intimates': 'dominance',
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const adminSupabase = createAdminClient();

    // 1. Fetch User Discovery Location Preference
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

    // 2. Query Group by slug (checking exact slug first, then legacy alias fallback)
    let { data: group, error } = await adminSupabase
      .from('groups')
      .select(`
        *,
        kinkster_profiles!owner_id (
          id,
          alias,
          avatar_url,
          bio
        ),
        group_members (
          kinkster_id,
          role,
          status,
          joined_at,
          kinkster_profiles!kinkster_id (
            id,
            alias,
            avatar_url,
            is_in_person_vetted
          )
        )
      `)
      .eq('slug', slug)
      .maybeSingle();

    if (!group && LEGACY_SLUG_MAP[slug]) {
      const canonicalSlug = LEGACY_SLUG_MAP[slug];
      const { data: canonicalGroup } = await adminSupabase
        .from('groups')
        .select(`
          *,
          kinkster_profiles!owner_id (
            id,
            alias,
            avatar_url,
            bio
          ),
          group_members (
            kinkster_id,
            role,
            status,
            joined_at,
            kinkster_profiles!kinkster_id (
              id,
              alias,
              avatar_url,
              is_in_person_vetted
            )
          )
        `)
        .eq('slug', canonicalSlug)
        .maybeSingle();

      if (canonicalGroup) {
        group = canonicalGroup;
      }
    }

    if (!group) {
      return NextResponse.json({ error: 'Community not found.' }, { status: 404 });
    }

    // 3. User Membership and Access Control
    const userMembership = user
      ? group.group_members?.find((m: any) => m.kinkster_id === user.id)
      : null;

    const isOwner = user && group.owner_id === user.id;
    const isActiveMember = userMembership && userMembership.status === 'active';

    if (group.visibility === 'private' && !isOwner && !isActiveMember) {
      return NextResponse.json(
        {
          error: 'This community is private. You must be an approved member to view its content.',
          isPrivate: true,
          group: {
            id: group.id,
            name: group.name,
            slug: group.slug,
            description: group.description,
            category: group.category,
            visibility: group.visibility,
            is_canonical: group.is_canonical,
            avatar_url: group.avatar_url,
            cover_url: group.cover_url,
            members_count: group.members_count || 1,
            user_membership: userMembership ? { role: userMembership.role, status: userMembership.status } : null,
          }
        },
        { status: 403 }
      );
    }

    // 4. Fetch Posts for this community (direct group_id + multi-topic junction post_topics)
    const { data: postTopicRows } = await adminSupabase
      .from('post_topics')
      .select('post_id')
      .eq('group_id', group.id);

    const junctionPostIds = (postTopicRows || []).map((r: any) => r.post_id);

    let postsQuery = adminSupabase
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
        kinkster_profiles!kinkster_id (
          alias,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (junctionPostIds.length > 0) {
      postsQuery = postsQuery.or(`group_id.eq.${group.id},id.in.(${junctionPostIds.join(',')})`);
    } else {
      postsQuery = postsQuery.eq('group_id', group.id);
    }

    const { data: rawPosts } = await postsQuery;

    // Check user likes set
    let likedPostIds = new Set<string>();
    if (user) {
      const { data: userLikes } = await adminSupabase
        .from('kinkster_post_likes')
        .select('post_id')
        .eq('kinkster_id', user.id);
      (userLikes || []).forEach((l: any) => likedPostIds.add(l.post_id));
    }

    const postsWithLikes = (rawPosts || []).map((p: any) => ({
      ...p,
      is_liked: likedPostIds.has(p.id),
      likes_count: p.likes_count || 0,
    }));

    // Apply Invisible Location Relevance Ranking to community posts
    const rankedPosts = rankContentByLocation(
      postsWithLikes,
      userLoc,
      (p: any) => ({ city: p.city, region: p.region, country: p.country }),
      (p: any) => p.created_at,
      (p: any) => p.likes_count,
      locationDiscoveryEnabled
    );

    const finalPosts = rankedPosts.map(r => ({
      ...r.item,
      geoTier: r.geoTier,
    }));

    // 5. Fetch Events for this community (direct group_id + multi-topic junction event_topics)
    const { data: eventTopicRows } = await adminSupabase
      .from('event_topics')
      .select('event_id')
      .eq('group_id', group.id);

    const junctionEventIds = (eventTopicRows || []).map((r: any) => r.event_id);

    let eventsQuery = adminSupabase
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
        consent_marshall_name,
        status,
        spaces (
          title,
          city,
          images
        )
      `)
      .neq('status', 'draft')
      .order('event_date', { ascending: true });

    if (junctionEventIds.length > 0) {
      eventsQuery = eventsQuery.or(`group_id.eq.${group.id},id.in.(${junctionEventIds.join(',')})`);
    } else {
      eventsQuery = eventsQuery.eq('group_id', group.id);
    }

    const { data: rawEvents } = await eventsQuery;

    // Apply Location Relevance Ranking to community events
    const rankedEvents = rankContentByLocation(
      rawEvents || [],
      userLoc,
      (e: any) => ({ city: e.spaces?.city }),
      (e: any) => e.event_date,
      undefined,
      locationDiscoveryEnabled
    );

    const finalEvents = rankedEvents.map(r => ({
      ...r.item,
      geoTier: r.geoTier,
    }));

    // 6. Format active members
    const activeMembers = (group.group_members || [])
      .filter((m: any) => m.status === 'active')
      .map((m: any) => ({
        id: m.kinkster_id,
        role: m.role,
        joined_at: m.joined_at,
        alias: m.kinkster_profiles?.alias || 'anonymous',
        avatar_url: m.kinkster_profiles?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        is_in_person_vetted: m.kinkster_profiles?.is_in_person_vetted || false,
      }));

    const { group_members, ...cleanGroup } = group;

    return NextResponse.json({
      success: true,
      group: {
        ...cleanGroup,
        user_membership: userMembership
          ? { role: userMembership.role, status: userMembership.status }
          : null,
        members_count: activeMembers.length,
        members: activeMembers,
        events: finalEvents,
        posts: finalPosts,
      },
      locationContext: userLoc,
    });
  } catch (err: any) {
    console.error('Group detail GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: group } = await supabase
      .from('groups')
      .select('id, owner_id, is_canonical')
      .eq('slug', slug)
      .single();

    if (!group) {
      return NextResponse.json({ error: 'Community not found.' }, { status: 404 });
    }

    const isAdmin = user.email?.includes('admin') || user.app_metadata?.role === 'admin';

    // Canonical platform communities can only be updated by admins
    if (group.is_canonical && !isAdmin) {
      return NextResponse.json({ error: 'Canonical communities are platform-governed.' }, { status: 403 });
    }

    const isOwner = group.owner_id === user.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, rules, category, visibility, avatar_url, cover_url } = body;

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (name && !group.is_canonical) updates.name = name.trim();
    if (description) updates.description = description.trim();
    if (rules) updates.rules = rules.trim();
    if (category) updates.category = category;
    if (visibility && !group.is_canonical) updates.visibility = visibility;
    if (avatar_url) updates.avatar_url = avatar_url;
    if (cover_url) updates.cover_url = cover_url;

    const { data: updatedGroup, error: updateError } = await supabase
      .from('groups')
      .update(updates)
      .eq('id', group.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, group: updatedGroup });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: group } = await supabase
      .from('groups')
      .select('id, owner_id, is_canonical')
      .eq('slug', slug)
      .single();

    if (!group) {
      return NextResponse.json({ error: 'Community not found.' }, { status: 404 });
    }

    if (group.is_canonical) {
      return NextResponse.json({ error: 'Canonical communities cannot be deleted.' }, { status: 403 });
    }

    if (group.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only the group owner can delete this community.' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('groups')
      .delete()
      .eq('id', group.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Group successfully deleted.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
