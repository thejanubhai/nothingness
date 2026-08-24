import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendVerificationApprovedNotification, sendVerificationRejectedNotification } from '@/lib/notifications/verification';

export async function POST(req: NextRequest) {
  try {
    const { guestProfileId, bookingGuestId, status, reason } = await req.json();

    if (!status || !['verified', 'failed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be "verified" or "failed"' }, { status: 400 });
    }

    const supabase = await createClient();

    let guestEmail = null;
    let guestName = 'Guest';
    let spaceTitle = undefined;
    let checkInDate = undefined;
    let checkOutDate = undefined;

    // 1. Update guest_profile if ID provided
    if (guestProfileId) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
      const { data: profile, error: profErr } = await supabase
        .from('guest_profiles')
        .update({
          is_verified: status === 'verified',
          verification_timestamp: status === 'verified' ? now.toISOString() : null,
          verification_expires_at: status === 'verified' ? expiresAt.toISOString() : null,
          police_register_status: status === 'verified' ? 'verified_compliant' : 'action_required'
        })
        .eq('id', guestProfileId)
        .select()
        .single();

      if (profErr) {
        console.error('Failed to update guest_profile:', profErr);
      } else if (profile) {
        guestEmail = profile.email;
        guestName = profile.full_name || profile.first_name || 'Guest';
      }
    }

    // 2. Update booking_guests if ID provided
    if (bookingGuestId) {
      const { data: bg, error: bgErr } = await supabase
        .from('booking_guests')
        .update({
          verification_status: status,
        })
        .eq('id', bookingGuestId)
        .select(`
          name,
          bookings (
            check_in,
            check_out,
            spaces (title),
            guest_profiles (email, full_name)
          )
        `)
        .single();

      if (bgErr) {
        console.error('Failed to update booking_guests:', bgErr);
      } else if (bg) {
        const bookingRecord: any = Array.isArray(bg.bookings) ? bg.bookings[0] : bg.bookings;
        const profileRecord: any = Array.isArray(bookingRecord?.guest_profiles) ? bookingRecord?.guest_profiles[0] : bookingRecord?.guest_profiles;
        const spaceRecord: any = Array.isArray(bookingRecord?.spaces) ? bookingRecord?.spaces[0] : bookingRecord?.spaces;

        if (!guestName || guestName === 'Guest') guestName = bg.name || profileRecord?.full_name || 'Guest';
        if (!guestEmail) guestEmail = profileRecord?.email;
        spaceTitle = spaceRecord?.title;
        checkInDate = bookingRecord?.check_in;
        checkOutDate = bookingRecord?.check_out;
      }
    }

    // 3. Dispatch Notification via Resend
    if (guestEmail) {
      if (status === 'verified') {
        await sendVerificationApprovedNotification({
          email: guestEmail,
          guestName,
          spaceTitle,
          checkInDate,
          checkOutDate,
        });
      } else {
        await sendVerificationRejectedNotification({
          email: guestEmail,
          guestName,
          reason: reason || 'Document verification rejected by admin review.',
        });
      }
    } else {
      console.warn('[Admin Verification] No email found for guest record. Database updated successfully without email notification.');
    }

    return NextResponse.json({
      success: true,
      status,
      message: `Guest verification set to ${status}. Notification dispatched if email was registered.`,
    });

  } catch (error: any) {
    console.error('Admin verification update error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
