import { createAdminClient } from '@/lib/supabase/admin';
import { dispatchOmnichannelMessage, sendWhatsAppMessage } from '@/lib/omnichannel/meta';

export const STAGE_1_DEFAULT_TEMPLATE = `Hey {{guest_name}}
Thanks for booking {{space_title}} for {{check_in_date}}.
Your check-in time is anytime after {{check_in_time}} and check-out is anytime after {{check_out_time}} on {{check_out_date}}.
Please send us front & back of *both*/*all* the guest’s Aadhaar/Passport so that we can send you the location of the property.`;

export const STAGE_2_DEFAULT_TEMPLATE = `Hey {{guest_name}}
Your identity cards have been verified, and your check-in to the property {{space_title}} for {{check_in_date}} at {{check_in_time}} is confirmed.
Please use the below information to get to the property : 
{{cab_drop_instructions}}
Google Maps location : {{google_maps_url}}
{{parking_instructions}}
Make sure you call the Caretaker an hour before you check in so that your property can be ready before you come in.
{{caretaker_name}} - {{caretaker_phone}}`;

export const STAGE_3_DEFAULT_TEMPLATE = `Thanks for staying with us at {{space_title}}, the Checkout time is {{check_out_time}}.
We listen to all the feedbacks directly and really want to make you have a great experience, do let us know if we could improve with something.
Hoping to host you again 🎀🩷`;

/**
 * Interpolates template variables with concrete booking/space attributes.
 */
export function interpolateTemplate(
  template: string,
  variables: Record<string, string | number | undefined | null>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const valStr = value !== undefined && value !== null ? String(value) : '';
    result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), valStr);
  }
  return result;
}

/**
 * Stage 1: Immediate Booking Confirmation & ID Request
 * Triggered immediately upon booking creation / confirmation.
 * NOTE: Property location, coordinates, and caretaker contact are deliberately omitted!
 */
