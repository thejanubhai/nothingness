import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const mineOnly = searchParams.get('mine') === 'true';

    let query = supabase
      .from('groups')
      .select(`
        *,
        kinkster_profiles!owner_id (
          id,
          alias,
          avatar_url
        ),
        group_members (
          kinkster_id,
          role,
          status
        ),
        sanctuary_events (
          id,
          title,
          event_date,
          status
        )
      `)
      .eq('moderation_state', 'active')
      .order('is_canonical', { ascending: false })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search && search.trim()) {
      query = query.ilike('name', `%${search.trim()}%`);
    }

    const { data: groups, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Process each group to format user membership and counts
    const processedGroups = (groups || []).map((group: any) => {
      const userMembership = user
        ? group.group_members?.find((m: any) => m.kinkster_id === user.id)
        : null;

      const activeEvents = (group.sanctuary_events || []).filter(
        (e: any) => e.status === 'published' || e.status === 'in_progress'
      );

      // Clean up raw array references for response size
      const { group_members, sanctuary_events, ...rest } = group;

      return {
        ...rest,
        user_membership: userMembership
          ? { role: userMembership.role, status: userMembership.status }
          : null,
        active_events_count: activeEvents.length,
        events: activeEvents,
      };
    });

    // If 'mineOnly' requested, filter to groups the user belongs to
    const finalGroups = mineOnly
      ? processedGroups.filter((g) => g.user_membership && g.user_membership.status === 'active')
      : processedGroups;

    return NextResponse.json({ groups: finalGroups });
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

    // Platform Policy: Community taxonomy is platform-managed. Normal users cannot create arbitrary community names.
    const isAdmin = user.email?.includes('admin') || user.app_metadata?.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json(
        { 
          error: 'Community taxonomy is platform-managed. You may follow, post into, or propose gatherings within any of the 50 canonical communities.' 
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description, rules, category, visibility, avatar_url, cover_url } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Community name is required.' }, { status: 400 });
    }

    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Community description is required.' }, { status: 400 });
    }

    const baseSlug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const slug = `${baseSlug}-${randomSuffix}`;

    const { data: newGroup, error: groupError } = await supabase
      .from('groups')
      .insert({
        name: name.trim(),
        slug,
        description: description.trim(),
        rules: rules?.trim() || 'Respect consent, discretion, and fellow members at all times.',
        category: category || 'General',
        visibility: visibility || 'public',
        is_canonical: false,
        avatar_url: avatar_url || 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=400',
        cover_url: cover_url || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1200',
        owner_id: user.id,
        members_count: 1,
      })
      .select()
      .single();

    if (groupError) {
      return NextResponse.json({ error: groupError.message }, { status: 500 });
    }

    await supabase.from('group_members').insert({
      group_id: newGroup.id,
      kinkster_id: user.id,
      role: 'owner',
      status: 'active',
    });

    return NextResponse.json({ success: true, group: newGroup }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
