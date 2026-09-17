import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';
import { env } from '@/lib/env';

// Configure VAPID keys if provided
const vapidPublicKey = env.FIREBASE_WEBPUSH_CERTIFICATE;
const vapidPrivateKey = env.FIREBASE_WEBPUSH_CERTIFICATE_PRIVATEKEY;

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(
      'mailto:sanctuary@nothingness.in',
      vapidPublicKey,
      vapidPrivateKey
    );
  } catch (err) {
    console.error('Failed to configure WebPush VAPID details:', err);
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, any>;
}

/**
 * Send a discreet lockscreen push notification to a specific user.
 */
export async function sendPushNotificationToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; sentCount: number; errors?: any[] }> {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('WebPush VAPID keys missing. Skipping push notification.');
      return { success: false, sentCount: 0 };
    }

    const supabase = createAdminClient();
    const { data: subs, error } = await supabase
      .from('web_push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error || !subs || subs.length === 0) {
      return { success: true, sentCount: 0 };
    }

    let sentCount = 0;
    const errors: any[] = [];

    const stringifiedPayload = JSON.stringify({
      title: payload.title || 'Nothingness Sanctuary',
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/badge-72x72.png',
      url: payload.url || '/sanctuary-pass',
      tag: payload.tag || 'sanctuary-alert',
      data: payload.data || {},
    });

    for (const sub of subs) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        await webpush.sendNotification(pushSubscription, stringifiedPayload, {
          TTL: 60 * 60 * 24, // 24 hours
        });
        sentCount++;
      } catch (err: any) {
        // Remove expired / invalid subscriptions
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('web_push_subscriptions').delete().eq('id', sub.id);
        } else {
          errors.push({ subId: sub.id, error: err.message });
        }
      }
    }

    return { success: true, sentCount, errors };
  } catch (err: any) {
    console.error('Error dispatching push notification:', err);
    return { success: false, sentCount: 0, errors: [err.message] };
  }
}

/**
 * Broadcast a push notification to multiple users.
 */
export async function broadcastPushNotification(
  userIds: string[],
  payload: PushNotificationPayload
): Promise<{ success: boolean; totalSent: number }> {
  let totalSent = 0;
  for (const uid of userIds) {
    const res = await sendPushNotificationToUser(uid, payload);
    totalSent += res.sentCount;
  }
  return { success: true, totalSent };
}

/**
 * Broadcast a push notification to ALL subscribed devices across the platform.
 */
export async function broadcastPushNotificationToAllSubscribers(
  payload: PushNotificationPayload
): Promise<{ success: boolean; totalSent: number; totalFailed: number }> {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('WebPush VAPID keys missing. Mocking broadcast notification.');
      return { success: true, totalSent: 0, totalFailed: 0 };
    }

    const supabase = createAdminClient();
    const { data: subs, error } = await supabase
      .from('web_push_subscriptions')
      .select('*');

    if (error || !subs || subs.length === 0) {
      return { success: true, totalSent: 0, totalFailed: 0 };
    }

    const stringifiedPayload = JSON.stringify({
      title: payload.title || 'Nothingness Sanctuary',
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/badge-72x72.png',
      url: payload.url || '/',
      tag: payload.tag || 'broadcast-alert',
      data: payload.data || {},
    });

    let totalSent = 0;
    let totalFailed = 0;

    for (const sub of subs) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        await webpush.sendNotification(pushSubscription, stringifiedPayload, {
          TTL: 60 * 60 * 24, // 24 hours
        });
        totalSent++;
      } catch (err: any) {
        totalFailed++;
        // Remove expired / invalid subscriptions from Supabase
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('web_push_subscriptions').delete().eq('id', sub.id);
        }
      }
    }

    return { success: true, totalSent, totalFailed };
  } catch (err: any) {
    console.error('Error broadcasting push notification:', err);
    return { success: false, totalSent: 0, totalFailed: 0 };
  }
}

