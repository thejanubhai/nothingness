import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUserAdminAsync } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(
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

    const { data: booking, error } = await adminClient
      .from('bookings')
      .select(`
        *,
        spaces ( id, title, slug, nightly_price ),
        booking_guests (
          id, name, phone, verification_status, guest_index, payment_status, payment_amount, paid_at, is_primary,
          guest_profiles ( document_number, full_name, is_verified, phone_number )
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    return NextResponse.json({ success: true, booking });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
      'check_in',
      'check_out',
      'guest_name',
      'guest_phone',
      'guest_email',
      'guests',
      'total_price',
      'payment_method',
      'payment_status',
      'status',
      'notes',
    ];

    const updatePayload: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updatePayload[field] = body[field];
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Auto-align payment_status if status set to confirmed
    if (updatePayload.status === 'confirmed' && !updatePayload.payment_status) {
      updatePayload.payment_status = 'completed';
    }

    const { data: booking, error } = await adminClient
      .from('bookings')
      .update(updatePayload)
      .eq('id', id)
      .select(`
        *,
        spaces ( id, title, slug ),
        booking_guests (
          id, name, phone, verification_status, guest_index,
          guest_profiles ( document_number, full_name, is_verified )
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, booking });
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

    // 1. Delete associated housekeeping tasks
    await adminClient
      .from('housekeeping_tasks')
      .delete()
      .eq('booking_id', id);

    // 2. Delete associated guest records
    await adminClient
      .from('booking_guests')
      .delete()
      .eq('booking_id', id);

    // 3. Delete the booking itself
    const { error } = await adminClient
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Booking permanently deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
