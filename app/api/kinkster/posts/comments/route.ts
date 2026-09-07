import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('post_id');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    const { data: comments, error } = await adminSupabase
      .from('kinkster_post_comments')
      .select(`
        id,
        content,
        created_at,
        kinkster_id,
        kinkster_profiles!kinkster_id (
          alias,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching post comments:', error);
      return NextResponse.json({ comments: [] });
    }

    const formatted = (comments || []).map((c: any) => ({
      id: c.id,
      text: c.content,
      created_at: c.created_at,
      time: new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      alias: c.kinkster_profiles?.alias || 'member',
      avatar_url: c.kinkster_profiles?.avatar_url || '/images/IMG_9955.jpg'
    }));

    return NextResponse.json({ comments: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Sign in to comment.' }, { status: 401 });
    }

    const { post_id, content } = await req.json();

    if (!post_id || !content || !content.trim()) {
      return NextResponse.json({ error: 'Post ID and comment text are required.' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Verify user profile exists
    const { data: profile } = await adminSupabase
      .from('kinkster_profiles')
      .select('alias, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    const alias = profile?.alias || 'anonymous';
    const avatarUrl = profile?.avatar_url || '/images/IMG_9955.jpg';

    const { data: newComment, error: insertError } = await adminSupabase
      .from('kinkster_post_comments')
      .insert({
        post_id,
        kinkster_id: user.id,
        content: content.trim()
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      comment: {
        id: newComment.id,
        text: newComment.content,
        created_at: newComment.created_at,
        time: 'Just now',
        alias,
        avatar_url: avatarUrl
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
