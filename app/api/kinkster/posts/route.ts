import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const aliasParam = searchParams.get('alias');

    const adminSupabase = createAdminClient();

    let query = adminSupabase
      .from('kinkster_posts')
      .select(`
        *,
        kinkster_profiles!inner (
          alias,
          avatar_url,
          is_activated
        )
      `)
      .order('created_at', { ascending: false });

    if (aliasParam) {
      query = query.eq('kinkster_profiles.alias', aliasParam.toLowerCase());
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('Error fetching kinkster posts:', error);
    }

    // Get user likes set
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

    // Get comment counts
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

    let finalPosts = (posts || []).map((p: any) => ({
      ...p,
      is_liked: likedPostIds.has(p.id),
      likes_count: p.likes_count || 0,
      comments_count: commentCountsMap[p.id] || 0
    }));
    if (finalPosts.length === 0 && !aliasParam) {
      finalPosts = [
        {
          id: 'post-curated-1',
          media_type: 'image',
          media_url: '/images/IMG_9955.jpg',
          caption: 'Late night light test inside The Void suite. The acoustics in this concrete chamber are unmatched for sensory focus.',
          likes_count: 42,
          comments_count: 7,
          is_liked: likedPostIds.has('post-curated-1'),
          created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          kinkster_profiles: {
            alias: 'velvet_nocturne',
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
            is_activated: true
          }
        },
        {
          id: 'post-curated-2',
          media_type: 'image',
          media_url: '/images/The Void (1).png',
          caption: 'Floor rope patterns & grounded breathing. Ready for the upcoming Velvet Masquerade this weekend.',
          likes_count: 29,
          comments_count: 4,
          is_liked: likedPostIds.has('post-curated-2'),
          created_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
          kinkster_profiles: {
            alias: 'aria_shibari',
            avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400',
            is_activated: true
          }
        },
        {
          id: 'post-curated-3',
          media_type: 'image',
          media_url: '/images/IMG_4446.jpeg',
          caption: 'Jacuzzi soaks by candlelight. Sometimes the best aftercare is hot water, quiet vinyl, and zero outside distractions.',
          likes_count: 51,
          comments_count: 12,
          is_liked: likedPostIds.has('post-curated-3'),
          created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
          kinkster_profiles: {
            alias: 'obsidian_silk_duo',
            avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
            is_activated: true
          }
        }
      ];
    }

    return NextResponse.json({ posts: finalPosts });
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

    // Verify user profile is activated
    const { data: kinksterProfile } = await supabase
      .from('kinkster_profiles')
      .select('id, is_activated')
      .eq('id', user.id)
      .eq('is_activated', true)
      .single();

    if (!kinksterProfile) {
      return NextResponse.json(
        { error: 'You must activate Kinkster Mode before creating posts.' },
        { status: 403 }
      );
    }

    const { media_type, media_url, caption } = await req.json();

    if (!media_url) {
      return NextResponse.json({ error: 'Media URL is required.' }, { status: 400 });
    }

    const { data: post, error: insertError } = await supabase
      .from('kinkster_posts')
      .insert({
        kinkster_id: user.id,
        media_type: media_type || 'image',
        media_url,
        caption: caption || ''
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, post });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