export async function dispatchStage1BookingConfirmation(bookingId: string): Promise<{
  success: boolean;
  message?: string;
  dispatchedTo?: string;
}> {
  const supabase = createAdminClient();

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id, guest_name, guest_phone, guest_email, check_in, check_out, stage_1_dispatched_at,
      spaces (
        id, title, check_in_time, check_out_time
      )
    `)
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    console.error('[Guest Journey Stage 1] Booking not found:', error);
    return { success: false, message: 'Booking not found' };
  }

  const phone = booking.guest_phone;
  if (!phone) {
    console.warn('[Guest Journey Stage 1] No guest phone recorded for booking:', bookingId);
    return { success: false, message: 'No guest phone recorded' };
  }

  // Fetch customizable template from chatflows table
  const { data: flowRecord } = await supabase
    .from('chatflows')
    .select('response_template, is_active, channel')
    .or('trigger_event.eq.stage_1_booking_confirmed,trigger_event.eq.booking_confirmed')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  const template = flowRecord?.response_template || STAGE_1_DEFAULT_TEMPLATE;
  const spaceRecord: any = Array.isArray(booking.spaces) ? booking.spaces[0] : booking.spaces;

  const renderedMessage = interpolateTemplate(template, {
    guest_name: booking.guest_name || 'Guest',
    space_title: spaceRecord?.title || 'Private Sanctuary',
    check_in_date: booking.check_in,
    check_in_time: spaceRecord?.check_in_time || '3:00 PM',
    check_out_time: spaceRecord?.check_out_time || '11:00 AM',
    check_out_date: booking.check_out,
  });

  const channel = (flowRecord?.channel as any) || 'whatsapp';
  const dispatchRes = await dispatchOmnichannelMessage({
    channel,
    recipient: phone,
    text: renderedMessage,
    bookingId: booking.id,
    senderName: 'Nothingness Omnichannel',
  });

  // Mark stage 1 dispatched
  await supabase
    .from('bookings')
    .update({ stage_1_dispatched_at: new Date().toISOString() })
    .eq('id', booking.id);

  console.log(`[Guest Journey Stage 1] Successfully dispatched to ${phone} for ${spaceRecord?.title}`);
  return {
    success: dispatchRes.success,
    dispatchedTo: phone,
    message: renderedMessage,
  };
}

/**
 * Stage 2: Post-ID Verification - Location, Directions & Caretaker Contact
 * Triggered as soon as both/all guests' IDs are verified.
 */
export async function checkAndDispatchStage2IfAllGuestsVerified(bookingId: string): Promise<{
  allVerified: boolean;
  dispatched: boolean;
  message?: string;
  totalGuests: number;
  verifiedGuests: number;
}> {
  const supabase = createAdminClient();

  const { data: booking, error: bError } = await supabase
    .from('bookings')
    .select(`
      id, guest_name, guest_phone, guest_email, check_in, stage_2_dispatched_at, guests, additional_guests_count,
      spaces (
        id, title, check_in_time, cab_drop_instructions, google_maps_url, parking_instructions, caretaker_name, caretaker_phone
      )
    `)
    .eq('id', bookingId)
    .single();

  if (bError || !booking) {
    console.error('[Guest Journey Stage 2] Booking not found:', bError);
    return { allVerified: false, dispatched: false, totalGuests: 0, verifiedGuests: 0 };
  }

  // Fetch all guests registered under this booking
  const { data: guests, error: gError } = await supabase
    .from('booking_guests')
    .select('id, name, is_primary, verification_status')
    .eq('booking_id', bookingId);

  const totalGuests = guests?.length || 0;
  const verifiedGuests = (guests || []).filter((g) => g.verification_status === 'verified').length;
  const expectedGuests = Math.max(
    totalGuests,
    booking.guests || (1 + ((booking as any).additional_guests_count || 0))
  );

  // Security Invariant: Location, directions, and caretaker contact MUST NOT be released
  // unless at least 1 guest exists and ALL expected guests are verified!
  const allVerified = totalGuests > 0 && verifiedGuests >= expectedGuests && verifiedGuests === totalGuests;

  if (!allVerified) {
    console.log(
      `[Guest Journey Stage 2] Verification pending for booking ${bookingId}: ${verifiedGuests}/${expectedGuests} guests verified.`
    );
    return { allVerified: false, dispatched: false, totalGuests: expectedGuests, verifiedGuests };
  }

  // If already dispatched, do not send duplicate
  if (booking.stage_2_dispatched_at) {
    console.log(`[Guest Journey Stage 2] Stage 2 already dispatched previously for booking ${bookingId}`);
    return { allVerified: true, dispatched: false, totalGuests: expectedGuests, verifiedGuests };
  }

  const phone = booking.guest_phone;
  if (!phone) {
    console.warn('[Guest Journey Stage 2] No guest phone recorded for booking:', bookingId);
    return { allVerified: true, dispatched: false, totalGuests, verifiedGuests };
  }

  // Fetch customizable template from chatflows table
  const { data: flowRecord } = await supabase
    .from('chatflows')
    .select('response_template, is_active, channel')
    .eq('trigger_event', 'stage_2_id_verified')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  const template = flowRecord?.response_template || STAGE_2_DEFAULT_TEMPLATE;
  const spaceRecord: any = Array.isArray(booking.spaces) ? booking.spaces[0] : booking.spaces;

  const renderedMessage = interpolateTemplate(template, {
    guest_name: booking.guest_name || 'Guest',
    space_title: spaceRecord?.title || 'Private Sanctuary',
    check_in_date: booking.check_in,
    check_in_time: spaceRecord?.check_in_time || '3:00 PM',
    cab_drop_instructions: spaceRecord?.cab_drop_instructions || 'Drop-off at Hauz Khas Village Main Gate, lane opposite Deer Park entrance.',
    google_maps_url: spaceRecord?.google_maps_url || 'https://maps.google.com/?q=28.5494,77.1945',
    parking_instructions: spaceRecord?.parking_instructions || 'Dedicated valet parking available at Deer Park entrance; inform security of Nothingness reservation.',
    caretaker_name: spaceRecord?.caretaker_name || 'Vikram (Sanctuary Caretaker)',
    caretaker_phone: spaceRecord?.caretaker_phone || '+91 98111 23456',
  });

  const channel = (flowRecord?.channel as any) || 'whatsapp';
  const dispatchRes = await dispatchOmnichannelMessage({
    channel,
    recipient: phone,
    text: renderedMessage,
    bookingId: booking.id,
    senderName: 'Nothingness Omnichannel',
  });

  // Mark stage 2 dispatched & id verification completed
  const nowStr = new Date().toISOString();
  await supabase
    .from('bookings')
    .update({
      stage_2_dispatched_at: nowStr,
      id_verification_completed_at: nowStr,
    })
    .eq('id', booking.id);

  console.log(`[Guest Journey Stage 2] ✅ All ${expectedGuests} guests verified. Location & Caretaker dispatched to ${phone}.`);

  return {
    allVerified: true,
    dispatched: dispatchRes.success,
    message: renderedMessage,
    totalGuests: expectedGuests,
    verifiedGuests,
  };
}

/**
 * Stage 3: Checkout Reminder & Feedback (T-3 Hours before checkout)
 */
export async function dispatchStage3CheckoutReminder(bookingId: string): Promise<{
  success: boolean;
  message?: string;
  dispatchedTo?: string;
}> {
  const supabase = createAdminClient();

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id, guest_name, guest_phone, check_out, stage_3_dispatched_at,
      spaces (
        id, title, check_out_time
      )
    `)
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    console.error('[Guest Journey Stage 3] Booking not found:', error);
    return { success: false, message: 'Booking not found' };
  }

  if (booking.stage_3_dispatched_at) {
    return { success: true, message: 'Stage 3 already dispatched' };
  }

  const phone = booking.guest_phone;
  if (!phone) {
    console.warn('[Guest Journey Stage 3] No guest phone recorded for booking:', bookingId);
    return { success: false, message: 'No guest phone recorded' };
  }

  // Fetch customizable template from chatflows table
  const { data: flowRecord } = await supabase
    .from('chatflows')
    .select('response_template, is_active, channel')
    .or('trigger_event.eq.stage_3_checkout_reminder,trigger_event.eq.check_out')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  const template = flowRecord?.response_template || STAGE_3_DEFAULT_TEMPLATE;
  const spaceRecord: any = Array.isArray(booking.spaces) ? booking.spaces[0] : booking.spaces;

  const renderedMessage = interpolateTemplate(template, {
    guest_name: booking.guest_name || 'Guest',
    space_title: spaceRecord?.title || 'Private Sanctuary',
    check_out_time: spaceRecord?.check_out_time || '11:00 AM',
  });

  const channel = (flowRecord?.channel as any) || 'whatsapp';
  const dispatchRes = await dispatchOmnichannelMessage({
    channel,
    recipient: phone,
    text: renderedMessage,
    bookingId: booking.id,
    senderName: 'Nothingness Omnichannel',
  });

  // Mark stage 3 dispatched
  await supabase
    .from('bookings')
    .update({ stage_3_dispatched_at: new Date().toISOString() })
    .eq('id', booking.id);

  console.log(`[Guest Journey Stage 3] Checkout reminder dispatched to ${phone}`);
  return {
    success: dispatchRes.success,
    dispatchedTo: phone,
    message: renderedMessage,
  };
}
