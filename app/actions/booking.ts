'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

import { getBlockedIntervals } from './calendar';
import { areIntervalsOverlapping } from 'date-fns';

export async function createBooking(propertyId: string, checkIn: Date, checkOut: Date, guests: number, totalPrice: number) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to book a sanctuary.' };
  }

  // Fetch the property to get its iCal URL
  const { data: property } = await supabase
    .from('properties')
    .select('airbnb_ical_url')
    .eq('id', propertyId)
    .single();

  // Validate dates in real-time
  const blockedIntervals = await getBlockedIntervals(propertyId, property?.airbnb_ical_url);
  
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
      property_id: propertyId,
      user_id: user.id,
      check_in: checkIn.toISOString(),
      check_out: checkOut.toISOString(),
      guests,
      total_price: totalPrice,
      booking_status: 'pending',
      payment_status: 'pending'
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}
