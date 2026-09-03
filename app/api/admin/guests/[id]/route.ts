import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUserAdminAsync } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !(await isUserAdminAsync(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const adminClient = createAdminClient();

    const allowedFields = [
      'full_name',
      'document_number',
      'id_document_type',
      'dob',
      'permanent_address',
      'photo_url',
      'id_front_url',
      'id_back_url',
      'id_document_url',
      'phone',
      'phone_number',
      'is_verified',
      'nationality',
      'is_foreign_national',
      'police_register_status',
      'live_face_url',
      'face_id_vetted',
      'face_id_vetted_at',
    ];

    const updatePayload: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updatePayload[field] = body[field];
      }
    }

    if (body.full_name) {
      updatePayload.full_name = body.full_name.trim();
    }
    if (body.document_number) {
      updatePayload.document_number = body.document_number.trim().toUpperCase();
    }
    if (body.id_front_url && !updatePayload.id_document_url) {
      updatePayload.id_document_url = body.id_front_url;
    }

    const { data: updatedProfile, error } = await adminClient
      .from('guest_profiles')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, guest: updatedProfile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !(await isUserAdminAsync(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from('guest_profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Guest profile deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
