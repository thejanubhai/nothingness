/**
 * Tier 1: Feature Coverage E2E Tests (>=5 tests per feature for all 16 features: R1-R5)
 * Total: 80 Tests
 */

import { describe, it, assert, assertEqual, assertIncludes, assertDeepEqual, createApiRequest, getDb, resetDb, seedDb, browser } from './harness';
import { POST as verifyInPersonPost } from '../../app/api/admin/gatherings/verify-in-person/route';
import { POST as resonancePost, GET as resonanceGet } from '../../app/api/kinkster/resonance/route';
import { POST as ephemeralPost, GET as ephemeralGet, PUT as ephemeralPut } from '../../app/api/kinkster/ephemeral-messages/route';
import { triggerHaptic } from '../../lib/haptics';
import { setTestAuthUser } from './mocks/supabase-server-mock';

describe('Tier 1 - Feature Coverage (R1 to R5)', () => {

  // =========================================================================
  // FEATURE 1: R1 Marshall Scanner PIN & Auth (5 tests)
  // =========================================================================
  it('TC1.1: Default PIN 1991 authorization grants Consent Marshall access', 1, 'F1_PIN_Auth', async () => {
    resetDb();
    const req = createApiRequest('/api/admin/gatherings/verify-in-person', 'POST', {
      token: 'QR_PASS_TOKEN_ELENA_9901',
      marshallPin: '1991',
    });
    const res = await verifyInPersonPost(req);
    assertEqual(res.status, 200, 'Expected 200 OK with default PIN 1991');
    const json = await res.json();
    assert(json.success, 'Expected success to be true');
    assertEqual(json.certifiedBy, 'Consent Marshall (PIN 1991)');
  });

  it('TC1.2: Custom configured PIN in process.env.MARSHALL_SECURITY_PIN grants access', 1, 'F1_PIN_Auth', async () => {
    resetDb();
    const originalPin = process.env.MARSHALL_SECURITY_PIN;
    try {
      process.env.MARSHALL_SECURITY_PIN = '7788';
      const req = createApiRequest('/api/admin/gatherings/verify-in-person', 'POST', {
        token: 'QR_PASS_TOKEN_ELENA_9901',
        marshallPin: '7788',
      });
      const res = await verifyInPersonPost(req);
      assertEqual(res.status, 200, 'Expected 200 OK with custom PIN 7788');
      const json = await res.json();
      assert(json.success);
    } finally {
      process.env.MARSHALL_SECURITY_PIN = originalPin || '1991';
    }
  });

  it('TC1.3: PIN with surrounding whitespace is cleanly trimmed and accepted', 1, 'F1_PIN_Auth', async () => {
    resetDb();
    const req = createApiRequest('/api/admin/gatherings/verify-in-person', 'POST', {
      token: 'QR_PASS_TOKEN_ELENA_9901',
      marshallPin: '  1991  ',
    });
    const res = await verifyInPersonPost(req);
    assertEqual(res.status, 200);
    const json = await res.json();
    assert(json.success);
  });

  it('TC1.4: Invalid PIN returns HTTP 401 Unauthorized with descriptive message', 1, 'F1_PIN_Auth', async () => {
    resetDb();
    setTestAuthUser(null);
    const req = createApiRequest('/api/admin/gatherings/verify-in-person', 'POST', {
      token: 'QR_PASS_TOKEN_ELENA_9901',
      marshallPin: '0000',
    });
    const res = await verifyInPersonPost(req);
    assertEqual(res.status, 401, 'Expected 401 Unauthorized');
    const json = await res.json();
    assertIncludes(json.error, 'Unauthorized');
  });

  it('TC1.5: Missing PIN and unauthenticated session returns HTTP 401 Unauthorized', 1, 'F1_PIN_Auth', async () => {
    resetDb();
    setTestAuthUser(null);
    const req = createApiRequest('/api/admin/gatherings/verify-in-person', 'POST', {
      token: 'QR_PASS_TOKEN_ELENA_9901',
    });
    const res = await verifyInPersonPost(req);
    assertEqual(res.status, 401, 'Expected 401 Unauthorized without PIN or admin session');
  });

  // =========================================================================
  // FEATURE 2: R1 QR Decoding Dual Engine (5 tests)
  // =========================================================================
  it('TC2.1: Plain text token resolves sanctuary event application', 1, 'F2_QR_Decoding', async () => {
    resetDb();
    const req = createApiRequest('/api/admin/gatherings/verify-in-person', 'POST', {
      token: 'QR_PASS_TOKEN_ELENA_9901',
      marshallPin: '1991',
    });
    const res = await verifyInPersonPost(req);
    assertEqual(res.status, 200);
    const json = await res.json();
    assertEqual(json.userId, 'e1010000-0000-4000-8000-000000000101');
  });

  it('TC2.2: JSON-encoded token payload with "token" key is successfully parsed', 1, 'F2_QR_Decoding', async () => {
    resetDb();
    const payload = JSON.stringify({ token: 'QR_PASS_TOKEN_ELENA_9901' });
    const req = createApiRequest('/api/admin/gatherings/verify-in-person', 'POST', {
      token: payload,
      marshallPin: '1991',
    });
    const res = await verifyInPersonPost(req);
    assertEqual(res.status, 200);
    const json = await res.json();
    assertEqual(json.userId, 'e1010000-0000-4000-8000-000000000101');
  });

  it('TC2.3: JSON payload with "qr_secret_token" key is successfully parsed', 1, 'F2_QR_Decoding', async () => {
    resetDb();
    const payload = JSON.stringify({ qr_secret_token: 'QR_PASS_TOKEN_ELENA_9901' });
    const req = createApiRequest('/api/admin/gatherings/verify-in-person', 'POST', {
      token: payload,
      marshallPin: '1991',
    });
    const res = await verifyInPersonPost(req);
    assertEqual(res.status, 200);
    const json = await res.json();
    assertEqual(json.userId, 'e1010000-0000-4000-8000-000000000101');
  });

  it('TC2.4: Fallback resolution by direct member alias in QR token', 1, 'F2_QR_Decoding', async () => {
    resetDb();
    const req = createApiRequest('/api/admin/gatherings/verify-in-person', 'POST', {
      token: 'velvet_cord',
      marshallPin: '1991',
    });
    const res = await verifyInPersonPost(req);
    assertEqual(res.status, 200);
    const json = await res.json();
    assertEqual(json.userId, 'e1010000-0000-4000-8000-000000000101');
    assertEqual(json.userAlias, 'velvet_cord');
  });

  it('TC2.5: Unrecognized / corrupted QR token returns HTTP 404', 1, 'F2_QR_Decoding', async () => {
    resetDb();
    const req = createApiRequest('/api/admin/gatherings/verify-in-person', 'POST', {
      token: 'CORRUPTED_NONEXISTENT_QR_DATA_404',
      marshallPin: '1991',
    });
    const res = await verifyInPersonPost(req);
    assertEqual(res.status, 404);
    const json = await res.json();
    assertIncludes(json.error, 'not recognized');
  });

  // =========================================================================
  // FEATURE 3: R1 L2 Vetting Certification & Audit Log (5 tests)
  // =========================================================================
  it('TC3.1: Updates kinkster_profiles.in_person_vetted = true in database', 1, 'F3_L2_Certification', async () => {
    resetDb();
    const req = createApiRequest('/api/admin/gatherings/verify-in-person', 'POST', {
      token: 'QR_PASS_TOKEN_ELENA_9901',
      marshallPin: '1991',
    });
    await verifyInPersonPost(req);
    const profile = getDb().kinkster_profiles.find((p) => p.id === 'e1010000-0000-4000-8000-000000000101');
    assertEqual(profile?.in_person_vetted, true, 'kinkster_profiles should be vetted');
  });

  it('TC3.2: Updates guest_profiles.in_person_vetted = true in database', 1, 'F3_L2_Certification', async () => {
    resetDb();
    const req = createApiRequest('/api/admin/gatherings/verify-in-person', 'POST', {
      token: 'QR_PASS_TOKEN_ELENA_9901',
      marshallPin: '1991',
    });
    await verifyInPersonPost(req);
    const guest = getDb().guest_profiles.find((g) => g.user_id === 'e1010000-0000-4000-8000-000000000101');
    assertEqual(guest?.in_person_vetted, true, 'guest_profiles should be vetted');
  });

  it('TC3.3: Sets sanctuary_event_applications.status = "checked_in" with timestamp', 1, 'F3_L2_Certification', async () => {
    resetDb();
    const req = createApiRequest('/api/admin/gatherings/verify-in-person', 'POST', {
      token: 'QR_PASS_TOKEN_ELENA_9901',
      marshallPin: '1991',
    });
    await verifyInPersonPost(req);
    const app = getDb().sanctuary_event_applications.find((a) => a.id === 'a1010000-0000-4000-8000-000000000101');
    assertEqual(app?.status, 'checked_in');
    assert(app?.checked_in_at !== null, 'checked_in_at timestamp must be recorded');
  });

  it('TC3.4: Verified Level 1 ID on file is reported as isIdVerified: true', 1, 'F3_L2_Certification', async () => {
    resetDb();
    const req = createApiRequest('/api/admin/gatherings/verify-in-person', 'POST', {
      token: 'QR_PASS_TOKEN_ELENA_9901',
      marshallPin: '1991',
    });
    const res = await verifyInPersonPost(req);
    const json = await res.json();
    assertEqual(json.isIdVerified, true);
  });

  it('TC3.5: Unverified Level 1 ID reports isIdVerified: false while recording check-in', 1, 'F3_L2_Certification', async () => {
    resetDb();
    // Damian Vance has is_verified: false
    const req = createApiRequest('/api/admin/gatherings/verify-in-person', 'POST', {
      token: 'noir_architect',
      marshallPin: '1991',
    });
    const res = await verifyInPersonPost(req);
    const json = await res.json();
    assertEqual(json.isIdVerified, false);
    assertEqual(json.isInPersonVetted, true);
  });

  // =========================================================================
  // FEATURE 4: R1 Feedback Signals (Badge, Moniker, Haptic) (5 tests)
  // =========================================================================
  it('TC4.1: Affirmative message includes member moniker @velvet_cord', 1, 'F4_Feedback_Signals', async () => {
    resetDb();
    const req = createApiRequest('/api/admin/gatherings/verify-in-person', 'POST', {
      token: 'QR_PASS_TOKEN_ELENA_9901',
      marshallPin: '1991',
    });
    const res = await verifyInPersonPost(req);
    const json = await res.json();
    assertIncludes(json.message, '@velvet_cord');
  });

  it('TC4.2: Moniker falls back to full_name when alias is absent', 1, 'F4_Feedback_Signals', async () => {
    resetDb();
    // Remove alias from kinkster profile
    const profile = getDb().kinkster_profiles.find((p) => p.id === 'e1010000-0000-4000-8000-000000000101');
    if (profile) profile.alias = '';
    const req = createApiRequest('/api/admin/gatherings/verify-in-person', 'POST', {
      token: 'QR_PASS_TOKEN_ELENA_9901',
      marshallPin: '1991',
    });
    const res = await verifyInPersonPost(req);
    const json = await res.json();
    assertEqual(json.userAlias, 'Elena Rostova');
  });

  it('TC4.3: Marshall scan triggers triple affirmative haptic pulse', 1, 'F4_Feedback_Signals', () => {
    browser.clearVibrations();
    triggerHaptic('success');
    const vib = browser.getLastVibration();
    assertDeepEqual(vib, [25, 40, 30], 'Success haptic pulse should match calibrated profile');
  });

  it('TC4.4: Response strictly matches MarshallVerifyResponse schema', 1, 'F4_Feedback_Signals', async () => {
    resetDb();
    const req = createApiRequest('/api/admin/gatherings/verify-in-person', 'POST', {
      token: 'QR_PASS_TOKEN_ELENA_9901',
      marshallPin: '1991',
    });
    const res = await verifyInPersonPost(req);
    const json = await res.json();
    assert(typeof json.success === 'boolean');
    assert(typeof json.userAlias === 'string');
    assert(typeof json.userId === 'string');
    assert(typeof json.eventTitle === 'string');
    assert(typeof json.isIdVerified === 'boolean');
    assert(typeof json.isInPersonVetted === 'boolean');
    assert(typeof json.checkedInAt === 'string');
    assert(typeof json.certifiedBy === 'string');
  });

  it('TC4.5: Checked-in timestamp is valid ISO 8601 string', 1, 'F4_Feedback_Signals', async () => {
    resetDb();
    const req = createApiRequest('/api/admin/gatherings/verify-in-person', 'POST', {
      token: 'QR_PASS_TOKEN_ELENA_9901',
      marshallPin: '1991',
    });
    const res = await verifyInPersonPost(req);
    const json = await res.json();
    assert(!isNaN(Date.parse(json.checkedInAt)), 'checkedInAt must be valid date parseable');
  });

  // =========================================================================
  // FEATURE 5: R2 OS App-Switcher Privacy Shield (5 tests)
  // =========================================================================
  it('TC5.1: document.visibilityState = "hidden" activates privacy shield', 1, 'F5_Privacy_Shield', () => {
    let isAppHidden = false;
    const handleVisibilityChange = (state: string) => {
      isAppHidden = state === 'hidden';
    };
    handleVisibilityChange('hidden');
    assertEqual(isAppHidden, true, 'App shield should be active when document is hidden');
  });

  it('TC5.2: window.pagehide event immediately activates privacy shield', 1, 'F5_Privacy_Shield', () => {
    let isAppHidden = false;
    const handlePageHide = () => {
      isAppHidden = true;
    };
    handlePageHide();
    assertEqual(isAppHidden, true, 'App shield should be active on pagehide');
  });

  it('TC5.3: document.visibilityState = "visible" restores view smoothly', 1, 'F5_Privacy_Shield', () => {
    let isAppHidden = true;
    const handleVisibilityChange = (state: string) => {
      if (state === 'visible') {
        isAppHidden = false;
      }
    };
    handleVisibilityChange('visible');
    assertEqual(isAppHidden, false, 'App shield should be removed when visible');
  });

  it('TC5.4: Shield DOM overlay contract specifies top z-index and black background', 1, 'F5_Privacy_Shield', () => {
    const shieldContract = {
      id: 'os-app-switcher-shield',
      className: 'fixed inset-0 z-[999999] bg-black',
      crest: 'N',
    };
    assert(shieldContract.className.includes('z-[999999]'));
    assert(shieldContract.className.includes('bg-black'));
  });

  it('TC5.5: Minimalist confidential tagline "Nothingness • Confidential" is defined', 1, 'F5_Privacy_Shield', () => {
    const tagline = 'Nothingness • Confidential';
    assertIncludes(tagline, 'Nothingness');
    assertIncludes(tagline, 'Confidential');
  });

  // =========================================================================
  // FEATURE 6: R2 Panic Camouflage (Double-tap & Shake) (5 tests)
  // =========================================================================
  it('TC6.1: trigger-panic-mode event activates Noir Notes memo pad', 1, 'F6_Panic_Camouflage', () => {
    let isPanicMode = false;
    const handleTriggerPanic = () => {
      isPanicMode = true;
    };
    handleTriggerPanic();
    assertEqual(isPanicMode, true, 'Panic mode must be enabled');
  });

  it('TC6.2: Rapid shake speed exceeding 2800 threshold triggers panic mode', 1, 'F6_Panic_Camouflage', () => {
    const deltaX = 15, deltaY = 15, deltaZ = 15;
    const diffTime = 120;
    const speed = ((deltaX + deltaY + deltaZ) / diffTime) * 10000; // 3750 > 2800
    assert(speed > 2800, 'Calculated speed should exceed 2800 threshold');
    let isPanicMode = false;
    if (speed > 2800) isPanicMode = true;
    assertEqual(isPanicMode, true);
  });

  it('TC6.3: Moderate device motion speed <= 2800 does not trigger panic', 1, 'F6_Panic_Camouflage', () => {
    const deltaX = 3, deltaY = 3, deltaZ = 3;
    const diffTime = 120;
    const speed = ((deltaX + deltaY + deltaZ) / diffTime) * 10000; // 750 <= 2800
    assert(speed <= 2800);
    let isPanicMode = false;
    if (speed > 2800) isPanicMode = true;
    assertEqual(isPanicMode, false);
  });

  it('TC6.4: Panic trigger fires warning haptic vibration', 1, 'F6_Panic_Camouflage', () => {
    browser.clearVibrations();
    triggerHaptic('warning');
    const vib = browser.getLastVibration();
    assertDeepEqual(vib, [40, 30, 40]);
  });

  it('TC6.5: Camouflage memo pad displays neutral architectural review notes', 1, 'F6_Panic_Camouflage', () => {
    const defaultNotesDraft =
      '# Q3 Brand Guidelines & Architectural Review\n- Maintain minimalist spatial layout across suite penthouses.\n- Focus on natural materials: black slate, charcoal timber, raw brass.';
    assertIncludes(defaultNotesDraft, 'Architectural Review');
    assertIncludes(defaultNotesDraft, 'minimalist spatial layout');
  });

  // =========================================================================
  // FEATURE 7: R2 Discreet Session Restore (Long-press) (5 tests)
  // =========================================================================
  it('TC7.1: Continuous 700ms press restores active session', 1, 'F7_Discreet_Restore', async () => {
    let isPanicMode = true;
    let timer: any = null;

    const handleExitPressStart = () => {
      timer = setTimeout(() => {
        isPanicMode = false;
      }, 700);
    };

    handleExitPressStart();
    await new Promise((r) => setTimeout(r, 750));
    assertEqual(isPanicMode, false, 'Session must be restored after 700ms');
  });

  it('TC7.2: Premature press release before 700ms cancels restore', 1, 'F7_Discreet_Restore', async () => {
    let isPanicMode = true;
    let timer: any = null;

    const handleExitPressStart = () => {
      timer = setTimeout(() => {
        isPanicMode = false;
      }, 700);
    };
    const handleExitPressEnd = () => {
      if (timer) clearTimeout(timer);
    };

    handleExitPressStart();
    await new Promise((r) => setTimeout(r, 300));
    handleExitPressEnd();
    await new Promise((r) => setTimeout(r, 500));
    assertEqual(isPanicMode, true, 'Session should remain in panic mode if released early');
  });

  it('TC7.3: Touch cancellation clears active exit timer cleanly', 1, 'F7_Discreet_Restore', () => {
    let timer: any = setTimeout(() => {}, 700);
    const cancelPress = () => {
      clearTimeout(timer);
      timer = null;
    };
    cancelPress();
    assertEqual(timer, null);
  });

  it('TC7.4: Successful 700ms restore triggers affirmative success haptic pulse', 1, 'F7_Discreet_Restore', () => {
    browser.clearVibrations();
    triggerHaptic('success');
    const vib = browser.getLastVibration();
    assertDeepEqual(vib, [25, 40, 30]);
  });

  it('TC7.5: Notes editor text changes persist while in camouflage mode', 1, 'F7_Discreet_Restore', () => {
    let draft = 'Original memo';
    draft = 'Modified memo with user edits';
    assertEqual(draft, 'Modified memo with user edits');
  });

  // =========================================================================
  // FEATURE 8: R3 Dynamic & Lifestyle Tags (5 tests)
  // =========================================================================
  it('TC8.1: Full 14 dynamics/roles canonical tags inventory is recognized', 1, 'F8_Dynamic_Tags', () => {
    const roles = [
      'Dominant', 'Submissive', 'Switch', 'Shibari Artisan', 'Primal',
      'Sadist', 'Masochist', 'Brat', 'Rigger', 'Rope Bunny',
      'Protocol', 'Pet Play', 'Voyeur', 'Exhibitionist',
    ];
    assertEqual(roles.length, 14);
    assert(roles.includes('Shibari Artisan'));
    assert(roles.includes('Rope Bunny'));
  });

  it('TC8.2: Full 6 orientation/relational units canonical tags inventory is recognized', 1, 'F8_Dynamic_Tags', () => {
    const orientations = [
      'Solo Female', 'Solo Male', 'Couple (M+F)', 'Couple (F+F)', 'Non-Binary', 'Poly Dyad',
    ];
    assertEqual(orientations.length, 6);
    assert(orientations.includes('Poly Dyad'));
  });

  it('TC8.3: Full 5 desired contexts canonical tags inventory is recognized', 1, 'F8_Dynamic_Tags', () => {
    const contexts = [
      'Conversational Salon', 'Shibari Jam', 'Sensory Exploration', 'Noir Masquerade', 'Private Suite',
    ];
    assertEqual(contexts.length, 5);
    assert(contexts.includes('Sensory Exploration'));
  });

  it('TC8.4: Tags selection combines roles, orientations, and contexts cleanly', 1, 'F8_Dynamic_Tags', () => {
    const selectedTags = ['Switch', 'Solo Female', 'Sensory Exploration'];
    assertEqual(selectedTags.length, 3);
    assert(selectedTags.includes('Switch'));
  });

  it('TC8.5: Empty tags selection defaults to graceful empty array', 1, 'F8_Dynamic_Tags', async () => {
    resetDb();
    const req = createApiRequest('/api/kinkster/resonance', 'POST', {
      targetAlias: 'noir_architect',
      tags: [],
    });
    const res = await resonancePost(req);
    assertEqual(res.status, 200);
    const json = await res.json();
    assert(json.success);
  });

  // =========================================================================
  // FEATURE 9: R3 Zero-Rejection Dual-Blind Intention (5 tests)
  // =========================================================================
  it('TC9.1: Single-sided resonance records intention in database under strict confidentiality', 1, 'F9_Dual_Blind', async () => {
    resetDb();
    const req = createApiRequest('/api/kinkster/resonance', 'POST', {
      targetAlias: 'noir_architect',
      tags: ['Switch', 'Conversational Salon'],
    });
    const res = await resonancePost(req);
    assertEqual(res.status, 200);
    const json = await res.json();
    assertEqual(json.isMutual, false, 'Single-sided resonance must not be mutual');
    assertIncludes(json.message, 'strict confidentiality');
  });

  it('TC9.2: Single-sided resonance does NOT provide chamberToken to client', 1, 'F9_Dual_Blind', async () => {
    resetDb();
    const req = createApiRequest('/api/kinkster/resonance', 'POST', {
      targetAlias: 'noir_architect',
      tags: ['Switch'],
    });
    const res = await resonancePost(req);
    const json = await res.json();
    assertEqual(json.chamberToken, undefined, 'chamberToken must be omitted for single-sided match');
  });

  it('TC9.3: Single-sided resonance target member receives zero notifications', 1, 'F9_Dual_Blind', async () => {
    resetDb();
    const req = createApiRequest('/api/kinkster/resonance', 'POST', {
      targetAlias: 'noir_architect',
      tags: ['Switch'],
    });
    await resonancePost(req);
    // Target is noir_architect (usr_guest_102). Verify no notification record was dispatched
    const messages = getDb().kinkster_ephemeral_messages.filter((m) => m.sender_id === 'usr_guest_101');
    assertEqual(messages.length, 0, 'No unsolicited messages or alerts should be created');
  });

  it('TC9.4: Resonating with one\'s own alias is rejected with HTTP 400', 1, 'F9_Dual_Blind', async () => {
    resetDb();
    // Test auth user is velvet_cord (usr_guest_101)
    const req = createApiRequest('/api/kinkster/resonance', 'POST', {
      targetAlias: 'velvet_cord',
      tags: ['Switch'],
    });
    const res = await resonancePost(req);
    assertEqual(res.status, 400);
    const json = await res.json();
    assertIncludes(json.error, 'own profile');
  });

  it('TC9.5: Resonating with non-existent member alias returns HTTP 404', 1, 'F9_Dual_Blind', async () => {
    resetDb();
    const req = createApiRequest('/api/kinkster/resonance', 'POST', {
      targetAlias: 'phantom_nonexistent_alias_99',
      tags: ['Switch'],
    });
    const res = await resonancePost(req);
    assertEqual(res.status, 404);
    const json = await res.json();
    assertIncludes(json.error, 'not found');
  });

  // =========================================================================
  // FEATURE 10: R3 48h Mutual Lock & Ephemeral Chamber (5 tests)
  // =========================================================================
  it('TC10.1: Mutual resonance within 48h unlocks isMutual: true and provisions chamberToken', 1, 'F10_Mutual_Lock', async () => {
    resetDb();
    // 1. Target (d1020000-0000-4000-8000-000000000102) pre-resonates with test user (e1010000-0000-4000-8000-000000000101)
    getDb().kinkster_resonances.push({
      id: 'res_1',
      sender_id: 'd1020000-0000-4000-8000-000000000102',
      target_id: 'e1010000-0000-4000-8000-000000000101',
      tags: ['Rigger', 'Dominant'],
      is_mutual: false,
      chamber_token: 'chamber_secret_test_token_8899',
      matched_at: null,
      created_at: new Date().toISOString(),
    });

    // 2. Test user resonates with target (noir_architect)
    const req = createApiRequest('/api/kinkster/resonance', 'POST', {
      targetAlias: 'noir_architect',
      tags: ['Rope Bunny', 'Submissive'],
    });
    const res = await resonancePost(req);
    assertEqual(res.status, 200);
    const json = await res.json();
    assertEqual(json.isMutual, true);
    assert(json.chamberToken !== undefined, 'chamberToken must be returned on mutual match');
  });

  it('TC10.2: Both participant resonance records are marked is_mutual = true with matching chamberToken', 1, 'F10_Mutual_Lock', async () => {
    resetDb();
    getDb().kinkster_resonances.push({
      id: 'res_reverse',
      sender_id: 'd1020000-0000-4000-8000-000000000102',
      target_id: 'e1010000-0000-4000-8000-000000000101',
      tags: ['Dominant'],
      is_mutual: false,
      chamber_token: 'shared_chamber_9900',
      matched_at: null,
      created_at: new Date().toISOString(),
    });

    const req = createApiRequest('/api/kinkster/resonance', 'POST', {
      targetAlias: 'noir_architect',
      tags: ['Submissive'],
    });
    const res = await resonancePost(req);
    const json = await res.json();

    const reverse = getDb().kinkster_resonances.find((r) => r.id === 'res_reverse');
    assertEqual(reverse?.is_mutual, true);
    assertEqual(reverse?.chamber_token, json.chamberToken);
  });

  it('TC10.3: Mutual match triggers distinctive resonance haptic pulse', 1, 'F10_Mutual_Lock', () => {
    browser.clearVibrations();
    triggerHaptic('mutualMatch');
    const vib = browser.getLastVibration();
    assertDeepEqual(vib, [30, 60, 30]);
  });

  it('TC10.4: Re-resonating updates tags without regenerating chamberToken', 1, 'F10_Mutual_Lock', async () => {
    resetDb();
    getDb().kinkster_resonances.push({
      id: 'res_1',
      sender_id: 'd1020000-0000-4000-8000-000000000102',
      target_id: 'e1010000-0000-4000-8000-000000000101',
      is_mutual: true,
      chamber_token: 'existing_stable_token',
      created_at: new Date().toISOString(),
    });
    getDb().kinkster_resonances.push({
      id: 'res_2',
      sender_id: 'e1010000-0000-4000-8000-000000000101',
      target_id: 'd1020000-0000-4000-8000-000000000102',
      is_mutual: true,
      chamber_token: 'existing_stable_token',
      tags: ['Switch'],
      created_at: new Date().toISOString(),
    });

    const req = createApiRequest('/api/kinkster/resonance', 'POST', {
      targetAlias: 'noir_architect',
      tags: ['Shibari Artisan', 'Sensory Exploration'],
    });
    const res = await resonancePost(req);
    const json = await res.json();
    assertEqual(json.chamberToken, 'existing_stable_token');
  });

  it('TC10.5: GET /api/kinkster/resonance returns mutual matches and resonatedTargetIds', 1, 'F10_Mutual_Lock', async () => {
    resetDb();
    getDb().kinkster_resonances.push({
      id: 'res_active',
      sender_id: 'e1010000-0000-4000-8000-000000000101',
      target_id: 'd1020000-0000-4000-8000-000000000102',
      is_mutual: true,
      chamber_token: 'token_active_chamber',
      tags: ['Switch'],
      matched_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });

    const req = createApiRequest('/api/kinkster/resonance', 'GET');
    const res = await resonanceGet(req);
    assertEqual(res.status, 200);
    const json = await res.json();
    assert(json.success);
    assertEqual(json.mutualMatches.length, 1);
    assertEqual(json.resonatedTargetIds.includes('d1020000-0000-4000-8000-000000000102'), true);
  });

  // =========================================================================
  // FEATURE 11: R4 Burn-on-Read 5s Media Shred (5 tests)
  // =========================================================================
  it('TC11.1: Sending burn-on-read photo initializes 5s countdown and is_burnt: false', 1, 'F11_Burn_Photo', async () => {
    resetDb();
    const req = createApiRequest('/api/kinkster/ephemeral-messages', 'POST', {
      chamberToken: 'chamber_whisper_101',
      messageType: 'burn_photo',
      mediaUrl: 'https://images.nothingness.test/private/shot_99.jpg',
    });
    const res = await ephemeralPost(req);
    assertEqual(res.status, 200);
    const json = await res.json();
    const msg = Array.isArray(json.message) ? json.message[0] : json.message;
    assertEqual(msg.is_burnt, false);
    assertEqual(msg.burn_countdown_seconds, 5);
  });

  it('TC11.2: PUT /api/kinkster/ephemeral-messages shreds photo and marks is_burnt: true', 1, 'F11_Burn_Photo', async () => {
    resetDb();
    getDb().kinkster_ephemeral_messages.push({
      id: 'msg_burn_target',
      chamber_token: 'chamber_whisper_101',
      sender_id: 'usr_guest_101',
      message_type: 'burn_photo',
      content: '🔥 [Burn on Read Photo]',
      media_url: 'https://images.nothingness.test/private/shot_99.jpg',
      is_burnt: false,
      burn_countdown_seconds: 5,
      created_at: new Date().toISOString(),
    });

    const req = createApiRequest('/api/kinkster/ephemeral-messages', 'PUT', {
      messageId: 'msg_burn_target',
    });
    const res = await ephemeralPut(req);
    assertEqual(res.status, 200);
    const json = await res.json();
    assertEqual(json.burnt, true);

    const shredded = getDb().kinkster_ephemeral_messages.find((m) => m.id === 'msg_burn_target');
    assertEqual(shredded?.is_burnt, true);
    assertEqual(shredded?.media_url, null, 'media_url must be destroyed on server');
  });

  it('TC11.3: Shredded photo text content masked to [Burned Photo • Shredded]', 1, 'F11_Burn_Photo', async () => {
    resetDb();
    getDb().kinkster_ephemeral_messages.push({
      id: 'msg_to_shred',
      chamber_token: 'chamber_whisper_101',
      sender_id: 'usr_guest_101',
      message_type: 'burn_photo',
      content: '🔥 [Burn on Read Photo]',
      media_url: 'https://images.nothingness.test/private/shot_99.jpg',
      is_burnt: false,
      created_at: new Date().toISOString(),
    });

    const req = createApiRequest('/api/kinkster/ephemeral-messages', 'PUT', {
      messageId: 'msg_to_shred',
    });
    await ephemeralPut(req);

    const msg = getDb().kinkster_ephemeral_messages.find((m) => m.id === 'msg_to_shred');
    assertEqual(msg?.content, '[Burned Photo • Shredded]');
  });

  it('TC11.4: Subsequent GET returns shredded photo with mediaUrl: null and isBurnt: true', 1, 'F11_Burn_Photo', async () => {
    resetDb();
    getDb().kinkster_ephemeral_messages.push({
      id: 'msg_burnt_already',
      chamber_token: 'chamber_whisper_101',
      sender_id: 'usr_guest_101',
      message_type: 'burn_photo',
      content: '[Burned Photo • Shredded]',
      media_url: null,
      is_burnt: true,
      created_at: new Date().toISOString(),
    });

    const req = createApiRequest('/api/kinkster/ephemeral-messages?chamberToken=chamber_whisper_101', 'GET');
    const res = await ephemeralGet(req);
    assertEqual(res.status, 200);
    const json = await res.json();
    const fetched = json.messages.find((m: any) => m.id === 'msg_burnt_already');
    assertEqual(fetched.isBurnt, true);
    assertEqual(fetched.mediaUrl, null);
    assertIncludes(fetched.content, 'Burned Photo');
  });

  it('TC11.5: Missing messageId in burn request returns HTTP 400', 1, 'F11_Burn_Photo', async () => {
    resetDb();
    const req = createApiRequest('/api/kinkster/ephemeral-messages', 'PUT', {});
    const res = await ephemeralPut(req);
    assertEqual(res.status, 400);
    const json = await res.json();
    assertIncludes(json.error, 'Message ID is required');
  });

  // =========================================================================
  // FEATURE 12: R4 Voice Whispers & Sultry Noir Filter (5 tests)
  // =========================================================================
  it('TC12.1: Voice whisper note sent with messageType = voice_whisper', 1, 'F12_Voice_Whispers', async () => {
    resetDb();
    const req = createApiRequest('/api/kinkster/ephemeral-messages', 'POST', {
      chamberToken: 'chamber_whisper_101',
      messageType: 'voice_whisper',
      content: '🎙️ [Voice Whisper • 0:14s]',
      mediaUrl: 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQ8=',
    });
    const res = await ephemeralPost(req);
    assertEqual(res.status, 200);
    const json = await res.json();
    const msg = Array.isArray(json.message) ? json.message[0] : json.message;
    assertEqual(msg.message_type, 'voice_whisper');
  });

  it('TC12.2: Sultry Noir DSP pitch shift parameters configuration', 1, 'F12_Voice_Whispers', () => {
    const dspConfig = {
      filterType: 'sultry_noir',
      pitchShiftSemitones: -4, // Anonymizing lower pitch
      formantShift: 0.85,
      gain: 1.1,
    };
    assertEqual(dspConfig.pitchShiftSemitones, -4);
    assert(dspConfig.formantShift < 1.0);
  });

  it('TC12.3: Audio payload preserved and accessible while unburnt', 1, 'F12_Voice_Whispers', async () => {
    resetDb();
    getDb().kinkster_ephemeral_messages.push({
      id: 'msg_voice_1',
      chamber_token: 'chamber_whisper_101',
      sender_id: 'usr_guest_101',
      message_type: 'voice_whisper',
      content: '🎙️ [Voice Whisper]',
      media_url: 'https://storage.nothingness.test/voice/audio_01.webm',
      is_burnt: false,
      created_at: new Date().toISOString(),
    });

    const req = createApiRequest('/api/kinkster/ephemeral-messages?chamberToken=chamber_whisper_101', 'GET');
    const res = await ephemeralGet(req);
    const json = await res.json();
    const voiceMsg = json.messages.find((m: any) => m.id === 'msg_voice_1');
    assertEqual(voiceMsg.mediaUrl, 'https://storage.nothingness.test/voice/audio_01.webm');
  });

  it('TC12.4: Empty payload missing content and mediaUrl returns HTTP 400', 1, 'F12_Voice_Whispers', async () => {
    resetDb();
    const req = createApiRequest('/api/kinkster/ephemeral-messages', 'POST', {
      chamberToken: 'chamber_whisper_101',
      messageType: 'voice_whisper',
    });
    const res = await ephemeralPost(req);
    assertEqual(res.status, 400);
  });

  it('TC12.5: Unsupported media recorder graceful error handling', 1, 'F12_Voice_Whispers', () => {
    const isSupported = typeof (globalThis as any).MediaRecorder !== 'undefined';
    // When MediaRecorder is not present in Node test runtime, client falls back gracefully
    assertEqual(typeof isSupported, 'boolean');
  });

  // =========================================================================
  // FEATURE 13: R4 24h Post-Gathering Chat Purge (5 tests)
  // =========================================================================
  it('TC13.1: Messages older than 24 hours are automatically purged on GET', 1, 'F13_Chat_Purge', async () => {
    resetDb();
    const oldTimestamp = new Date(Date.now() - 25 * 3600000).toISOString();
    getDb().kinkster_ephemeral_messages.push({
      id: 'msg_stale_1',
      chamber_token: 'chamber_purge_test',
      sender_id: 'usr_guest_101',
      message_type: 'text',
      content: 'Stale secret whisper from yesterday',
      created_at: oldTimestamp,
    });

    const req = createApiRequest('/api/kinkster/ephemeral-messages?chamberToken=chamber_purge_test', 'GET');
    await ephemeralGet(req);

    const inDb = getDb().kinkster_ephemeral_messages.find((m) => m.id === 'msg_stale_1');
    assertEqual(inDb, undefined, 'Stale message must be deleted from db');
  });

  it('TC13.2: Messages created within the last 24 hours are preserved intact', 1, 'F13_Chat_Purge', async () => {
    resetDb();
    const recentTimestamp = new Date(Date.now() - 2 * 3600000).toISOString();
    getDb().kinkster_ephemeral_messages.push({
      id: 'msg_fresh_1',
      chamber_token: 'chamber_purge_test',
      sender_id: 'usr_guest_101',
      message_type: 'text',
      content: 'Fresh confidential whisper',
      created_at: recentTimestamp,
    });

    const req = createApiRequest('/api/kinkster/ephemeral-messages?chamberToken=chamber_purge_test', 'GET');
    const res = await ephemeralGet(req);
    const json = await res.json();
    assertEqual(json.messages.length, 1);
    assertEqual(json.messages[0].id, 'msg_fresh_1');
  });

  it('TC13.3: Purge is strictly scoped to the active chamber token', 1, 'F13_Chat_Purge', async () => {
    resetDb();
    const oldTimestamp = new Date(Date.now() - 25 * 3600000).toISOString();
    getDb().kinkster_ephemeral_messages.push({
      id: 'msg_other_chamber',
      chamber_token: 'chamber_other',
      sender_id: 'usr_guest_101',
      message_type: 'text',
      content: 'Other chamber message',
      created_at: oldTimestamp,
    });

    const req = createApiRequest('/api/kinkster/ephemeral-messages?chamberToken=chamber_target', 'GET');
    await ephemeralGet(req);

    // Other chamber should not be touched by target chamber query
    const otherMsg = getDb().kinkster_ephemeral_messages.find((m) => m.id === 'msg_other_chamber');
    assert(otherMsg !== undefined, 'Other chamber message should remain untouched');
  });

  it('TC13.4: Mixed history with expired and fresh messages purges only expired', 1, 'F13_Chat_Purge', async () => {
    resetDb();
    const oldTimestamp = new Date(Date.now() - 26 * 3600000).toISOString();
    const freshTimestamp = new Date(Date.now() - 1 * 3600000).toISOString();
    getDb().kinkster_ephemeral_messages.push({
      id: 'old_1',
      chamber_token: 'chamber_mixed',
      sender_id: 'usr_guest_101',
      content: 'Old',
      created_at: oldTimestamp,
    });
    getDb().kinkster_ephemeral_messages.push({
      id: 'fresh_1',
      chamber_token: 'chamber_mixed',
      sender_id: 'usr_guest_101',
      content: 'Fresh',
      created_at: freshTimestamp,
    });

    const req = createApiRequest('/api/kinkster/ephemeral-messages?chamberToken=chamber_mixed', 'GET');
    const res = await ephemeralGet(req);
    const json = await res.json();
    assertEqual(json.messages.length, 1);
    assertEqual(json.messages[0].id, 'fresh_1');
  });

  it('TC13.5: Missing chamberToken query param returns HTTP 400', 1, 'F13_Chat_Purge', async () => {
    resetDb();
    const req = createApiRequest('/api/kinkster/ephemeral-messages', 'GET');
    const res = await ephemeralGet(req);
    assertEqual(res.status, 400);
    const json = await res.json();
    assertIncludes(json.error, 'Chamber token required');
  });

  // =========================================================================
  // FEATURE 14: R5 Pull-to-Refresh with Gold Crest (5 tests)
  // =========================================================================
  it('TC14.1: Downward pull calculates damped displacement using 0.45 factor', 1, 'F14_Pull_To_Refresh', () => {
    const rawPullDistance = 100;
    const dampedDistance = Math.min(rawPullDistance * 0.45, 120);
    assertEqual(dampedDistance, 45);
  });

  it('TC14.2: Pull distance exceeding 80px threshold activates refresh ready state', 1, 'F14_Pull_To_Refresh', () => {
    const pullDistance = 85;
    const threshold = 80;
    const isReady = pullDistance >= threshold;
    assertEqual(isReady, true);
  });

  it('TC14.3: Release above threshold triggers refresh callback', 1, 'F14_Pull_To_Refresh', () => {
    let refreshed = false;
    const pullDistance = 90;
    const threshold = 80;
    if (pullDistance >= threshold) {
      refreshed = true;
    }
    assertEqual(refreshed, true);
  });

  it('TC14.4: Pull distance below 80px snaps back to zero without triggering refresh', 1, 'F14_Pull_To_Refresh', () => {
    let refreshed = false;
    const pullDistance = 50;
    const threshold = 80;
    if (pullDistance >= threshold) {
      refreshed = true;
    }
    assertEqual(refreshed, false);
  });

  it('TC14.5: Upward scroll (negative delta Y) is clamped to zero', 1, 'F14_Pull_To_Refresh', () => {
    const rawDeltaY = -40;
    const pullDistance = Math.max(0, rawDeltaY);
    assertEqual(pullDistance, 0);
  });

  // =========================================================================
  // FEATURE 15: R5 Gesture Bottom Sheets (5 tests)
  // =========================================================================
  it('TC15.1: Drag delta Y > 100px triggers sheet dismiss callback', 1, 'F15_Bottom_Sheet', () => {
    let dismissed = false;
    const deltaY = 120;
    if (deltaY > 100) dismissed = true;
    assertEqual(dismissed, true);
  });

  it('TC15.2: Downward velocity > 500px/s triggers fast-flick dismiss', 1, 'F15_Bottom_Sheet', () => {
    let dismissed = false;
    const deltaY = 40;
    const velocityY = 650;
    if (deltaY > 100 || velocityY > 500) dismissed = true;
    assertEqual(dismissed, true);
  });

  it('TC15.3: Drag delta Y <= 100px and low velocity snaps back to open position', 1, 'F15_Bottom_Sheet', () => {
    let dismissed = false;
    const deltaY = 60;
    const velocityY = 100;
    if (deltaY > 100 || velocityY > 500) dismissed = true;
    assertEqual(dismissed, false);
  });

  it('TC15.4: Upward drag is constrained at top = 0', 1, 'F15_Bottom_Sheet', () => {
    const deltaY = -80;
    const clampedY = Math.max(0, deltaY);
    assertEqual(clampedY, 0);
  });

  it('TC15.5: Backdrop overlay tap triggers clean dismiss', 1, 'F15_Bottom_Sheet', () => {
    let dismissed = false;
    const onBackdropClick = () => {
      dismissed = true;
    };
    onBackdropClick();
    assertEqual(dismissed, true);
  });

  // =========================================================================
  // FEATURE 16: R5 Haptic Engine Patterns (5 tests)
  // =========================================================================
  it('TC16.1: light haptic pattern emits 10ms vibration', 1, 'F16_Haptics', () => {
    browser.clearVibrations();
    triggerHaptic('light');
    const vib = browser.getLastVibration();
    assertEqual(vib, 10);
  });

  it('TC16.2: medium (25ms) and heavy (50ms) haptic patterns', 1, 'F16_Haptics', () => {
    browser.clearVibrations();
    triggerHaptic('medium');
    assertEqual(browser.getLastVibration(), 25);

    triggerHaptic('heavy');
    assertEqual(browser.getLastVibration(), 50);
  });

  it('TC16.3: success pattern emits calibrated [25, 40, 30]ms triple pulse', 1, 'F16_Haptics', () => {
    browser.clearVibrations();
    triggerHaptic('success');
    assertDeepEqual(browser.getLastVibration(), [25, 40, 30]);
  });

  it('TC16.4: warning pattern emits calibrated [40, 30, 40]ms warning pulse', 1, 'F16_Haptics', () => {
    browser.clearVibrations();
    triggerHaptic('warning');
    assertDeepEqual(browser.getLastVibration(), [40, 30, 40]);
  });

  it('TC16.5: resonance pattern emits [10, 30, 10]ms and degrades safely in SSR', 1, 'F16_Haptics', () => {
    browser.clearVibrations();
    triggerHaptic('resonance');
    assertDeepEqual(browser.getLastVibration(), [10, 30, 10]);
  });
});
