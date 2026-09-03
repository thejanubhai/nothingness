'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { isUserAdminAsync } from '@/lib/auth-utils';
import { env } from '@/lib/env';

import { getBlockedIntervals } from './calendar';
import { areIntervalsOverlapping } from 'date-fns';

export async function createBooking(spaceId: string, checkIn: Date, checkOut: Date, guests: number, totalPrice: number) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to book a sanctuary.' };
  }

  // Fetch the space to get its iCal URL
  const { data: space } = await supabase
    .from('spaces')
    .select('airbnb_ical_url')
    .eq('id', spaceId)
    .single();

  // Validate dates in real-time
  const blockedIntervals = await getBlockedIntervals(spaceId, space?.airbnb_ical_url);
  
  const requestedInterval = { start: checkIn, end: checkOut };
  const isBlocked = blockedIntervals.some(blocked => 
    areIntervalsOverlapping(requestedInterval, { start: new Date(blocked.start), end: new Date(blocked.end) })
  );

  if (isBlocked) {
    return { error: 'These dates are no longer available. Please select different dates.' };
  }

  const { error } = await supabase
    .from('bookings')
    .insert({
      space_id: spaceId,
      user_id: user.id,
      check_in: checkIn.toISOString(),
      check_out: checkOut.toISOString(),
      guests,
      total_price: totalPrice,
      status: 'pending',
      payment_status: 'pending'
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

export async function cancelBooking(bookingId: string, formData?: FormData): Promise<any> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized. Please sign in.' };
    }

    const adminClient = createAdminClient();

    const { data: booking, error: fetchError } = await adminClient
      .from('bookings')
      .select('id, user_id, guest_phone, status')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return { error: 'Booking not found.' };
    }

    const isAdmin = await isUserAdminAsync(user);
    const userPhoneDigits = user.phone ? user.phone.replace(/[^0-9]/g, '') : '';
    const bookingPhoneDigits = booking.guest_phone ? booking.guest_phone.replace(/[^0-9]/g, '') : '';
    const isOwner = booking.user_id === user.id || (userPhoneDigits && bookingPhoneDigits && userPhoneDigits.endsWith(bookingPhoneDigits.slice(-10)));

    if (!isOwner && !isAdmin) {
      return { error: 'You are not authorized to cancel this booking.' };
    }

    const { error } = await adminClient
      .from('bookings')
      .update({ 
        status: 'cancelled',
        booking_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) return { error: error.message };

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/bookings');
    revalidatePath('/admin');
    revalidatePath('/admin/calendar');
    return { success: true };
  } catch (err: any) {
    console.error('Error cancelling booking:', err);
    return { error: err.message || 'Failed to cancel booking' };
  }
}
