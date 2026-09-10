import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const adminSupabase = createAdminClient();

    // Query canonical communities from public.groups
    const { data: canonicalGroups, error: groupError } = await adminSupabase
      .from('groups')
      .select('id, name, slug, description, rules, category, visibility, avatar_url, cover_url, display_order, created_at')
      .eq('is_canonical', true)
      .eq('moderation_state', 'active')
      .order('display_order', { ascending: true });

    if (groupError) {
      console.error('Error fetching canonical taxonomy:', groupError);
      return NextResponse.json({ error: groupError.message }, { status: 500 });
    }

    const groupIds = (canonicalGroups || []).map((g: any) => g.id);

    // Aggregate real post counts per canonical topic
    const postCounts: Record<string, number> = {};
    if (groupIds.length > 0) {
      // 1. Direct group_id on kinkster_posts
      const { data: directPosts } = await adminSupabase
        .from('kinkster_posts')
        .select('group_id')
        .in('group_id', groupIds);
      (directPosts || []).forEach((p: any) => {
        if (p.group_id) postCounts[p.group_id] = (postCounts[p.group_id] || 0) + 1;
      });

      // 2. Multi-topic junction post_topics
      const { data: junctionPosts } = await adminSupabase
        .from('post_topics')
        .select('group_id')
        .in('group_id', groupIds);
      (junctionPosts || []).forEach((pt: any) => {
        if (pt.group_id) postCounts[pt.group_id] = (postCounts[pt.group_id] || 0) + 1;
      });
    }

    // Aggregate real event counts per canonical topic
    const eventCounts: Record<string, number> = {};
    if (groupIds.length > 0) {
      const { data: directEvents } = await adminSupabase
        .from('sanctuary_events')
        .select('group_id')
        .in('group_id', groupIds)
        .eq('status', 'published');
      (directEvents || []).forEach((e: any) => {
        if (e.group_id) eventCounts[e.group_id] = (eventCounts[e.group_id] || 0) + 1;
      });

      const { data: junctionEvents } = await adminSupabase
        .from('event_topics')
        .select('group_id')
        .in('group_id', groupIds);
      (junctionEvents || []).forEach((et: any) => {
        if (et.group_id) eventCounts[et.group_id] = (eventCounts[et.group_id] || 0) + 1;
      });
    }

    // Check user membership if authenticated
    let userFollowedIds = new Set<string>();
    if (user) {
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('kinkster_id', user.id)
        .eq('status', 'active');
      (memberships || []).forEach((m: any) => userFollowedIds.add(m.group_id));
    }

    const topics = (canonicalGroups || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: g.description,
      rules: g.rules,
      category: g.category,
      visibility: g.visibility,
      avatar_url: g.avatar_url,
      cover_url: g.cover_url,
      display_order: g.display_order,
      posts_count: postCounts[g.id] || 0,
      events_count: eventCounts[g.id] || 0,
      is_followed: userFollowedIds.has(g.id),
    }));

    return NextResponse.json({
      success: true,
      total: topics.length,
      topics,
    });
  } catch (err: any) {
    console.error('Taxonomy handler error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
