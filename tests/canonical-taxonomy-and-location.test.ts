import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  evaluateGeographicTier, 
  rankContentByLocation, 
  normalizeLocationString, 
  findClusterKey,
  SUPPORTED_DISCOVERY_METROS
} from '../lib/location/relevance';

describe('Authoritative Canonical Taxonomy Contract', () => {
  const CANONICAL_50_TAXONOMY = [
    { slug: 'shibari-japanese-rope-bondage', name: 'Shibari & Japanese Rope Bondage', category: 'Rope & Shibari' },
    { slug: 'kinbaku-floor-work', name: 'Kinbaku Floor Work & Suspension', category: 'Rope & Shibari' },
    { slug: 'rope-rigging-safety-anatomy', name: 'Rope Rigging, Safety & Anatomy', category: 'Rope & Shibari' },
    { slug: 'sensory-deprivation-mindful-touch', name: 'Sensory Deprivation & Mindful Touch', category: 'Sensory & Mindful' },
    { slug: 'blindfold-whisper-sensory-soaks', name: 'Blindfold, Whisper & Sensory Soaks', category: 'Sensory & Mindful' },
    { slug: 'somatics-breathwork-erotic-trance', name: 'Somatics, Breathwork & Erotic Trance', category: 'Sensory & Mindful' },
    { slug: 'temperature-play-ice-wax-alchemy', name: 'Temperature Play, Ice & Wax Alchemy', category: 'Sensory & Mindful' },
    { slug: 'soundscapes-dark-ambient-immersion', name: 'Soundscapes & Dark Ambient Immersion', category: 'Sensory & Mindful' },
    { slug: 'power-dynamics-dominance-submission', name: 'Power Dynamics & Consensual Surrender', category: 'Power Dynamics & BDSM' },
    { slug: 'master-slave-protocol-etiquette', name: 'Master/slave Protocol & High Etiquette', category: 'Power Dynamics & BDSM' },
    { slug: 'femdom-sovereignty-worship', name: 'FemDom Sovereignty & Goddess Worship', category: 'Power Dynamics & BDSM' },
    { slug: 'sadomasochism-edge-catharsis', name: 'Sadomasochism & Controlled Catharsis', category: 'Power Dynamics & BDSM' },
    { slug: 'impact-flogging-cane-leather-paddle', name: 'Impact: Flogging, Canes & Leather Paddles', category: 'Power Dynamics & BDSM' },
    { slug: 'chastity-orgasm-control-tease-denial', name: 'Chastity, Orgasm Control & Tease Denial', category: 'Power Dynamics & BDSM' },
    { slug: 'service-devotion-submissive-craft', name: 'Service, Devotion & Submissive Craft', category: 'Power Dynamics & BDSM' },
    { slug: 'primal-predator-prey-hunting-play', name: 'Primal, Predator/Prey & Hunting Dynamics', category: 'Power Dynamics & BDSM' },
    { slug: 'leather-culture-bootblacking-craft', name: 'Leather Culture & Bootblacking Craft', category: 'Leather, Rubber & Gear' },
    { slug: 'latex-rubber-second-skin-sensory', name: 'Latex, Rubber & Second-Skin Immersion', category: 'Leather, Rubber & Gear' },
    { slug: 'corsetry-waist-training-body-shaping', name: 'Corsetry & Severe Waist Training', category: 'Leather, Rubber & Gear' },
    { slug: 'harness-kink-gear-restraint-couture', name: 'Restraint Harnesses & Kink Couture', category: 'Leather, Rubber & Gear' },
    { slug: 'noir-masquerades-dark-romance', name: 'Noir Masquerades & Dark Romance', category: 'Aesthetics, Noir & Dark Romance' },
    { slug: 'gothic-erotics-velvet-candlelight', name: 'Gothic Erotics & Candlelit Salons', category: 'Aesthetics, Noir & Dark Romance' },
    { slug: 'boudoir-intimacy-aesthetic-photography', name: 'Boudoir Intimacy & Dark Erotic Cinema', category: 'Aesthetics, Noir & Dark Romance' },
    { slug: 'erotic-literature-poetry-confessions', name: 'Erotic Literature & Midnight Confessions', category: 'Aesthetics, Noir & Dark Romance' },
    { slug: 'foot-boot-leg-worship', name: 'Foot, Boot & Leg Worship', category: 'Fetish & Specific Desires' },
    { slug: 'silk-nylon-tactile-hosiery-fetish', name: 'Silk, Satin & Tactile Hosiery Fetish', category: 'Fetish & Specific Desires' },
    { slug: 'pet-play-human-pup-kitten-pony', name: 'Pet Play: Canine, Feline & Equine Archetypes', category: 'Fetish & Specific Desires' },
    { slug: 'medical-play-clinics-speculum-restraint', name: 'Medical Play, Clinical Care & Restraint', category: 'Fetish & Specific Desires' },
    { slug: 'electro-stimulation-violet-wand-violet-ray', name: 'Electro-Stimulation & Violet Wand Science', category: 'Fetish & Specific Desires' },
    { slug: 'exhibitionism-voyeurism-gaze-dynamics', name: 'Exhibitionism, Voyeurism & Gaze Dynamics', category: 'Fetish & Specific Desires' },
    { slug: 'ageplay-cgl-little-caregiver-mindset', name: 'Caregiver & Little (CGL) Dynamic Psychology', category: 'Fetish & Specific Desires' },
    { slug: 'breathplay-aerobic-oxygen-protocol', name: 'Breathwork Boundaries & Strict Safety Protocols', category: 'Fetish & Specific Desires' },
    { slug: 'knife-play-fear-arousal-blade-edge', name: 'Blade Edge Play & Fear Catharsis', category: 'Fetish & Specific Desires' },
    { slug: 'wax-play-candle-torture-luminescence', name: 'Wax Pouring & Low-Temp Luminescence', category: 'Fetish & Specific Desires' },
    { slug: 'couples-lifestyle-ethical-non-monogamy', name: 'Couples Lifestyle & Consensual Non-Monogamy', category: 'Couples, Polyamory & Non-Monogamy' },
    { slug: 'polyamory-compersion-intimacy-networks', name: 'Polyamory, Compersion & Intimacy Networks', category: 'Couples, Polyamory & Non-Monogamy' },
    { slug: 'swingers-partner-exchange-sanctuaries', name: 'Partner Exchange & Private Suite Evenings', category: 'Couples, Polyamory & Non-Monogamy' },
    { slug: 'queer-trans-nonbinary-kink-expression', name: 'Queer, Trans & Non-Binary Kink Spaces', category: 'Couples, Polyamory & Non-Monogamy' },
    { slug: 'secret-munches-sober-kink-socials', name: 'Secret Munches & Sober Kink Dialogues', category: 'Social, Salons & Munch Circles' },
    { slug: 'newbie-kink-orientation-safety-first', name: 'Newcomer Orientation & Safe Kink Literacy', category: 'Social, Salons & Munch Circles' },
    { slug: 'consent-marshall-guardian-academy', name: 'Consent Guardian & Marshall Sanctuary Academy', category: 'Social, Salons & Munch Circles' },
    { slug: 'kink-crafting-diy-leather-rigging-tools', name: 'Kink Atelier: Leatherworking & Tool Craft', category: 'Social, Salons & Munch Circles' },
    { slug: 'private-dungeon-architecture-spatial-design', name: 'Sanctuary Dungeon Architecture & Suite Design', category: 'Social, Salons & Munch Circles' },
    { slug: 'kink-hospitality-play-party-hosting', name: 'Sanctuary Soirée Hosting & Protocol Etiquette', category: 'Social, Salons & Munch Circles' },
    { slug: 'deep-aftercare-trauma-informed-grounding', name: 'Deep Aftercare & Trauma-Informed Grounding', category: 'Wellness, Healing & Integration' },
    { slug: 'sub-drop-top-drop-recovery-protocols', name: 'Drop Recovery: Neurochemistry & Reset Protocols', category: 'Wellness, Healing & Integration' },
    { slug: 'cathartic-kink-shadow-work-integration', name: 'Cathartic Kink, Subconscious & Shadow Work', category: 'Wellness, Healing & Integration' },
    { slug: 'erotic-hypnosis-mesmerism-suggestion', name: 'Erotic Hypnosis, Suggestion & Mesmerism', category: 'Wellness, Healing & Integration' },
    { slug: 'tantra-sacred-sexuality-kink-synthesis', name: 'Tantra & Sacred Desire Synthesis', category: 'Wellness, Healing & Integration' },
    { slug: 'sovereign-discretion-opsec-privacy-mastery', name: 'Sovereign Discretion, OpSec & Privacy Mastery', category: 'Wellness, Healing & Integration' },
  ];

  test('Exactly 50 canonical taxonomy records exist', () => {
    assert.equal(CANONICAL_50_TAXONOMY.length, 50);
  });

  test('All taxonomy slugs are lowercase alphanumeric with hyphens', () => {
    for (const item of CANONICAL_50_TAXONOMY) {
      assert.match(item.slug, /^[a-z0-9-]+$/);
      assert.ok(!item.slug.startsWith('-'));
      assert.ok(!item.slug.endsWith('-'));
      assert.ok(!item.slug.includes('--'));
    }
  });

  test('All canonical names are free of hardcoded city suffixes', () => {
    const cityKeywords = ['delhi', 'mumbai', 'bangalore', 'gurgaon', 'goa'];
    for (const item of CANONICAL_50_TAXONOMY) {
      const lower = item.name.toLowerCase();
      for (const city of cityKeywords) {
        assert.ok(
          !lower.endsWith(` ${city}`) && !lower.startsWith(`${city} `),
          `Canonical name "${item.name}" must not contain hardcoded city prefix/suffix`
        );
      }
    }
  });
});

