import { createAdminClient } from '@/lib/supabase/admin';
import { sendPushNotificationToUser } from '@/lib/webpush';

/**
 * Intelligent Ratio Balancer & Waitlist Auto-Promoter
 */
export async function checkAndPromoteWaitlistedCandidates(eventId: string) {
  const supabase = createAdminClient();

  // 1. Fetch Event Quotas and Details
  const { data: event, error: eventError } = await supabase
    .from('sanctuary_events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    console.error('Failed to fetch event for ratio balancing:', eventError);
    return { success: false, error: 'Event not found' };
  }

  // 2. Fetch all active applications for this event
  const { data: apps, error: appsError } = await supabase
    .from('sanctuary_event_applications')
    .select('*')
    .eq('event_id', eventId);

  if (appsError || !apps) {
    return { success: false, error: 'Failed to fetch applications' };
  }

  const confirmedCouples = apps.filter(
    (a) => a.category === 'couple' && ['confirmed', 'checked_in', 'approved_payment_pending'].includes(a.status)
  ).length;

  const confirmedFemales = apps.filter(
    (a) => a.category === 'single_female' && ['confirmed', 'checked_in', 'approved_payment_pending'].includes(a.status)
  ).length;

  const confirmedMales = apps.filter(
    (a) => a.category === 'single_male' && ['confirmed', 'checked_in', 'approved_payment_pending'].includes(a.status)
  ).length;

  // 3. Dynamic Single Male Capacity calculation (Anchor rule: 1 male per 2 couples or 1 female)
  const dynamicAllowedMales = Math.min(
    event.max_males || 3,
    Math.max(1, Math.floor(confirmedCouples * 0.5 + confirmedFemales * 0.5))
  );

  const maleSlotsAvailable = dynamicAllowedMales - confirmedMales;

  const promotions: any[] = [];

  if (maleSlotsAvailable > 0) {
    // 4. Fetch top waitlisted single males sorted by AI score
    const waitlistedMales = apps
      .filter((a) => a.category === 'single_male' && a.status === 'waitlisted')
      .sort((a, b) => (b.ai_trust_score || 0) - (a.ai_trust_score || 0));

    const candidatesToPromote = waitlistedMales.slice(0, maleSlotsAvailable);

    for (const candidate of candidatesToPromote) {
      const deadline = new Date(Date.now() + 90 * 60 * 1000).toISOString(); // 90 minutes from now

      const { data: updated, error: updateErr } = await supabase
        .from('sanctuary_event_applications')
        .update({
          status: 'approved_payment_pending',
          payment_deadline: deadline,
          updated_at: new Date().toISOString(),
        })
        .eq('id', candidate.id)
        .select()
        .single();

      if (!updateErr && updated) {
        promotions.push(updated);

        // Send instant WebPush notification
        await sendPushNotificationToUser(candidate.user_id, {
          title: '⚡ Sanctuary Pass Slot Unlocked!',
          body: `A curated pass just opened for "${event.title}". You have 90 minutes to claim your ticket before it passes to the next candidate.`,
          url: `/sanctuary-pass?eventId=${event.id}&action=checkout`,
          tag: `slot-unlocked-${event.id}`,
        });
      }
    }
  }

  return {
    success: true,
    dynamicAllowedMales,
    confirmedMales,
    maleSlotsAvailable,
    promotedCount: promotions.length,
    promotions,
  };
}

/**
 * Recycles expired unpaid offers and re-triggers waitlist promotions.
 */
export async function recycleExpiredOffers(eventId?: string) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  let query = supabase
    .from('sanctuary_event_applications')
    .select('*, sanctuary_events(title)')
    .eq('status', 'approved_payment_pending')
    .lt('payment_deadline', now);

  if (eventId) {
    query = query.eq('event_id', eventId);
  }

  const { data: expiredApps, error } = await query;
  if (error || !expiredApps || expiredApps.length === 0) {
    return { recycledCount: 0 };
  }

  let recycledCount = 0;
  const affectedEvents = new Set<string>();

  for (const app of expiredApps) {
    await supabase
      .from('sanctuary_event_applications')
      .update({
        status: 'dropped_out',
        updated_at: new Date().toISOString(),
      })
      .eq('id', app.id);

    recycledCount++;
    affectedEvents.add(app.event_id);

    // Notify user of expiration
    await sendPushNotificationToUser(app.user_id, {
      title: 'Pass Reservation Expired',
      body: `Your time-limited pass reservation for "${app.sanctuary_events?.title || 'Sanctuary Gathering'}" has expired.`,
      url: '/sanctuary-pass',
    });
  }

  // Auto-promote next candidates in affected events
  for (const evId of affectedEvents) {
    await checkAndPromoteWaitlistedCandidates(evId);
  }

  return { recycledCount, affectedEvents: Array.from(affectedEvents) };
}
