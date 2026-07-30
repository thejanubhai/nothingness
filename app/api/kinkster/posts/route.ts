import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const aliasParam = searchParams.get('alias');

    let query = supabase
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ posts: posts || [] });
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
