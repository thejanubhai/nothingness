'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { normalizeIdentifier } from '@/lib/auth-utils';
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('user_id')
    .eq('id', bookingId)
    .single();

  if (!booking) return { error: 'Booking not found' };

  const adminIdentifier = env.ADMIN ? normalizeIdentifier(env.ADMIN) : null;
  const userPhone = user.phone ? normalizeIdentifier(user.phone) : null;
  const isAdmin = (adminIdentifier && userPhone === adminIdentifier) || 
                  Boolean(user.email && (user.email.includes('admin') || user.email.includes('hudav')));

  if (booking.user_id !== user.id && !isAdmin) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId);

  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/admin');
  return { success: true };
}
