import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: guest, error: guestError } = await supabase
      .from('booking_guests')
      .select(`
        id,
        guest_index,
        name,
        phone,
        verification_status,
        verification_token,
        payment_status,
        payment_amount,
        paid_at,
        is_primary,
        guest_profile_id,
        guest_profiles (
          id,
          full_name,
          face_id_vetted,
          live_face_url,
          photo_url,
          document_number
        ),
        bookings (
          id,
          check_in,
          check_out,
          guests,
          additional_guest_payment_mode,
          guest_name,
          spaces (
            id,
            title,
            slug,
            city,
            area,
            featured_image
          )
        )
      `)
      .or(`verification_token.eq.${token},id.eq.${token}`)
      .limit(1)
      .maybeSingle();

    if (guestError || !guest) {
      return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      guest
    });

  } catch (error: any) {
    console.error('Fetch guest details error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
