import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { post_id } = await req.json();

    if (!post_id) {
      return NextResponse.json({ error: 'Post ID is required.' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Check if user already liked the post
    const { data: existingLike } = await adminSupabase
      .from('kinkster_post_likes')
      .select('id')
      .eq('post_id', post_id)
      .eq('kinkster_id', user.id)
      .maybeSingle();

    // Fetch current likes count
    const { data: post } = await adminSupabase
      .from('kinkster_posts')
      .select('likes_count')
      .eq('id', post_id)
      .maybeSingle();

    let newCount = post?.likes_count || 0;
    let isLiked = false;

    if (existingLike) {
      // Unlike
      await adminSupabase
        .from('kinkster_post_likes')
        .delete()
        .eq('id', existingLike.id);

      newCount = Math.max(0, newCount - 1);
      isLiked = false;
    } else {
      // Like
      await adminSupabase
        .from('kinkster_post_likes')
        .insert({
          post_id,
          kinkster_id: user.id
        });

      newCount = newCount + 1;
      isLiked = true;
    }

    // Update post likes_count
    await adminSupabase
      .from('kinkster_posts')
      .update({ likes_count: newCount })
      .eq('id', post_id);

    return NextResponse.json({
      success: true,
      liked: isLiked,
      likes_count: newCount
    });
  } catch (err: any) {
    console.error('Post like toggle error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
