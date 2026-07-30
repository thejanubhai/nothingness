import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: invites, error } = await supabase
      .from('kinkster_co_stay_invites')
      .select(`
        *,
        kinkster_profiles (
          alias,
          avatar_url,
          bio
        ),
        spaces (
          title,
          slug,
          city,
          images
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invites: invites || [] });
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

    const { space_id, title, description, preferred_dates_description } = await req.json();

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 });
    }

    const { data: invite, error: insertError } = await supabase
      .from('kinkster_co_stay_invites')
      .insert({
        host_kinkster_id: user.id,
        space_id: space_id || null,
        title,
        description,
        preferred_dates_description: preferred_dates_description || 'Flexible Dates'
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, invite });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
