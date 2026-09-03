import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Fetch Sanctuary Pass for this guest
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

    const { data: pass, error } = await supabase
      .from('sanctuary_passes')
      .select('*')
      .or(`guest_profile_id.eq.${id},user_id.eq.${effectiveUserId},user_id.eq.${id}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, pass });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// POST: Issue / Create a Sanctuary Pass manually for this guest
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
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

    const passPayload = {
      user_id: effectiveUserId,
      guest_profile_id: guest.id,
      status: body.status || 'active',
      pass_tier: body.pass_tier || 'Noir Luminary',
      amount_paid: Number(body.amount_paid) || 0,
      order_id: body.order_id || `admin_comp_${Date.now()}`,
      expires_at: body.expires_at || null,
      admin_notes: body.admin_notes || `Manually issued by Admin for ${guest.full_name}`,
      created_at: new Date().toISOString(),
    };

    const { data: newPass, error } = await supabase
      .from('sanctuary_passes')
      .insert(passPayload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath(`/admin/guests/${id}`);
    revalidatePath('/admin/sanctuary-pass');
    revalidatePath('/dashboard');
    revalidatePath('/sanctuary-pass');

    return NextResponse.json({ success: true, pass: newPass, message: 'Sanctuary Pass issued successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// PATCH: Update Sanctuary Pass (status, tier, validity, notes, amount)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
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

    const passId = body.pass_id;
    let query = supabase.from('sanctuary_passes').update({
      ...(body.status !== undefined && { status: body.status }),
      ...(body.pass_tier !== undefined && { pass_tier: body.pass_tier }),
      ...(body.amount_paid !== undefined && { amount_paid: Number(body.amount_paid) }),
      ...(body.order_id !== undefined && { order_id: body.order_id }),
      ...(body.expires_at !== undefined && { expires_at: body.expires_at }),
      ...(body.admin_notes !== undefined && { admin_notes: body.admin_notes }),
      ...(body.guest_profile_id !== undefined && { guest_profile_id: body.guest_profile_id || guest.id }),
    });

    if (passId) {
      query = query.eq('id', passId);
    } else {
      query = query.or(`guest_profile_id.eq.${id},user_id.eq.${effectiveUserId},user_id.eq.${id}`);
    }

    const { data: updatedPass, error } = await query.select().order('created_at', { ascending: false }).limit(1).single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath(`/admin/guests/${id}`);
    revalidatePath('/admin/sanctuary-pass');
    revalidatePath('/dashboard');
    revalidatePath('/sanctuary-pass');

    return NextResponse.json({ success: true, pass: updatedPass, message: 'Sanctuary Pass updated' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// DELETE: Revoke / Delete Sanctuary Pass
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const passId = searchParams.get('pass_id');
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

    let query = supabase.from('sanctuary_passes').delete();
    if (passId) {
      query = query.eq('id', passId);
    } else {
      query = query.or(`guest_profile_id.eq.${id},user_id.eq.${effectiveUserId},user_id.eq.${id}`);
    }

    const { error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath(`/admin/guests/${id}`);
    revalidatePath('/admin/sanctuary-pass');
    revalidatePath('/dashboard');
    revalidatePath('/sanctuary-pass');

    return NextResponse.json({ success: true, message: 'Sanctuary Pass deleted/revoked' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
