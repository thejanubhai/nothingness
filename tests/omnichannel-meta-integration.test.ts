import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  formatWhatsAppRecipient,
  sendWhatsAppMessage,
  sendInstagramMessage,
  resolveInstagramAccessToken,
  resetInstagramTokenCache,
  dispatchOmnichannelMessage,
  verifyMetaWebhookSignature,
} from '../lib/omnichannel/meta';
import {
  STAGE_1_DEFAULT_TEMPLATE,
  STAGE_2_DEFAULT_TEMPLATE,
  STAGE_3_DEFAULT_TEMPLATE,
  interpolateTemplate,
} from '../lib/chat/guest-journey';
import { NextRequest } from 'next/server';
import { generateFacebookOAuthUrl, GET as handleFacebookAuthGet } from '../app/api/auth/facebook/route';
import { GET as handleFacebookCallbackGet } from '../app/api/auth/facebook/callback/route';
import { checkFacebookConnection } from '../app/api/admin/facebook/status/route';
import { maskId as maskFacebookId } from '../app/admin/inbox/FacebookSettingsCard';

describe('Omnichannel Meta Graph API & 3-Stage Guest Journey Integration', () => {
  // =========================================================================
  // 1. Environment Variable Parsing & Meta Graph API Invariants
  // =========================================================================
  test('lib/env.ts safely parses WhatsApp and Meta Graph API environment variables including Instagram App credentials', () => {
    const envFile = path.resolve(process.cwd(), 'lib/env.ts');
    const content = fs.readFileSync(envFile, 'utf8');

    // Verify all required Meta / WhatsApp variables are defined in the schema
    assert.ok(content.includes('WHATSAPP_PHONE_NUMBER_ID:'), 'WHATSAPP_PHONE_NUMBER_ID must exist in envSchema');
    assert.ok(content.includes('WHATSAPP_ACCESS_TOKEN:'), 'WHATSAPP_ACCESS_TOKEN must exist in envSchema');
    assert.ok(content.includes('WHATSAPP_BUSINESS_ACCOUNT_ID:'), 'WHATSAPP_BUSINESS_ACCOUNT_ID must exist in envSchema');
    assert.ok(content.includes('WHATSAPP_WEBHOOK_VERIFY_TOKEN:'), 'WHATSAPP_WEBHOOK_VERIFY_TOKEN must exist in envSchema');
    assert.ok(content.includes('meta_App_ID:'), 'meta_App_ID must exist in envSchema');
    assert.ok(content.includes('meta_App_secret:'), 'meta_App_secret must exist in envSchema');
    assert.ok(content.includes('INSTAGRAM_ACCESS_TOKEN:'), 'INSTAGRAM_ACCESS_TOKEN must exist in envSchema');

    // Verify Instagram App ID, Name, Secret and case variants
    assert.ok(content.includes('Instagram_app_ID:'), 'Instagram_app_ID must exist in envSchema');
    assert.ok(content.includes('INSTAGRAM_APP_ID:'), 'INSTAGRAM_APP_ID must exist in envSchema');
    assert.ok(content.includes('Instagram_app_name:'), 'Instagram_app_name must exist in envSchema');
    assert.ok(content.includes('INSTAGRAM_APP_NAME:'), 'INSTAGRAM_APP_NAME must exist in envSchema');
    assert.ok(content.includes('Instagram_app_secret:'), 'Instagram_app_secret must exist in envSchema');
    assert.ok(content.includes('INSTAGRAM_APP_SECRET:'), 'INSTAGRAM_APP_SECRET must exist in envSchema');

    // Verify support for uppercase, lowercase, and camelCase variants
    assert.ok(content.includes('whatsapp_phone_number_id'), 'Supports lowercase whatsapp_phone_number_id');
    assert.ok(content.includes('whatsappPhoneNumberId'), 'Supports camelCase whatsappPhoneNumberId');
    assert.ok(content.includes('META_APP_ID'), 'Supports uppercase META_APP_ID');
    assert.ok(content.includes('metaAppId'), 'Supports camelCase metaAppId');
    assert.ok(content.includes('META_APP_SECRET'), 'Supports uppercase META_APP_SECRET');
    assert.ok(content.includes('metaAppSecret'), 'Supports camelCase metaAppSecret');

    // Verify Facebook Login for Business Configuration ID and aliases
    assert.ok(content.includes('Facebook_login_Configuration_ID:'), 'Facebook_login_Configuration_ID must exist in envSchema');
    assert.ok(content.includes('FACEBOOK_LOGIN_CONFIGURATION_ID:'), 'FACEBOOK_LOGIN_CONFIGURATION_ID must exist in envSchema');
    assert.ok(content.includes('facebook_login_configuration_id:'), 'facebook_login_configuration_id must exist in envSchema');
    assert.ok(content.includes('FACEBOOK_CONFIG_ID:'), 'FACEBOOK_CONFIG_ID must exist in envSchema');
  });

  // =========================================================================
  // 2. WhatsApp Phone Normalization & Realtime Instagram Dispatch
  // =========================================================================
  test('formatWhatsAppRecipient normalizes 10-digit Indian numbers to E.164 without leading plus and handles trunk zero', () => {
    assert.equal(formatWhatsAppRecipient('9810123456'), '919810123456');
    assert.equal(formatWhatsAppRecipient('+91 98101 23456'), '919810123456');
    assert.equal(formatWhatsAppRecipient('whatsapp:+919810123456'), '919810123456');
    assert.equal(formatWhatsAppRecipient('09810123456'), '919810123456');
    assert.equal(formatWhatsAppRecipient('9109810123456'), '919810123456');
    assert.equal(formatWhatsAppRecipient('14155552671'), '14155552671');
  });

  test('sendWhatsAppMessage rejects empty recipient or empty message text immediately without network call', async () => {
    const emptyToRes = await sendWhatsAppMessage({ to: '', text: 'Hello' });
    assert.equal(emptyToRes.success, false);
    assert.ok(emptyToRes.error?.includes('Recipient phone ("to") and message "text" are required'));

    const emptyTextRes = await sendWhatsAppMessage({ to: '9810123456', text: '   ' });
    assert.equal(emptyTextRes.success, false);
    assert.ok(emptyTextRes.error?.includes('Recipient phone ("to") and message "text" are required'));
  });

  test('sendWhatsAppMessage mocks gracefully when environment tokens are missing', async () => {
    const res = await sendWhatsAppMessage({
      to: '9810123456',
      text: 'Test message',
    });
    assert.ok(res.success, 'Should return success in mock mode');
    assert.ok(res.mocked, 'Should be marked as mocked');
  });

  test('sendInstagramMessage rejects when tokens and app credentials are missing without mock bypass', async () => {
    const origIgToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const origWaToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const origAppId = process.env.Instagram_app_ID;
    const origAppSecret = process.env.Instagram_app_secret;
    delete process.env.INSTAGRAM_ACCESS_TOKEN;
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    delete process.env.Instagram_app_ID;
    delete process.env.INSTAGRAM_APP_ID;
    delete process.env.Instagram_app_secret;
    delete process.env.INSTAGRAM_APP_SECRET;
    resetInstagramTokenCache();

    const res = await sendInstagramMessage({
      to: 'ig_scoped_user_12345',
      text: 'Test Instagram DM',
    });

    assert.equal(res.success, false, 'Must fail when credentials are not present (no mock bypass)');
    assert.ok(res.error?.includes('Missing Meta access token or Instagram App credentials'), 'Must state missing credentials');

    if (origIgToken) process.env.INSTAGRAM_ACCESS_TOKEN = origIgToken;
    if (origWaToken) process.env.WHATSAPP_ACCESS_TOKEN = origWaToken;
    if (origAppId) process.env.Instagram_app_ID = origAppId;
    if (origAppSecret) process.env.Instagram_app_secret = origAppSecret;
  });

  test('resolveInstagramAccessToken dynamically resolves OAuth App Access Token via client_credentials', async () => {
    resetInstagramTokenCache();
    const originalFetch = globalThis.fetch;
    process.env.Instagram_app_ID = 'test_ig_app_123456';
    process.env.Instagram_app_secret = 'test_ig_secret_abcdef';
    delete process.env.INSTAGRAM_ACCESS_TOKEN;
    delete process.env.WHATSAPP_ACCESS_TOKEN;

    let oauthCalled = false;
    let dispatchCalled = false;

    globalThis.fetch = async (input: any, init?: any) => {
      const url = String(input);
      if (url.includes('graph.facebook.com/oauth/access_token')) {
        oauthCalled = true;
        assert.ok(url.includes('client_id=test_ig_app_123456'));
        assert.ok(url.includes('client_secret=test_ig_secret_abcdef'));
        assert.ok(url.includes('grant_type=client_credentials'));
        return new Response(JSON.stringify({
          access_token: 'meta_app_token_live_xyz987',
          token_type: 'bearer',
          expires_in: 3600
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (url.includes('graph.facebook.com/v21.0/me/messages') || url.includes('/messages')) {
        dispatchCalled = true;
        assert.equal(init?.headers?.Authorization, 'Bearer meta_app_token_live_xyz987');
        const body = JSON.parse(init?.body as string);
        assert.equal(body.recipient.id, 'guest_ig_recipient_888');
        assert.equal(body.message.text, 'Welcome to Nothingness');
        return new Response(JSON.stringify({
          recipient_id: 'guest_ig_recipient_888',
          message_id: 'mid_realtime_meta_9999'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      return originalFetch(input, init);
    };

    try {
      const resolved = await resolveInstagramAccessToken();
      assert.equal(resolved, 'meta_app_token_live_xyz987', 'Should resolve app access token from OAuth');
      assert.ok(oauthCalled, 'Should have invoked Meta OAuth endpoint');

      const dispatchRes = await sendInstagramMessage({
        to: 'guest_ig_recipient_888',
        text: 'Welcome to Nothingness',
      });

      assert.equal(dispatchRes.success, true, 'Dispatch must succeed in realtime');
      assert.equal(dispatchRes.messageId, 'mid_realtime_meta_9999', 'Returns real Meta message ID');
      assert.ok(dispatchCalled, 'Dispatched to Meta Graph API');
    } finally {
      globalThis.fetch = originalFetch;
      delete process.env.Instagram_app_ID;
      delete process.env.Instagram_app_secret;
      resetInstagramTokenCache();
    }
  });

  // =========================================================================
  // 3. The Real 3-Stage Guest Journey Verification
  // =========================================================================
  test('Stage 1: Immediate Booking Confirmation & ID Request template matches exact specification', () => {
    const rendered = interpolateTemplate(STAGE_1_DEFAULT_TEMPLATE, {
      guest_name: 'Aarav',
      space_title: 'The Chamber',
      check_in_date: '2026-10-15',
      check_in_time: '3:00 PM',
      check_out_time: '11:00 AM',
      check_out_date: '2026-10-17',
    });

    assert.ok(rendered.includes('Hey Aarav'), 'Must greet guest by name');
    assert.ok(rendered.includes('Thanks for booking The Chamber for 2026-10-15.'), 'Must thank for booking space');
    assert.ok(rendered.includes('Your check-in time is anytime after 3:00 PM and check-out is anytime after 11:00 AM on 2026-10-17.'), 'Must cite check-in & check-out timings');
    assert.ok(rendered.includes("Please send us front & back of *both*/*all* the guest’s Aadhaar/Passport so that we can send you the location of the property."), 'Must request front & back of both/all guests IDs');

    // INVARIANT: Location, Google Maps URL, and Caretaker MUST NOT be in Stage 1!
    assert.ok(!rendered.includes('Google Maps'), 'Stage 1 MUST NEVER reveal Google Maps location');
    assert.ok(!rendered.includes('maps.google.com'), 'Stage 1 MUST NEVER contain map links');
    assert.ok(!rendered.includes('Caretaker -'), 'Stage 1 MUST NEVER reveal Caretaker contact before ID verification');
  });

  test('Stage 2: Post-ID Verification - Location, Directions & Caretaker Contact matches exact specification', () => {
    const rendered = interpolateTemplate(STAGE_2_DEFAULT_TEMPLATE, {
      guest_name: 'Aarav',
      space_title: 'The Chamber',
      check_in_date: '2026-10-15',
      check_in_time: '3:00 PM',
      cab_drop_instructions: 'Ask cab to drop at Hauz Khas Village entrance arch, proceed 50m straight to the cobblestone alley.',
      google_maps_url: 'https://maps.google.com/?q=28.5535,77.1944',
      parking_instructions: 'Designated covered parking at Hauz Khas multi-level facility.',
      caretaker_name: 'Vikram (Chamber Caretaker)',
      caretaker_phone: '+91 98111 23456',
    });

    assert.ok(rendered.includes('Hey Aarav'), 'Must greet guest by name');
    assert.ok(rendered.includes('Your identity cards have been verified, and your check-in to the property The Chamber for 2026-10-15 at 3:00 PM is confirmed.'), 'Must confirm ID verification and check-in time');
    assert.ok(rendered.includes('Please use the below information to get to the property :'), 'Must introduce location info');
    assert.ok(rendered.includes('Ask cab to drop at Hauz Khas Village entrance arch'), 'Must include cab drop instructions');
    assert.ok(rendered.includes('Google Maps location : https://maps.google.com/?q=28.5535,77.1944'), 'Must include Google Maps location');
    assert.ok(rendered.includes('Designated covered parking at Hauz Khas multi-level facility.'), 'Must include parking instructions');
    assert.ok(rendered.includes('Make sure you call the Caretaker an hour before you check in so that your property can be ready before you come in.'), 'Must include caretaker advance call instruction');
    assert.ok(rendered.includes('Vikram (Chamber Caretaker) - +91 98111 23456'), 'Must include caretaker name and phone');
  });

  test('Stage 3: Checkout Reminder & Feedback (T-3h) matches exact specification', () => {
    const rendered = interpolateTemplate(STAGE_3_DEFAULT_TEMPLATE, {
      space_title: 'The Chamber',
      check_out_time: '11:00 AM',
    });

    assert.ok(rendered.includes('Thanks for staying with us at The Chamber, the Checkout time is 11:00 AM.'), 'Must thank for stay and state checkout time');
    assert.ok(rendered.includes('We listen to all the feedbacks directly and really want to make you have a great experience, do let us know if we could improve with something.'), 'Must request authentic feedback');
    assert.ok(rendered.includes('Hoping to host you again 🎀🩷'), 'Must include signature signoff');
  });

  // =========================================================================
  // 4. Space Logistics Schema & Seed Verification
  // =========================================================================
  test('Space logistics columns and seed data exist in local migration', () => {
    const migrationFile = path.resolve(
      process.cwd(),
      'supabase/migrations/20260914060000_omnichannel_guest_journey_and_space_logistics.sql'
    );
    assert.ok(fs.existsSync(migrationFile), 'Omnichannel guest journey migration must exist');

    const sql = fs.readFileSync(migrationFile, 'utf8');
    assert.ok(sql.includes('caretaker_name TEXT'), 'Spaces table has caretaker_name');
    assert.ok(sql.includes('caretaker_phone TEXT'), 'Spaces table has caretaker_phone');
    assert.ok(sql.includes('cab_drop_instructions TEXT'), 'Spaces table has cab_drop_instructions');
    assert.ok(sql.includes('parking_instructions TEXT'), 'Spaces table has parking_instructions');
    assert.ok(sql.includes('google_maps_url TEXT'), 'Spaces table has google_maps_url');

    // Verify seed data for key spaces
    assert.ok(sql.includes('The Chamber') || sql.includes('the-chamber'), 'The Chamber has custom logistics');
    assert.ok(sql.includes('The Void') || sql.includes('the-void'), 'The Void has custom logistics');
    assert.ok(sql.includes('The Mirage') || sql.includes('the-mirage'), 'The Mirage has custom logistics');
    assert.ok(sql.includes('Bangri') || sql.includes('bangri'), 'Bangri has custom logistics');
  });

  // =========================================================================
  // 5. Admin Live Inbox 2-Way Chat & AI Learning Invariants
  // =========================================================================
  test('Admin send route supports WhatsApp, Instagram dispatch and trains AI knowledge base', () => {
    const sendRouteFile = path.resolve(process.cwd(), 'app/api/inbox/send/route.ts');
    const content = fs.readFileSync(sendRouteFile, 'utf8');

    assert.ok(content.includes('sendWhatsAppMessage'), 'Dispatches via WhatsApp Meta Graph API');
    assert.ok(content.includes('sendInstagramMessage'), 'Dispatches via Instagram Meta Graph API');
    assert.ok(content.includes('trainAI('), 'Trains AI with host manual reply');
  });

  // =========================================================================
  // 6. Dual-Track ID Verification Invariants
  // =========================================================================
  test('Dual-track ID verification triggers Stage 2 only when all guests are verified', () => {
    const verifyIdRoute = path.resolve(process.cwd(), 'app/api/verify-id/route.ts');
    const verifyContent = fs.readFileSync(verifyIdRoute, 'utf8');
    assert.ok(
      verifyContent.includes('checkAndDispatchStage2IfAllGuestsVerified'),
      'Web link ID verification checks and dispatches Stage 2'
    );

    const waWebhookRoute = path.resolve(process.cwd(), 'app/api/webhooks/whatsapp/route.ts');
    const waContent = fs.readFileSync(waWebhookRoute, 'utf8');
    assert.ok(
      waContent.includes('checkAndDispatchStage2IfAllGuestsVerified'),
      'WhatsApp in-chat ID verification checks and dispatches Stage 2'
    );
  });

  // =========================================================================
  // 7. PayU Payment Gateway Invariants
  // =========================================================================
  test('No Razorpay references in payment routes and PayU is the primary gateway', () => {
    const payuFile = path.resolve(process.cwd(), 'lib/payu.ts');
    assert.ok(fs.existsSync(payuFile), 'lib/payu.ts must exist');

    const payuWebhook = path.resolve(process.cwd(), 'app/api/webhooks/payu/route.ts');
    assert.ok(fs.existsSync(payuWebhook), 'PayU webhook must exist');

    const guestPayRoute = path.resolve(process.cwd(), 'app/api/verify-guest/pay/route.ts');
    assert.ok(fs.existsSync(guestPayRoute), 'Guest split-pay route must exist');
    const guestPayContent = fs.readFileSync(guestPayRoute, 'utf8');
    assert.ok(guestPayContent.includes('createPayUPaymentRequestAsync'), 'Guest split-pay uses PayU');
    assert.ok(!guestPayContent.includes('razorpay'), 'Guest split-pay must not use Razorpay');

    // Invariant: app/layout.tsx MUST NOT load Razorpay checkout script
    const layoutFile = path.resolve(process.cwd(), 'app/layout.tsx');
    const layoutContent = fs.readFileSync(layoutFile, 'utf8');
    assert.ok(!layoutContent.includes('checkout.razorpay.com'), 'app/layout.tsx MUST NOT include Razorpay script');
  });

  // =========================================================================
  // 8. Cron Invariants (AGENTS.md compliance) & T-3h Window Evaluation
  // =========================================================================
  test('Chatflows cron endpoint adheres strictly to AGENTS.md external cron invariants', () => {
    const cronFile = path.resolve(process.cwd(), 'app/api/cron/chatflows/route.ts');
    const content = fs.readFileSync(cronFile, 'utf8');

    assert.ok(content.includes("export const dynamic = 'force-dynamic'"), 'Must export dynamic = force-dynamic');
    assert.ok(content.includes('CRON_SECRET'), 'Must validate CRON_SECRET');
    assert.ok(content.includes('export async function GET'), 'Must support GET method');
    assert.ok(content.includes('export async function POST'), 'Must support POST method');
    assert.ok(
      content.includes('dispatchStage3CheckoutReminder'),
      'Must trigger Stage 3 checkout feedback reminder for today departures'
    );
    assert.ok(
      content.includes('tMinus3HoursMinutes'),
      'Must calculate T-3 hours window before checkout time'
    );
  });

  // =========================================================================
  // 9. Stage 2 Multi-Guest Security & Zero-Leakage Invariants
  // =========================================================================
  test('Stage 2 verification algorithm strictly rejects zero guests and partial multi-guest bookings', () => {
    const journeyFile = path.resolve(process.cwd(), 'lib/chat/guest-journey.ts');
    const content = fs.readFileSync(journeyFile, 'utf8');

    // Verify security condition: totalGuests > 0 && verifiedGuests >= expectedGuests && verifiedGuests === totalGuests
    assert.ok(
      content.includes('totalGuests > 0 && verifiedGuests >= expectedGuests'),
      'Stage 2 must strictly require totalGuests > 0 and all expected guests verified'
    );
    assert.ok(
      !content.includes('totalGuests > 0 ? verifiedGuests === totalGuests : true'),
      'Stage 2 MUST NOT default to true when totalGuests is 0 (prevents location leak)'
    );
  });

  // =========================================================================
  // 10. Live Admin Inbox Integration & Two-Way Chat
  // =========================================================================
  test('Admin inbox page renders interactive InboxClient with live conversations and InstagramSettingsCard', () => {
    const inboxPageFile = path.resolve(process.cwd(), 'app/admin/inbox/page.tsx');
    const content = fs.readFileSync(inboxPageFile, 'utf8');

    assert.ok(content.includes('import InboxClient from "./InboxClient"'), 'Imports InboxClient');
    assert.ok(content.includes('import InstagramSettingsCard from "./InstagramSettingsCard"'), 'Imports InstagramSettingsCard');
    assert.ok(content.includes('<InboxClient initialConversations='), 'Renders InboxClient with conversations');
    assert.ok(content.includes('<InstagramSettingsCard'), 'Renders InstagramSettingsCard in settings');
    assert.ok(!content.includes("type=\"text\"\n                    placeholder=\"Type a message...\"\n                    disabled"), 'Does not render disabled mock form');

    // Verify InboxClient supports channel filtering & Instagram inquiries
    const clientFile = path.resolve(process.cwd(), 'app/admin/inbox/InboxClient.tsx');
    const clientContent = fs.readFileSync(clientFile, 'utf8');
    assert.ok(clientContent.includes('channelFilter'), 'InboxClient maintains channelFilter state');
    assert.ok(clientContent.includes("setChannelFilter('instagram')"), 'InboxClient provides Instagram filter pill');
    assert.ok(clientContent.includes('initialChannel'), 'InboxClient accepts initialChannel prop');
  });

  // =========================================================================
  // 11. PayU Callback Stage 1 Dispatch
  // =========================================================================
  test('PayU callback route dispatches Stage 1 booking confirmation upon successful payment', () => {
    const callbackFile = path.resolve(process.cwd(), 'app/api/payment/payu-callback/route.ts');
    const content = fs.readFileSync(callbackFile, 'utf8');

    assert.ok(
      content.includes('dispatchStage1BookingConfirmation(existingBooking.id)'),
      'PayU callback dispatches Stage 1 confirmation for existing booking'
    );
    assert.ok(
      content.includes('dispatchStage1BookingConfirmation(udf1)'),
      'PayU callback dispatches Stage 1 confirmation for udf1 fallback'
    );
  });

  // =========================================================================
  // 12. Realtime Instagram Meta Graph Status Endpoint & Inbound Webhooks
  // =========================================================================
  test('Realtime Instagram Meta Graph API status endpoint enforces admin auth and checks connection', () => {
    const statusFile = path.resolve(process.cwd(), 'app/api/admin/instagram/status/route.ts');
    assert.ok(fs.existsSync(statusFile), 'Instagram status endpoint file must exist');

    const content = fs.readFileSync(statusFile, 'utf8');
    assert.ok(content.includes("export const dynamic = 'force-dynamic'"), 'Status endpoint must be dynamic');
    assert.ok(content.includes('isUserAdminAsync'), 'Status endpoint enforces admin access');
    assert.ok(content.includes('graph.facebook.com/v21.0'), 'Calls Meta Graph API v21.0');
    assert.ok(content.includes('resolveInstagramAccessToken'), 'Uses dynamic token resolution');
    assert.ok(content.includes('debug_token'), 'Inspects genuine permissions via debug_token endpoint');
    assert.ok(!content.includes("'pages_read_engagement'"), 'Does not hardcode static mock permissions array');
  });

  test('Omni Webhook processes Instagram DM webhooks in realtime with Gemini ID verification and guards against echoes', () => {
    const webhookFile = path.resolve(process.cwd(), 'app/api/webhooks/omni/route.ts');
    const content = fs.readFileSync(webhookFile, 'utf8');

    assert.ok(content.includes("payload.object === 'instagram'"), 'Handles Instagram object webhook');
    assert.ok(content.includes("channel = 'instagram'"), 'Assigns instagram channel');
    assert.ok(content.includes('sendInstagramMessage'), 'Dispatches realtime reply via sendInstagramMessage');
    assert.ok(content.includes('GoogleGenAI'), 'Employs Gemini AI for ID document verification');
    assert.ok(content.includes('checkAndDispatchStage2IfAllGuestsVerified'), 'Triggers Stage 2 dispatch on verified ID');
    assert.ok(content.includes('is_echo'), 'Guards against echo messages to avoid infinite loops');
    assert.ok(content.includes('igMsg.delivery'), 'Guards against delivery receipts');
    assert.ok(content.includes('igMsg.read'), 'Guards against read receipts');
  });

  test('sendInstagramMessage rejects empty recipient or empty message text immediately without network call', async () => {
    const emptyToRes = await sendInstagramMessage({ to: '', text: 'Hello' });
    assert.equal(emptyToRes.success, false);
    assert.ok(emptyToRes.error?.includes('Recipient ID ("to") and message "text" are required'));

    const emptyTextRes = await sendInstagramMessage({ to: '12345', text: '   ' });
    assert.equal(emptyTextRes.success, false);
    assert.ok(emptyTextRes.error?.includes('Recipient ID ("to") and message "text" are required'));
  });

  test('sendInstagramMessage invalidates cached token upon receiving 401 Unauthorized from Meta', async () => {
    resetInstagramTokenCache();
    const originalFetch = globalThis.fetch;
    process.env.Instagram_app_ID = 'test_app_401';
    process.env.Instagram_app_secret = 'test_secret_401';
    delete process.env.INSTAGRAM_ACCESS_TOKEN;
    delete process.env.WHATSAPP_ACCESS_TOKEN;

    let oauthFetchCount = 0;

    globalThis.fetch = async (input: any, init?: any) => {
      const url = String(input);
      if (url.includes('graph.facebook.com/oauth/access_token')) {
        oauthFetchCount++;
        return new Response(JSON.stringify({
          access_token: `token_attempt_${oauthFetchCount}`,
          expires_in: 3600,
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (url.includes('/messages')) {
        return new Response(JSON.stringify({
          error: { message: 'Session has expired', type: 'OAuthException', code: 190 }
        }), { status: 401, headers: { 'Content-Type': 'application/json' } });
      }

      return originalFetch(input, init);
    };

    try {
      // First call will fetch token 1 and receive 401, which must invalidate the cache
      const res1 = await sendInstagramMessage({ to: 'user1', text: 'Hello' });
      assert.equal(res1.success, false);
      assert.equal(oauthFetchCount, 1);

      // Second call must fetch a fresh token since cache was invalidated on 401
      const res2 = await sendInstagramMessage({ to: 'user1', text: 'Hello again' });
      assert.equal(res2.success, false);
      assert.equal(oauthFetchCount, 2, 'Should have requested a new token from OAuth after 401 invalidation');
    } finally {
      globalThis.fetch = originalFetch;
      delete process.env.Instagram_app_ID;
      delete process.env.Instagram_app_secret;
      resetInstagramTokenCache();
    }
  });

  test('resolveInstagramAccessToken handles Meta OAuth error responses gracefully and returns null', async () => {
    resetInstagramTokenCache();
    const originalFetch = globalThis.fetch;
    process.env.Instagram_app_ID = 'bad_app_id';
    process.env.Instagram_app_secret = 'bad_secret';
    delete process.env.INSTAGRAM_ACCESS_TOKEN;
    delete process.env.WHATSAPP_ACCESS_TOKEN;

    globalThis.fetch = async (input: any, init?: any) => {
      const url = String(input);
      if (url.includes('graph.facebook.com/oauth/access_token')) {
        return new Response(JSON.stringify({
          error: {
            message: 'Error validating client secret.',
            type: 'OAuthException',
            code: 1
          }
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      return originalFetch(input, init);
    };

    try {
      const token = await resolveInstagramAccessToken();
      assert.equal(token, null, 'Must return null when Meta OAuth fails');
    } finally {
      globalThis.fetch = originalFetch;
      delete process.env.Instagram_app_ID;
      delete process.env.Instagram_app_secret;
      resetInstagramTokenCache();
    }
  });

  // =========================================================================
  // 13. Realtime WhatsApp Meta Graph API Status Endpoint & Invariants
  // =========================================================================
  test('Realtime WhatsApp Meta Graph API status endpoint enforces admin auth and queries Meta Graph v21.0', () => {
    const statusFile = path.resolve(process.cwd(), 'app/api/admin/whatsapp/status/route.ts');
    assert.ok(fs.existsSync(statusFile), 'WhatsApp status endpoint file must exist');

    const content = fs.readFileSync(statusFile, 'utf8');
    assert.ok(content.includes("export const dynamic = 'force-dynamic'"), 'WhatsApp status route must be dynamic');
    assert.ok(content.includes('isUserAdminAsync'), 'WhatsApp status route enforces admin authentication');
    assert.ok(content.includes('graph.facebook.com/v21.0'), 'WhatsApp status route calls Meta Graph API v21.0');
    assert.ok(content.includes('WHATSAPP_PHONE_NUMBER_ID'), 'WhatsApp status route uses WHATSAPP_PHONE_NUMBER_ID');
    assert.ok(content.includes('WHATSAPP_ACCESS_TOKEN'), 'WhatsApp status route uses WHATSAPP_ACCESS_TOKEN');
    assert.ok(content.includes('verified_name'), 'WhatsApp status route queries verified_name');
    assert.ok(content.includes('display_phone_number'), 'WhatsApp status route queries display_phone_number');
    assert.ok(content.includes('quality_rating'), 'WhatsApp status route queries quality_rating');
    assert.ok(content.includes('code_verification_status'), 'WhatsApp status route queries code_verification_status');
    assert.ok(content.includes('latency'), 'WhatsApp status route tracks connection latency');
    assert.ok(content.includes('export async function GET'), 'Supports GET method');
    assert.ok(content.includes('export async function POST'), 'Supports POST method');
  });

  // =========================================================================
  // 14. WhatsAppSettingsCard & Direct WhatsApp Connect Page Meta Upgrades
  // =========================================================================
  test('WhatsAppSettingsCard renders live status badge, masked IDs, ping button, and test message drawer', () => {
    const cardFile = path.resolve(process.cwd(), 'app/admin/inbox/WhatsAppSettingsCard.tsx');
    assert.ok(fs.existsSync(cardFile), 'WhatsAppSettingsCard.tsx must exist');

    const cardContent = fs.readFileSync(cardFile, 'utf8');
    assert.ok(cardContent.includes('maskId'), 'Masks sensitive Phone Number ID and WABA ID');
    assert.ok(cardContent.includes('/api/admin/whatsapp/status'), 'Hits WhatsApp status API on ping');
    assert.ok(cardContent.includes('/api/whatsapp/send-test'), 'Hits WhatsApp send-test route for real-time delivery');
    assert.ok(cardContent.includes('Test Connection / Ping'), 'Provides real-time ping button');
    assert.ok(cardContent.includes('Send Test WhatsApp'), 'Provides test WhatsApp message sender drawer');

    // Verify inbox/page.tsx renders WhatsAppSettingsCard
    const inboxPageFile = path.resolve(process.cwd(), 'app/admin/inbox/page.tsx');
    const inboxPageContent = fs.readFileSync(inboxPageFile, 'utf8');
    assert.ok(inboxPageContent.includes('import WhatsAppSettingsCard from "./WhatsAppSettingsCard"'), 'Imports WhatsAppSettingsCard');
    assert.ok(inboxPageContent.includes('<WhatsAppSettingsCard'), 'Renders WhatsAppSettingsCard in settings tab');

    // Verify whatsapp-connect/page.tsx reflects real Meta Cloud API status
    const connectPageFile = path.resolve(process.cwd(), 'app/admin/whatsapp-connect/page.tsx');
    const connectPageContent = fs.readFileSync(connectPageFile, 'utf8');
    assert.ok(connectPageContent.includes('/api/admin/whatsapp/status'), 'Queries real Meta Cloud API status');
    assert.ok(connectPageContent.includes('/api/whatsapp/send-test'), 'Dispatches live test WhatsApp via Cloud API');
    assert.ok(!connectPageContent.includes('/api/whatsapp/device-qr'), 'Does not use obsolete Baileys device QR simulation');
  });

  // =========================================================================
  // 15. Webhook Cryptographic Security (Meta HMAC-SHA256 Verification)
  // =========================================================================
  test('verifyMetaWebhookSignature validates authentic HMAC-SHA256 and rejects spoofed requests', () => {
    const payload = JSON.stringify({
      object: 'whatsapp_business_account',
      entry: [{ changes: [{ value: { messages: [{ from: '919810123456', text: { body: 'Hello' } }] } }] }],
    });
    const secret = 'meta_secret_production_key_12345';
    const validSignature =
      'sha256=' +
      crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');

    // 1. Valid signature passes
    assert.equal(
      verifyMetaWebhookSignature({ rawBody: payload, signatureHeader: validSignature, secret }),
      true,
      'Valid HMAC-SHA256 signature must be verified'
    );

    // 2. Tampered signature fails
    const tamperedSignature =
      'sha256=' +
      crypto
        .createHmac('sha256', 'wrong_secret')
        .update(payload, 'utf8')
        .digest('hex');
    assert.equal(
      verifyMetaWebhookSignature({ rawBody: payload, signatureHeader: tamperedSignature, secret }),
      false,
      'Forged signature must be rejected'
    );

    // 3. Tampered payload fails
    assert.equal(
      verifyMetaWebhookSignature({
        rawBody: payload + 'tampered',
        signatureHeader: validSignature,
        secret,
      }),
      false,
      'Payload tampering must be detected'
    );

    // 4. Missing signature when secret is configured fails
    assert.equal(
      verifyMetaWebhookSignature({ rawBody: payload, signatureHeader: null, secret }),
      false,
      'Missing signature header must be rejected when secret is configured'
    );

    // 5. Array of candidate secrets verification
    assert.equal(
      verifyMetaWebhookSignature({
        rawBody: payload,
        signatureHeader: validSignature,
        secret: ['wrong_key_1', secret, 'wrong_key_2'],
      }),
      true,
      'Must match if any candidate secret in the array is valid'
    );
    assert.equal(
      verifyMetaWebhookSignature({
        rawBody: payload,
        signatureHeader: validSignature,
        secret: ['wrong_key_1', 'wrong_key_2'],
      }),
      false,
      'Must reject if no candidate secret in the array matches'
    );

    // 6. Unconfigured secret gracefully falls back (for dev/test environments)
    assert.equal(
      verifyMetaWebhookSignature({ rawBody: payload, signatureHeader: null, secret: undefined }),
      true,
      'Missing secret allows bypass for unconfigured dev/test'
    );
  });

  test('Webhook endpoints (omni and whatsapp) enforce Meta HMAC-SHA256 verification and reject forged requests', () => {
    const omniWebhook = path.resolve(process.cwd(), 'app/api/webhooks/omni/route.ts');
    const omniContent = fs.readFileSync(omniWebhook, 'utf8');
    assert.ok(omniContent.includes('x-hub-signature-256'), 'Omni webhook checks x-hub-signature-256 header');
    assert.ok(omniContent.includes("createHmac('sha256'"), 'Omni webhook computes HMAC-SHA256 with secret');
    assert.ok(omniContent.includes('401'), 'Omni webhook returns 401 when signature is invalid');

    const waWebhook = path.resolve(process.cwd(), 'app/api/webhooks/whatsapp/route.ts');
    const waContent = fs.readFileSync(waWebhook, 'utf8');
    assert.ok(waContent.includes('x-hub-signature-256'), 'WhatsApp webhook checks x-hub-signature-256 header');
    assert.ok(waContent.includes("createHmac('sha256'"), 'WhatsApp webhook computes HMAC-SHA256 with secret');
    assert.ok(waContent.includes('401'), 'WhatsApp webhook returns 401 when signature is invalid');
    assert.ok(waContent.includes('createAdminClient'), 'WhatsApp webhook uses service role createAdminClient to bypass RLS');
  });

  // =========================================================================
  // 16. Admin Inbox Channel Filtering, Unread Badges & Deep Linking
  // =========================================================================
  test('InboxClient places channel filter buttons above search bar and supports unread badges, phone search and deep linking', () => {
    const clientFile = path.resolve(process.cwd(), 'app/admin/inbox/InboxClient.tsx');
    const content = fs.readFileSync(clientFile, 'utf8');

    // Channel filter buttons exist for All, WhatsApp, Instagram, Email
    assert.ok(content.includes('All ('), 'Contains All filter');
    assert.ok(content.includes('WhatsApp ('), 'Contains WhatsApp filter');
    assert.ok(content.includes('Instagram ('), 'Contains Instagram filter');
    assert.ok(content.includes('Email ('), 'Contains Email filter');

    // Filter buttons placed above the search bar input
    const allButtonIndex = content.indexOf('All (');
    const searchInputIndex = content.indexOf('placeholder="Search guests or messages..."');
    assert.ok(allButtonIndex > 0 && searchInputIndex > 0, 'Both filter buttons and search input must exist');
    assert.ok(allButtonIndex < searchInputIndex, 'Channel filter buttons must be positioned ABOVE the search bar');

    // Unread count calculation and badges
    assert.ok(content.includes('getConvUnreadCount'), 'Calculates unread messages per conversation');
    assert.ok(content.includes('totalUnreadCount'), 'Maintains total unread count');
    assert.ok(content.includes('waUnreadCount'), 'Maintains WhatsApp unread count');
    assert.ok(content.includes('igUnreadCount'), 'Maintains Instagram unread count');

    // Search query matches customer_id and phone numbers
    assert.ok(content.includes('customerId.toLowerCase().includes'), 'Search query matches customer ID');
    assert.ok(content.includes('phone.toLowerCase().includes'), 'Search query matches guest phone');

    // Deep linking support
    assert.ok(content.includes('window.location.search') || content.includes('searchParams'), 'Inspects URL search params for deep linking');
    assert.ok(content.includes('popstate'), 'Handles browser back/forward navigation with popstate');
    assert.ok(content.includes('channelFilter'), 'Maintains active channel filter state');
  });

  // =========================================================================
  // 17. WhatsApp Send Test Route Production Hardening
  // =========================================================================
  test('WhatsApp send-test route dispatches via sendWhatsAppMessage and enforces admin privileges before parsing body', () => {
    const sendTestFile = path.resolve(process.cwd(), 'app/api/whatsapp/send-test/route.ts');
    const content = fs.readFileSync(sendTestFile, 'utf8');

    assert.ok(content.includes("export const dynamic = 'force-dynamic'"), 'Send-test route must be dynamic');
    assert.ok(content.includes('isUserAdminAsync'), 'Send-test route enforces admin privileges');
    assert.ok(content.includes('sendWhatsAppMessage'), 'Send-test route dispatches via Meta sendWhatsAppMessage');

    const authIndex = content.indexOf('isUserAdminAsync');
    const parseBodyIndex = content.indexOf('req.json()');
    assert.ok(authIndex > 0 && parseBodyIndex > 0, 'Both auth check and body parsing must exist');
    assert.ok(authIndex < parseBodyIndex, 'Admin auth must precede body parsing for security');
  });

  // =========================================================================
  // 18. Admin Inbox Read Endpoint & Real-Time Sync
  // =========================================================================
  test('Admin inbox read endpoint exists, exports force-dynamic and enforces admin authorization', () => {
    const readRouteFile = path.resolve(process.cwd(), 'app/api/inbox/read/route.ts');
    assert.ok(fs.existsSync(readRouteFile), 'Inbox read route must exist');

    const content = fs.readFileSync(readRouteFile, 'utf8');
    assert.ok(content.includes("export const dynamic = 'force-dynamic'"), 'Inbox read route must be dynamic');
    assert.ok(content.includes('isUserAdminAsync'), 'Inbox read route enforces admin authorization');
    assert.ok(content.includes("status: 'read'"), 'Inbox read route updates message status to read');
  });

  // =========================================================================
  // 19. Admin Inbox Send Route Dynamic Export & Read Status Updates
  // =========================================================================
  test('Admin inbox send route exports force-dynamic and marks preceding guest messages as read', () => {
    const sendRouteFile = path.resolve(process.cwd(), 'app/api/inbox/send/route.ts');
    const content = fs.readFileSync(sendRouteFile, 'utf8');

    assert.ok(content.includes("export const dynamic = 'force-dynamic'"), 'Inbox send route must be dynamic');
    assert.ok(content.includes("sender_type: 'admin'"), 'Inbox send route inserts message as admin');
    assert.ok(content.includes("status: 'read'"), 'Inbox send route updates guest messages to read upon host reply');
  });

  // =========================================================================
  // 20. Facebook Login for Business Environment Variable Parsing & Aliases
  // =========================================================================
  test('Facebook Login for Business Configuration ID environment variables and aliases are parsed correctly in lib/env.ts', () => {
    const envFile = path.resolve(process.cwd(), 'lib/env.ts');
    const content = fs.readFileSync(envFile, 'utf8');

    assert.ok(
      content.includes('Facebook_login_Configuration_ID: z.string().optional()'),
      'Facebook_login_Configuration_ID defined in envSchema'
    );
    assert.ok(
      content.includes('FACEBOOK_LOGIN_CONFIGURATION_ID: z.string().optional()'),
      'FACEBOOK_LOGIN_CONFIGURATION_ID defined in envSchema'
    );
    assert.ok(
      content.includes('facebook_login_configuration_id: z.string().optional()'),
      'facebook_login_configuration_id defined in envSchema'
    );
    assert.ok(
      content.includes('FACEBOOK_CONFIG_ID: z.string().optional()'),
      'FACEBOOK_CONFIG_ID defined in envSchema'
    );
    assert.ok(
      content.includes('Facebook_login_Configuration_ID:'),
      'Exports Facebook_login_Configuration_ID in env'
    );

    // Verify alias resolution priority
    const testAliases = [
      'Facebook_login_Configuration_ID',
      'FACEBOOK_LOGIN_CONFIGURATION_ID',
      'facebook_login_configuration_id',
      'FACEBOOK_CONFIG_ID',
    ];
    for (const alias of testAliases) {
      assert.ok(content.includes(alias), `Env file must support alias: ${alias}`);
    }
  });

  // =========================================================================
  // 21. Facebook Login for Business OAuth URL Generation with config_id
  // =========================================================================
  test('Facebook Login for Business OAuth URL generation produces valid Meta dialog URL with config_id and route handles request', async () => {
    const appId = '987654321012345';
    const configId = '1122334455667788';
    const redirectUri = 'https://nothingness.asia/api/auth/facebook/callback';
    const state = 'secure_random_state_token_xyz';

    const url = generateFacebookOAuthUrl({
      appId,
      redirectUri,
      configId,
      state,
    });

    assert.ok(url.startsWith('https://www.facebook.com/v21.0/dialog/oauth'), 'URL must target Meta Graph v21.0 OAuth dialog');
    assert.ok(url.includes(`client_id=${appId}`), 'URL must include client_id');
    assert.ok(url.includes(`config_id=${configId}`), 'URL must include config_id for Facebook Login for Business');
    assert.ok(url.includes('response_type=code'), 'URL must request response_type=code');
    assert.ok(url.includes(`state=${state}`), 'URL must include state parameter for CSRF prevention');
    assert.ok(url.includes(encodeURIComponent(redirectUri)), 'URL must include URL-encoded redirect_uri');

    // Deep execution of app/api/auth/facebook/route.ts handler
    const origAppId = process.env.meta_App_ID;
    const origConfigId = process.env.Facebook_login_Configuration_ID;
    process.env.meta_App_ID = appId;
    process.env.Facebook_login_Configuration_ID = configId;

    try {
      // 1. Test JSON format request
      const jsonReq = new NextRequest('https://nothingness.asia/api/auth/facebook?format=json');
      const jsonRes = await handleFacebookAuthGet(jsonReq);
      assert.equal(jsonRes.status, 200, 'JSON format request must return 200 OK');
      const jsonData = await jsonRes.json();
      assert.equal(jsonData.appId, appId);
      assert.equal(jsonData.configId, configId);
      assert.ok(jsonData.url.includes(`config_id=${configId}`), 'JSON response includes valid OAuth URL');

      // 2. Test standard browser navigation redirect
      const browserReq = new NextRequest('https://nothingness.asia/api/auth/facebook');
      const browserRes = await handleFacebookAuthGet(browserReq);
      assert.ok(
        browserRes.status === 307 || browserRes.status === 308 || browserRes.status === 302,
        'Browser navigation must issue redirect'
      );
      const location = browserRes.headers.get('location');
      assert.ok(location?.includes('https://www.facebook.com/v21.0/dialog/oauth'));
      assert.ok(location?.includes(`config_id=${configId}`));

      // 3. Test missing configuration handling
      delete process.env.Facebook_login_Configuration_ID;
      delete process.env.FACEBOOK_LOGIN_CONFIGURATION_ID;
      delete process.env.facebook_login_configuration_id;
      delete process.env.FACEBOOK_CONFIG_ID;
      const missingReq = new NextRequest('https://nothingness.asia/api/auth/facebook?format=json');
      const missingRes = await handleFacebookAuthGet(missingReq);
      assert.equal(missingRes.status, 400, 'Must return 400 when Facebook_login_Configuration_ID is missing');
    } finally {
      if (origAppId) process.env.meta_App_ID = origAppId;
      if (origConfigId) process.env.Facebook_login_Configuration_ID = origConfigId;
    }
  });

  // =========================================================================
  // 22. Facebook Login for Business OAuth Callback Route Invariants
  // =========================================================================
  test('Facebook Login OAuth callback route handles errors, guards against failed exchange, and connects on valid code', async () => {
    // 1. Missing code parameter
    const noCodeReq = new NextRequest('https://nothingness.asia/api/auth/facebook/callback');
    const noCodeRes = await handleFacebookCallbackGet(noCodeReq);
    assert.ok(noCodeRes.status === 307 || noCodeRes.status === 308 || noCodeRes.status === 302);
    const noCodeLocation = noCodeRes.headers.get('location') || '';
    assert.ok(noCodeLocation.includes('error='), 'Missing code must redirect with error query parameter');

    // 2. User declined / OAuth error received from Meta dialog
    const errorReq = new NextRequest(
      'https://nothingness.asia/api/auth/facebook/callback?error=access_denied&error_reason=user_denied&error_description=The+user+denied+your+request'
    );
    const errorRes = await handleFacebookCallbackGet(errorReq);
    const errorLocation = errorRes.headers.get('location') || '';
    assert.ok(errorLocation.includes('error='), 'OAuth denial must redirect with error query parameter');

    // 3. Token exchange failure guard: if Meta token exchange fails, route MUST NOT falsely report connected
    const origFetch = globalThis.fetch;
    const origAppId = process.env.meta_App_ID;
    const origSecret = process.env.meta_App_secret;
    process.env.meta_App_ID = 'test_app_id_999';
    process.env.meta_App_secret = 'test_secret_999';

    globalThis.fetch = async (input: any, init?: any) => {
      const url = String(input);
      if (url.includes('graph.facebook.com/v21.0/oauth/access_token')) {
        return new Response(JSON.stringify({ error: { message: 'Invalid verification code format' } }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return origFetch(input, init);
    };

    try {
      // Non-mock real code that fails exchange
      const failedExchangeReq = new NextRequest(
        'https://nothingness.asia/api/auth/facebook/callback?code=unrecognized_meta_production_code_123'
      );
      const failedRes = await handleFacebookCallbackGet(failedExchangeReq);
      const failedLocation = failedRes.headers.get('location') || '';
      assert.ok(
        failedLocation.includes('error='),
        'Token exchange failure MUST redirect with error and never falsely succeed'
      );
      assert.ok(!failedLocation.includes('connected=facebook'), 'Must never report connected on failed token exchange');
    } finally {
      globalThis.fetch = origFetch;
      if (origAppId) process.env.meta_App_ID = origAppId;
      if (origSecret) process.env.meta_App_secret = origSecret;
    }

    // 4. Successful code exchange with mock code: updates session and redirects to connected=facebook
    const mockCodeReq = new NextRequest(
      'https://nothingness.asia/api/auth/facebook/callback?code=mock_oauth_authorization_code_abc'
    );
    const mockRes = await handleFacebookCallbackGet(mockCodeReq);
    const mockLocation = mockRes.headers.get('location') || '';
    assert.ok(
      mockLocation.includes('/admin/inbox?tab=settings&connected=facebook'),
      'Valid OAuth callback must redirect to inbox settings with connected=facebook'
    );
  });

  // =========================================================================
  // 23. Admin Facebook Status Endpoint Invariants
  // =========================================================================
  test('Admin Facebook Status endpoint enforces admin authorization, queries Meta Graph v21.0, and verifies configuration health', async () => {
    const origConfigId = process.env.Facebook_login_Configuration_ID;
    const origAppId = process.env.meta_App_ID;
    const origAppSecret = process.env.meta_App_secret;

    // 1. Missing Configuration ID
    delete process.env.Facebook_login_Configuration_ID;
    delete process.env.FACEBOOK_LOGIN_CONFIGURATION_ID;
    delete process.env.facebook_login_configuration_id;
    delete process.env.FACEBOOK_CONFIG_ID;
    delete process.env.NEXT_PUBLIC_FACEBOOK_LOGIN_CONFIGURATION_ID;
    delete process.env.NEXT_PUBLIC_FACEBOOK_CONFIG_ID;

    try {
      const resMissingConfig = await checkFacebookConnection();
      assert.equal(resMissingConfig.connected, false);
      assert.equal(resMissingConfig.configured, false);
      assert.ok(resMissingConfig.error?.includes('Facebook_login_Configuration_ID is not configured'));
      assert.ok(Array.isArray(resMissingConfig.products), 'Returns configured products array');
      assert.ok(resMissingConfig.products.some((p: string) => p.includes('WhatsApp Cloud API')));
      assert.ok(resMissingConfig.products.some((p: string) => p.includes('Conversions API')));

      // 2. Present config but missing appId
      process.env.Facebook_login_Configuration_ID = 'test_config_123';
      delete process.env.meta_App_ID;
      delete process.env.META_APP_ID;
      delete process.env.Instagram_app_ID;
      delete process.env.INSTAGRAM_APP_ID;
      const resMissingApp = await checkFacebookConnection();
      assert.equal(resMissingApp.connected, false);
      assert.ok(resMissingApp.error?.includes('meta_App_ID is not configured'));

      // 3. Present config and appId but missing appSecret
      process.env.meta_App_ID = 'test_app_456';
      delete process.env.meta_App_secret;
      delete process.env.META_APP_SECRET;
      delete process.env.Instagram_app_secret;
      delete process.env.INSTAGRAM_APP_SECRET;
      const resMissingSecret = await checkFacebookConnection();
      assert.equal(resMissingSecret.connected, false);
      assert.ok(resMissingSecret.error?.includes('meta_App_secret is missing'));

      // 4. Live Meta Graph API check with mocked 200 response
      process.env.meta_App_secret = 'test_secret_789';
      const origFetch = globalThis.fetch;
      globalThis.fetch = async (input: any) => {
        const url = String(input);
        if (url.includes('graph.facebook.com/v21.0/test_app_456')) {
          return new Response(JSON.stringify({ id: 'test_app_456', name: 'Nothingness Meta App' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (url.includes('graph.facebook.com/v21.0/test_config_123')) {
          return new Response(JSON.stringify({ id: 'test_config_123', name: 'Facebook Login for Business' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return origFetch(input);
      };

      try {
        const liveRes = await checkFacebookConnection();
        assert.equal(liveRes.connected, true, 'Should return connected: true on successful Meta Graph ping');
        assert.equal(liveRes.configured, true);
        assert.equal(liveRes.appId, 'test_app_456');
        assert.equal(liveRes.appName, 'Nothingness Meta App');
        assert.equal(liveRes.graphApiVersion, 'v21.0');
        assert.ok(typeof liveRes.latency === 'number');
      } finally {
        globalThis.fetch = origFetch;
      }
    } finally {
      if (origConfigId) process.env.Facebook_login_Configuration_ID = origConfigId;
      if (origAppId) process.env.meta_App_ID = origAppId;
      if (origAppSecret) process.env.meta_App_secret = origAppSecret;
    }
  });

  // =========================================================================
  // 24. FacebookSettingsCard & Admin Inbox Settings UI Invariants
  // =========================================================================
  test('FacebookSettingsCard masks IDs accurately and renders business products, connect button, and initialError', () => {
    // 1. Direct unit tests on maskFacebookId
    assert.equal(maskFacebookId(null), 'Not Configured');
    assert.equal(maskFacebookId(undefined), 'Not Configured');
    assert.equal(maskFacebookId(''), 'Not Configured');
    assert.equal(maskFacebookId('12345'), '12345', 'Short IDs (<=6 chars) remain unmasked');
    assert.equal(maskFacebookId('1122334455667788'), '1122••••7788', 'Long IDs mask inner characters');

    // 2. Component source code invariants
    const cardFile = path.resolve(process.cwd(), 'app/admin/inbox/FacebookSettingsCard.tsx');
    assert.ok(fs.existsSync(cardFile), 'FacebookSettingsCard.tsx must exist');

    const cardContent = fs.readFileSync(cardFile, 'utf8');
    assert.ok(cardContent.includes('maskId'), 'Masks sensitive Facebook_login_Configuration_ID');
    assert.ok(cardContent.includes('Facebook_login_Configuration_ID'), 'Displays Facebook_login_Configuration_ID label');
    assert.ok(cardContent.includes('WhatsApp Cloud API'), 'Lists WhatsApp Cloud API business product');
    assert.ok(cardContent.includes('Instagram Direct'), 'Lists Instagram Direct business product');
    assert.ok(cardContent.includes('Facebook Messenger'), 'Lists Facebook Messenger business product');
    assert.ok(cardContent.includes('Connect via Facebook Business Login'), 'Provides Connect via Facebook Business Login button');
    assert.ok(cardContent.includes('/api/auth/facebook'), 'Connect button targets /api/auth/facebook');
    assert.ok(cardContent.includes('/api/admin/facebook/status'), 'Ping button hits /api/admin/facebook/status');
    assert.ok(cardContent.includes('Test Connection / Ping'), 'Provides real-time ping button');
    assert.ok(cardContent.includes('initialError'), 'Supports initialError banner from OAuth failures');

    // 3. Verify app/admin/inbox/page.tsx renders FacebookSettingsCard with initialError
    const inboxPageFile = path.resolve(process.cwd(), 'app/admin/inbox/page.tsx');
    const inboxPageContent = fs.readFileSync(inboxPageFile, 'utf8');
    assert.ok(
      inboxPageContent.includes('import FacebookSettingsCard from "./FacebookSettingsCard"'),
      'Admin inbox page imports FacebookSettingsCard'
    );
    assert.ok(
      inboxPageContent.includes('<FacebookSettingsCard'),
      'Admin inbox page renders FacebookSettingsCard in Settings tab'
    );
    assert.ok(
      inboxPageContent.includes('facebookConfigId'),
      'Admin inbox page passes facebookConfigId prop'
    );
    assert.ok(
      inboxPageContent.includes('initialError={resolvedSearchParams?.error}'),
      'Admin inbox page passes initialError prop'
    );
  });
});
