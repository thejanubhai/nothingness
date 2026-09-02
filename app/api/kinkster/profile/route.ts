import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlatformActionFees } from '@/lib/payu';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(req.url);
    const aliasParam = searchParams.get('alias');

    if (aliasParam) {
      // Fetch specific public member profile by alias
      const { data: profile, error } = await supabase
        .from('kinkster_profiles')
        .select('*')
        .eq('alias', aliasParam.toLowerCase())
        .eq('is_activated', true)
        .single();

      if (error || !profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      return NextResponse.json({ profile });
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // 1. Check user ID verification status by phone or user_id in guest_profiles
    let isIdVerified = false;
    const cleanPhone = user.phone ? user.phone.replace(/[^0-9+]/g, '') : null;

    if (cleanPhone) {
      const { data: gpByPhone } = await adminSupabase
        .from('guest_profiles')
        .select('id, is_verified, full_name')
        .eq('phone', cleanPhone)
        .eq('is_verified', true)
        .maybeSingle();
      if (gpByPhone?.is_verified) isIdVerified = true;
    }

    if (!isIdVerified) {
      const { data: gpByUserId } = await adminSupabase
        .from('guest_profiles')
        .select('id, is_verified, full_name')
        .eq('user_id', user.id)
        .eq('is_verified', true)
        .maybeSingle();
      if (gpByUserId?.is_verified) isIdVerified = true;
    }

    // 2. Fetch user's active kinkster profile
    const { data: kinksterProfile } = await adminSupabase
      .from('kinkster_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // 3. Check Stay Verification Status
    let isStayVerified = kinksterProfile?.stay_verified ?? false;
    let staySource = kinksterProfile?.stay_verification_source || null;
    let existingBookingInfo: any = null;

    if (!isStayVerified) {
      // Check if user has an existing confirmed booking in bookings table
      let bookingQuery = adminSupabase
        .from('bookings')
        .select('id, space_id, check_in, check_out, status, platform, spaces(title)')
        .eq('status', 'confirmed');

      // Check by user_id
      const { data: userBookings } = await bookingQuery.eq('user_id', user.id).limit(1);

      if (userBookings && userBookings.length > 0) {
        isStayVerified = true;
        staySource = 'existing_booking';
        existingBookingInfo = userBookings[0];
      } else if (cleanPhone) {
        // Check by phone number
        const { data: phoneBookings } = await adminSupabase
          .from('bookings')
          .select('id, space_id, check_in, check_out, status, platform, spaces(title)')
          .eq('status', 'confirmed')
          .eq('guest_phone', cleanPhone)
          .limit(1);

        if (phoneBookings && phoneBookings.length > 0) {
          isStayVerified = true;
          staySource = 'existing_booking';
          existingBookingInfo = phoneBookings[0];
        }
      }

      // If verified via existing booking, update kinkster_profiles automatically
      if (isStayVerified && kinksterProfile) {
        await adminSupabase
          .from('kinkster_profiles')
          .update({
            stay_verified: true,
            stay_verification_source: 'existing_booking',
            stay_verification_data: { booking_id: existingBookingInfo?.id },
            stay_verified_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }
    }

    const { fee_kinkster_activation } = await getPlatformActionFees();

    return NextResponse.json({
      is_id_verified: isIdVerified,
      is_stay_verified: isStayVerified,
      stay_source: staySource,
      existing_booking: existingBookingInfo,
      profile: kinksterProfile || null,
      is_activated: kinksterProfile?.is_activated ?? false,
      entry_fee: fee_kinkster_activation ?? 0
    });
  } catch (err: any) {
    console.error('Kinkster profile route exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
