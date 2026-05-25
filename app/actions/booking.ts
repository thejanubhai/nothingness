'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createBooking(propertyId: string, checkIn: Date, checkOut: Date, guests: number, totalPrice: number) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to book a sanctuary.' };
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