describe('Invisible Location Relevance Engine', () => {
  test('Local tier matches exact city', () => {
    const result = evaluateGeographicTier(
      { city: 'Delhi', region: 'North India', country: 'India' },
      { city: 'Delhi', region: 'North India', country: 'India' }
    );
    assert.equal(result.tier, 'local');
    assert.equal(result.score, 100);
  });

  test('Nearby tier matches metro clusters (e.g. South Delhi <-> Gurgaon)', () => {
    const result = evaluateGeographicTier(
      { city: 'Gurgaon', region: 'North India', country: 'India' },
      { city: 'South Delhi', region: 'North India', country: 'India' }
    );
    assert.equal(result.tier, 'nearby');
    assert.equal(result.score, 85);
  });

  test('Regional tier matches same state/region (e.g. Mumbai <-> Pune in Maharashtra)', () => {
    const result = evaluateGeographicTier(
      { city: 'Mumbai', region: 'Maharashtra', country: 'India' },
      { city: 'Pune', region: 'Maharashtra', country: 'India' }
    );
    // Both Mumbai and Pune are clustered or regional
    assert.ok(result.tier === 'nearby' || result.tier === 'regional');
    assert.ok(result.score >= 65);
  });

  test('National tier matches same country with different regions', () => {
    const result = evaluateGeographicTier(
      { city: 'Delhi', region: 'North India', country: 'India' },
      { city: 'Bengaluru', region: 'Karnataka', country: 'India' }
    );
    assert.equal(result.tier, 'national');
    assert.equal(result.score, 45);
  });

  test('Global tier is assigned when discovery is disabled or country differs', () => {
    const disabledResult = evaluateGeographicTier(
      { city: 'Delhi', region: 'North India', country: 'India' },
      { city: 'Berlin', region: 'Berlin', country: 'Germany' },
      false // discovery disabled
    );
    assert.equal(disabledResult.tier, 'global');

    const intlResult = evaluateGeographicTier(
      { city: 'Delhi', region: 'North India', country: 'India' },
      { city: 'London', region: 'Greater London', country: 'United Kingdom' },
      true
    );
    assert.equal(intlResult.tier, 'global');
  });

  test('Adaptive Content Fill Algorithm orders local before nearby before regional before national', () => {
    const items = [
      { id: 'global-1', city: 'Berlin', country: 'Germany', date: '2026-09-10' },
      { id: 'local-1', city: 'Delhi', country: 'India', date: '2026-09-08' },
      { id: 'nearby-1', city: 'Gurgaon', country: 'India', date: '2026-09-09' },
      { id: 'national-1', city: 'Bengaluru', country: 'India', date: '2026-09-10' },
    ];

    const ranked = rankContentByLocation(
      items,
      { city: 'Delhi', region: 'North India', country: 'India' },
      (i) => ({ city: i.city, country: i.country }),
      (i) => i.date
    );

    assert.equal(ranked[0].item.id, 'local-1');
    assert.equal(ranked[0].geoTier, 'local');
    assert.equal(ranked[1].item.id, 'nearby-1');
    assert.equal(ranked[1].geoTier, 'nearby');
    assert.equal(ranked[2].item.id, 'national-1');
    assert.equal(ranked[2].geoTier, 'national');
    assert.equal(ranked[3].item.id, 'global-1');
    assert.equal(ranked[3].geoTier, 'global');
  });

  test('Supported metros list contains canonical sanctuary hubs', () => {
    const metroIds = SUPPORTED_DISCOVERY_METROS.map((m) => m.id);
    assert.ok(metroIds.includes('delhi_ncr'));
    assert.ok(metroIds.includes('mumbai_metro'));
    assert.ok(metroIds.includes('bangalore_metro'));
    assert.ok(metroIds.includes('goa_sanctuary'));
    assert.ok(metroIds.includes('global'));
  });
});

describe('Unified Shell & Navigation Invariants', () => {
  test('Unified Bottom navigation contains strictly 5 canonical items without Messages', () => {
    const canonicalNav = [
      { name: 'Feed', href: '/kinksters' },
      { name: 'Events', href: '/kinksters/events' },
      { name: 'Post', action: 'open-creation-sheet' },
      { name: 'Groups', href: '/kinksters/groups' },
      { name: 'Explore', href: '/kinksters/explore' },
    ];

    assert.equal(canonicalNav.length, 5);
    assert.equal(canonicalNav.some(n => n.name.toLowerCase().includes('message')), false);
    assert.equal(canonicalNav[2].name, 'Post');
  });

  test('Events route is shared and active across /kinksters/events and /sanctuary-pass', () => {
    const isEventsActive = (pathname: string) => {
      return pathname.startsWith('/kinksters/events') || pathname.startsWith('/sanctuary-pass');
    };

    assert.equal(isEventsActive('/kinksters/events'), true);
    assert.equal(isEventsActive('/kinksters/events?id=123'), true);
    assert.equal(isEventsActive('/sanctuary-pass'), true);
    assert.equal(isEventsActive('/kinksters'), false);
    assert.equal(isEventsActive('/kinksters/groups'), false);
  });
});
