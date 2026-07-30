import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { target_alias } = await req.json();

    if (!target_alias) {
      return NextResponse.json({ error: 'Target alias is required.' }, { status: 400 });
    }

    const { data: targetProfile } = await supabase
      .from('kinkster_profiles')
      .select('id')
      .eq('alias', target_alias.toLowerCase())
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: 'Target alias not found.' }, { status: 404 });
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('kinkster_follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', targetProfile.id)
      .single();

    if (existingFollow) {
      // Unfollow
      await supabase
        .from('kinkster_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetProfile.id);

      return NextResponse.json({ success: true, is_following: false });
    } else {
      // Follow
      await supabase
        .from('kinkster_follows')
        .insert({
          follower_id: user.id,
          following_id: targetProfile.id
        });

      return NextResponse.json({ success: true, is_following: true });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
