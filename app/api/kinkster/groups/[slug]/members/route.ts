import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const LEGACY_SLUG_MAP: Record<string, string> = {
  'delhi-shibari-club': 'shibari-japanese-rope-bondage',
  'sensory-aftercare-circle': 'sensory-deprivation-mindful-touch',
  'mumbai-bdsm-dungeon': 'power-dynamics-dominance-submission',
  'gurgaon-kink-salon': 'noir-masquerades-dark-romance',
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const effectiveSlug = LEGACY_SLUG_MAP[slug.toLowerCase()] || slug.toLowerCase();
    const supabase = await createClient();

    const { data: group } = await supabase
      .from('groups')
      .select('id, visibility, owner_id')
      .or(`slug.eq.${effectiveSlug},slug.eq.${slug}`)
      .maybeSingle();

    if (!group) {
      return NextResponse.json({ error: 'Group not found.' }, { status: 404 });
    }

    const { data: members, error } = await supabase
      .from('group_members')
      .select(`
        id,
        kinkster_id,
        role,
        status,
        joined_at,
        approved_at,
        kinkster_profiles!kinkster_id (
          id,
          alias,
          avatar_url,
          bio,
          is_in_person_vetted,
          is_activated
        )
      `)
      .eq('group_id', group.id)
      .order('joined_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ members: members || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
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

    // Verify user has an activated kinkster profile
    const { data: profile } = await supabase
      .from('kinkster_profiles')
      .select('id, is_activated, alias')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_activated) {
      return NextResponse.json(
        { error: 'You must activate Kinkster Mode before joining communities.' },
        { status: 403 }
      );
    }

    const effectiveSlug = LEGACY_SLUG_MAP[slug.toLowerCase()] || slug.toLowerCase();
    const { data: group } = await supabase
      .from('groups')
      .select('id, visibility, members_count')
      .or(`slug.eq.${effectiveSlug},slug.eq.${slug}`)
      .maybeSingle();

    if (!group) {
      return NextResponse.json({ error: 'Group not found.' }, { status: 404 });
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('id, status, role')
      .eq('group_id', group.id)
      .eq('kinkster_id', user.id)
      .maybeSingle();

    if (existingMember) {
      if (existingMember.status === 'active') {
        return NextResponse.json({ message: 'Already an active member.', membership: existingMember });
      } else if (existingMember.status === 'pending') {
        return NextResponse.json({ message: 'Membership request is pending approval.', membership: existingMember });
      } else if (existingMember.status === 'banned') {
        return NextResponse.json({ error: 'Membership suspended by community organizers.' }, { status: 403 });
      }
    }

    // Determine status based on visibility
    const isApprovalRequired = group.visibility === 'approval_required' || group.visibility === 'invite_only';
    const status = isApprovalRequired ? 'pending' : 'active';

    const { data: newMember, error: insertError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        kinkster_id: user.id,
        role: 'member',
        status,
        joined_at: new Date().toISOString(),
        approved_at: status === 'active' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Increment members_count if active
    if (status === 'active') {
      await supabase
        .from('groups')
        .update({ members_count: (group.members_count || 1) + 1 })
        .eq('id', group.id);
    }

    return NextResponse.json({
      success: true,
      status,
      message: status === 'active' ? 'Joined community successfully!' : 'Request submitted for review.',
      membership: newMember,
    });
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

    const effectiveSlug = LEGACY_SLUG_MAP[slug.toLowerCase()] || slug.toLowerCase();
    const { data: group } = await supabase
      .from('groups')
      .select('id, owner_id, members_count')
      .or(`slug.eq.${effectiveSlug},slug.eq.${slug}`)
      .maybeSingle();

    if (!group) {
      return NextResponse.json({ error: 'Group not found.' }, { status: 404 });
    }

    if (group.owner_id === user.id) {
      return NextResponse.json(
        { error: 'Group owner cannot leave group. Transfer ownership or delete the community.' },
        { status: 400 }
      );
    }

    const { data: member } = await supabase
      .from('group_members')
      .select('id, status')
      .eq('group_id', group.id)
      .eq('kinkster_id', user.id)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: 'Not a member of this community.' }, { status: 400 });
    }

    await supabase
      .from('group_members')
      .delete()
      .eq('id', member.id);

    if (member.status === 'active') {
      const currentCount = group.members_count || 1;
      await supabase
        .from('groups')
        .update({ members_count: Math.max(1, currentCount - 1) })
        .eq('id', group.id);
    }

    return NextResponse.json({ success: true, message: 'Successfully left the community.' });
  } catch (err: any) {
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

    const effectiveSlug = LEGACY_SLUG_MAP[slug.toLowerCase()] || slug.toLowerCase();
    const { data: group } = await supabase
      .from('groups')
      .select('id, owner_id, members_count')
      .or(`slug.eq.${effectiveSlug},slug.eq.${slug}`)
      .maybeSingle();

    if (!group) {
      return NextResponse.json({ error: 'Group not found.' }, { status: 404 });
    }

    // Verify user is owner or admin
    let isPermitted = group.owner_id === user.id;
    if (!isPermitted) {
      const { data: adminMember } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', group.id)
        .eq('kinkster_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      if (adminMember && (adminMember.role === 'owner' || adminMember.role === 'admin')) {
        isPermitted = true;
      }
    }

    if (!isPermitted) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges.' }, { status: 403 });
    }

    const { target_kinkster_id, action, new_role } = await req.json();

    if (!target_kinkster_id) {
      return NextResponse.json({ error: 'Target member ID required.' }, { status: 400 });
    }

    if (action === 'approve') {
      const { error: approveError } = await supabase
        .from('group_members')
        .update({ status: 'active', approved_at: new Date().toISOString() })
        .eq('group_id', group.id)
        .eq('kinkster_id', target_kinkster_id);

      if (approveError) return NextResponse.json({ error: approveError.message }, { status: 500 });

      await supabase
        .from('groups')
        .update({ members_count: (group.members_count || 1) + 1 })
        .eq('id', group.id);

      return NextResponse.json({ success: true, message: 'Member approved.' });
    } else if (action === 'reject' || action === 'remove') {
      const { error: removeError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', group.id)
        .eq('kinkster_id', target_kinkster_id);

      if (removeError) return NextResponse.json({ error: removeError.message }, { status: 500 });

      if (action === 'remove') {
        await supabase
          .from('groups')
          .update({ members_count: Math.max(1, (group.members_count || 1) - 1) })
          .eq('id', group.id);
      }

      return NextResponse.json({ success: true, message: 'Member removed.' });
    } else if (action === 'change_role' && new_role) {
      const { error: roleError } = await supabase
        .from('group_members')
        .update({ role: new_role })
        .eq('group_id', group.id)
        .eq('kinkster_id', target_kinkster_id);

      if (roleError) return NextResponse.json({ error: roleError.message }, { status: 500 });

      return NextResponse.json({ success: true, message: `Role updated to ${new_role}.` });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
