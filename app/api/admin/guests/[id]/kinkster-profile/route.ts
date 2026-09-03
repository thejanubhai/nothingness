import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Fetch Kinkster Profile for this guest
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: guest } = await supabase
      .from('guest_profiles')
      .select('id, user_id, phone, full_name')
      .eq('id', id)
      .single();

    if (!guest) {
      return NextResponse.json({ error: 'Guest profile not found' }, { status: 404 });
    }

    const effectiveUserId = guest.user_id || guest.id;

    const { data: profile, error } = await supabase
      .from('kinkster_profiles')
      .select('*')
      .or(`id.eq.${effectiveUserId},guest_profile_id.eq.${id},id.eq.${id}`)
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// POST: Create / Initialize Kinkster Profile manually for this guest
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const supabase = createAdminClient();

    const { data: guest } = await supabase
      .from('guest_profiles')
      .select('id, user_id, phone, full_name, face_id_vetted, in_person_vetted, live_face_url')
      .eq('id', id)
      .single();

    if (!guest) {
      return NextResponse.json({ error: 'Guest profile not found' }, { status: 404 });
    }

    const effectiveUserId = guest.user_id || guest.id;
    const now = new Date().toISOString();

    // Default alias if not supplied
    const cleanName = guest.full_name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 12);
    const defaultAlias = body.alias 
      ? body.alias.toLowerCase().replace(/[^a-z0-9_]/g, '')
      : `${cleanName || 'guest'}_${guest.id.slice(0, 4)}`;

    const profilePayload: any = {
      id: effectiveUserId,
      user_id: guest.user_id || null,
      guest_profile_id: guest.id,
      alias: defaultAlias,
      bio: body.bio || 'Sanctuary member exploring the confidential Nothingness ecosystem.',
      is_activated: body.is_activated !== undefined ? Boolean(body.is_activated) : true,
      confidentiality_agreed: body.confidentiality_agreed !== undefined ? Boolean(body.confidentiality_agreed) : true,
      confidentiality_agreed_at: now,
      interests: Array.isArray(body.interests) ? body.interests : ['Masquerade', 'Sanctuary Lounge'],
      health_badges: Array.isArray(body.health_badges) ? body.health_badges : [],
      onboarding_answers: body.onboarding_answers || {},
      is_trusted_host: Boolean(body.is_trusted_host),
      stay_verified: Boolean(body.stay_verified),
      stay_verified_at: body.stay_verified ? now : null,
      in_person_vetted: body.in_person_vetted !== undefined ? Boolean(body.in_person_vetted) : Boolean(guest.in_person_vetted),
      in_person_vetted_at: body.in_person_vetted ? now : null,
      face_id_vetted: body.face_id_vetted !== undefined ? Boolean(body.face_id_vetted) : Boolean(guest.face_id_vetted),
      live_face_url: body.live_face_url || guest.live_face_url || null,
      is_id_verified: true,
      id_verified_at: now,
      admin_notes: body.admin_notes || `Profile initialized by Admin for ${guest.full_name}`,
      created_at: now,
      updated_at: now,
    };

    const { data: newProfile, error } = await supabase
      .from('kinkster_profiles')
      .upsert(profilePayload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sync biometric / vetting flags to guest_profiles if changed
    await supabase
      .from('guest_profiles')
      .update({
        face_id_vetted: profilePayload.face_id_vetted,
        in_person_vetted: profilePayload.in_person_vetted,
        ...(profilePayload.face_id_vetted && { face_id_vetted_at: now }),
        ...(profilePayload.in_person_vetted && { in_person_vetted_at: now }),
      })
      .eq('id', guest.id);

    revalidatePath(`/admin/guests/${id}`);
    revalidatePath('/dashboard');
    revalidatePath('/kinksters');

    return NextResponse.json({ success: true, profile: newProfile, message: 'Kinkster Profile activated successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// PATCH: Update Kinkster Profile features or metadata
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const supabase = createAdminClient();

    const { data: guest } = await supabase
      .from('guest_profiles')
      .select('id, user_id, phone')
      .eq('id', id)
      .single();

    if (!guest) {
      return NextResponse.json({ error: 'Guest profile not found' }, { status: 404 });
    }

    const effectiveUserId = guest.user_id || guest.id;
    const now = new Date().toISOString();

    const updatePayload: any = {
      updated_at: now,
      ...(body.alias !== undefined && { alias: body.alias.toLowerCase().replace(/[^a-z0-9_]/g, '') }),
      ...(body.bio !== undefined && { bio: body.bio }),
      ...(body.is_activated !== undefined && { is_activated: Boolean(body.is_activated) }),
      ...(body.is_trusted_host !== undefined && { is_trusted_host: Boolean(body.is_trusted_host) }),
      ...(body.stay_verified !== undefined && { 
        stay_verified: Boolean(body.stay_verified),
        stay_verified_at: body.stay_verified ? now : null 
      }),
      ...(body.face_id_vetted !== undefined && { 
        face_id_vetted: Boolean(body.face_id_vetted) 
      }),
      ...(body.in_person_vetted !== undefined && { 
        in_person_vetted: Boolean(body.in_person_vetted),
        in_person_vetted_at: body.in_person_vetted ? now : null
      }),
      ...(body.confidentiality_agreed !== undefined && { 
        confidentiality_agreed: Boolean(body.confidentiality_agreed),
        confidentiality_agreed_at: body.confidentiality_agreed ? now : null
      }),
      ...(body.interests !== undefined && { interests: Array.isArray(body.interests) ? body.interests : [] }),
      ...(body.health_badges !== undefined && { health_badges: body.health_badges }),
      ...(body.admin_notes !== undefined && { admin_notes: body.admin_notes }),
      ...(body.live_face_url !== undefined && { live_face_url: body.live_face_url }),
    };

    const targetProfileId = body.profile_id || effectiveUserId;

    const { data: updatedProfile, error } = await supabase
      .from('kinkster_profiles')
      .update(updatePayload)
      .or(`id.eq.${targetProfileId},guest_profile_id.eq.${id}`)
      .select()
      .limit(1)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sync face_id_vetted & in_person_vetted with guest_profiles
    if (body.face_id_vetted !== undefined || body.in_person_vetted !== undefined) {
      await supabase
        .from('guest_profiles')
        .update({
          ...(body.face_id_vetted !== undefined && { 
            face_id_vetted: Boolean(body.face_id_vetted),
            ...(body.face_id_vetted && { face_id_vetted_at: now })
          }),
          ...(body.in_person_vetted !== undefined && { 
            in_person_vetted: Boolean(body.in_person_vetted),
            ...(body.in_person_vetted && { in_person_vetted_at: now })
          }),
        })
        .eq('id', guest.id);
    }

    revalidatePath(`/admin/guests/${id}`);
    revalidatePath('/dashboard');
    revalidatePath('/kinksters');

    return NextResponse.json({ success: true, profile: updatedProfile, message: 'Kinkster Profile updated' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// DELETE: Deactivate / Delete Kinkster Profile
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const hardDelete = searchParams.get('hard') === 'true';
    const supabase = createAdminClient();

    const { data: guest } = await supabase
      .from('guest_profiles')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (!guest) {
      return NextResponse.json({ error: 'Guest profile not found' }, { status: 404 });
    }

    const effectiveUserId = guest.user_id || guest.id;

    if (hardDelete) {
      const { error } = await supabase
        .from('kinkster_profiles')
        .delete()
        .or(`id.eq.${effectiveUserId},guest_profile_id.eq.${id}`);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // Soft-deactivate
      const { error } = await supabase
        .from('kinkster_profiles')
        .update({ is_activated: false, updated_at: new Date().toISOString() })
        .or(`id.eq.${effectiveUserId},guest_profile_id.eq.${id}`);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    revalidatePath(`/admin/guests/${id}`);
    revalidatePath('/dashboard');
    revalidatePath('/kinksters');

    return NextResponse.json({ success: true, message: hardDelete ? 'Kinkster profile deleted' : 'Kinkster profile deactivated' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
