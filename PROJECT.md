# Project: Nothingness Kinkster Mode Native-App Experience

## Architecture
- **Framework**: Next.js 14 (App Router) with React, TypeScript, Tailwind CSS, Framer Motion, Lucide icons.
- **Backend / Database**: Supabase (PostgreSQL) with Row Level Security (RLS) policies, Realtime, and Next.js Route Handlers.
- **Mobile PWA Layer**:
  - Browser lifecycle hooks (`visibilitychange`, `pagehide`, `blur`) for OS app-switcher shielding.
  - Device sensors (`devicemotion` for shake gesture, touch events for gestures and long-press).
  - Web Audio API (synthesizer chimes, microphone recording via `MediaRecorder`, DSP pitch/timbre shifting).
  - Camera Video Stream with dual QR decoding (Native `BarcodeDetector` + software `jsqr` fallback).
  - Native Vibration API (`navigator.vibrate`) with calibrated haptic profiles.
- **Explicit Exclusions**:
  - NO "Tap-to-Reveal Ambient Blur" (media displays cleanly without blur gate).
  - NO "In-Sanctuary Radar / Floor Presence" (no bluetooth or geofenced attendee floor radar).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Permissions-Policy Config | Configure `camera=(self), microphone=(self)` in `next.config.js` | M1 | Survey |
| 2 | Database Schema & Migrations | Create `gathering_vettings`, `kinkster_resonances`, `kinkster_ephemeral_messages`, `is_in_person_vetted` | M1 | Survey |
| 3 | Marshall Scanner Interface | Mobile-first scanner at `/admin/marshall-scanner` with 4-digit PIN lock | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Dual-Engine QR Scanner | Camera live stream with native `BarcodeDetector` and canvas `jsqr` fallback | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Verify-in-Person API | Verify L1 ID, update `is_in_person_vetted = true`, and log audit in `gathering_vettings` | M1 | ORIGINAL_REQUEST §R1 |
| 6 | Marshall Feedback Signals | Affirmative green badge, guest moniker display, and triple haptic pulse `vibrate([40, 60, 40])` | M1 | ORIGINAL_REQUEST §R1 |
| 7 | Gathering Dossier Marshall Link | Embed direct Marshall Scanner launcher inside `EventDossierModal` and `AdminEventsHub` | M1 | ORIGINAL_REQUEST §R1 |
| 8 | Multi-Tasking Privacy Shield | Immediate DOM viewport blanking with geometric crest on `visibilitychange`, `pagehide`, `blur` | M2 | ORIGINAL_REQUEST §R2 |
| 9 | Crest Double-Tap Panic Trigger | Double-tapping Nothingness crest logo in `Header.tsx` triggers instant camouflage | M2 | ORIGINAL_REQUEST §R2 |
| 10 | Rapid Shake Panic Camouflage | Accelerometer shake detection instantly transitions to neutral "Noir Notes" memo pad | M2 | ORIGINAL_REQUEST §R2 |
| 11 | Discreet Camouflage Restore | 700ms discreet long-press on notes footer restores active session | M2 | ORIGINAL_REQUEST §R2 |
| 12 | Dynamic & Lifestyle Tags | Comprehensive tags: 14 Roles/Dynamics, 6 Orientation/Units, 5 Desired Contexts | M3 | ORIGINAL_REQUEST §R3 |
| 13 | Dual-Blind Resonance Engine | Zero-rejection intention pairing via `kinkster_resonances`, zero alerts to single-sided targets | M3 | ORIGINAL_REQUEST §R3 |
| 14 | 48-Hour Mutual Lock & Banner | Mutual match within 48 hours displays gold resonance banner and provisions ephemeral chamber | M3 | ORIGINAL_REQUEST §R3 |
| 15 | Discovery & Profile Resonate UI | Replace legacy "Spice Up" with "Resonate" button opening `DesireResonanceModal` on member profiles | M3 | ORIGINAL_REQUEST §R3 |
| 16 | Burn-on-Read Photos | 5-second countdown timer on photos followed by client shred and server deletion | M4 | ORIGINAL_REQUEST §R4 |
| 17 | Voice Whisper Notes | In-browser microphone audio recording using `MediaRecorder` | M4 | ORIGINAL_REQUEST §R4 |
| 18 | Sultry Noir Voice Filter | Web Audio API pitch/formant shifting node to anonymize vocal timbre | M4 | ORIGINAL_REQUEST §R4 |
| 19 | 24-Hour Post-Gathering Purge | Ephemeral chat messages and media purge automatically 24 hours post-creation | M4 | ORIGINAL_REQUEST §R4 |
| 20 | Pull-to-Refresh with Gold Crest | Elastic damping pull physics with animated spinning gold crest indicator on feeds | M5 | ORIGINAL_REQUEST §R5 |
| 21 | Gesture Bottom Sheets | Framer Motion swipe-down-to-dismiss behavior on profile sheets, reflections, and QR passes | M5 | ORIGINAL_REQUEST §R5 |
| 22 | Dynamic Haptic Engine | Calibrated haptic patterns (`vibrate(10)`, `vibrate([30, 60, 30])`, `vibrate([40, 60, 40])`) in `lib/haptics.ts` | M5 | ORIGINAL_REQUEST §R5 |
| 23 | E2E Test Suite (Tiers 1-4) | Opaque-box automated test suite for all features across Tiers 1-4 | E2E | ORIGINAL_REQUEST Acceptance Criteria |
| 24 | Adversarial Hardening (Tier 5) | White-box stress testing, gap analysis, and adversarial verification | M6 | Project Pattern |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Test harness, runner, and Tiers 1-4 opaque-box test suites | none | IN_PROGRESS (e2e_test_writer_1) |
| M1 | Level 2 In-Person Vetting QR Scanner | Features 1-7 (Scanner, PIN, dual QR engine, API, database audit log, haptics) | none | IN_REMEDIATION (m1_worker_2) |
| M2 | Stealth Mode & Panic Camouflage | Features 8-11 (App-switcher shield, blur/visibility hooks, double-tap logo, shake, Noir Notes) | none | IN_REVIEW (m2_reviewer_1, m2_challenger_1, m2_auditor_1) |
| M3 | Dual-Blind Desire Resonance & Tags | Features 12-15 (14 roles, 6 units, 5 contexts, zero-rejection RLS, 48h mutual lock, UI) | M1 | IN_PROGRESS (m3_worker_1) |
| M4 | Ephemeral Whispers & Noir Voice Notes | Features 16-19 (5s burn-on-read, MediaRecorder voice whisper, Sultry Noir DSP, 24h purge) | M3 | PLANNED |
| M5 | Touch Ergonomics & Haptic Engine | Features 20-22 (Pull-to-refresh gold crest, Framer Motion bottom sheets, haptic engine) | none | PLANNED |
| M6 | Final Milestone & Adversarial Hardening | Phase 1: 100% E2E test pass (Tiers 1-4). Phase 2: Tier 5 adversarial coverage hardening | M1, M2, M3, M4, M5, E2E | PLANNED |

## Interface Contracts

### Marshall Verification Contract
```typescript
// POST /api/admin/gatherings/verify-in-person
// Request Payload:
export interface MarshallVerifyRequest {
  token: string; // Scanned QR token or JSON
  marshallPin?: string; // 4-digit PIN (default 1991)
  eventId?: string; // Target gathering ID
}

// Response Payload:
export interface MarshallVerifyResponse {
  success: boolean;
  userAlias: string;
  userId: string;
  eventTitle: string;
  isIdVerified: boolean;
  isInPersonVetted: boolean;
  checkedInAt: string;
  certifiedBy: string;
  message: string;
}
```

### Desire Resonance Contract
```typescript
// POST /api/kinkster/resonance
// Request Payload:
export interface DesireResonanceRequest {
  targetAlias: string;
  tags: string[]; // Dynamic roles, orientation, and context tags
}

// Response Payload:
export interface DesireResonanceResponse {
  success: boolean;
  isMutual: boolean;
  chamberToken?: string; // Only present if mutual within 48h
  matchedAt?: string;
  message: string;
}
```

### Ephemeral Message & Burn Contract
```typescript
// POST /api/kinkster/ephemeral-messages
// Request Payload:
export interface SendEphemeralMessageRequest {
  chamberToken: string;
  messageType: 'text' | 'burn_photo' | 'voice_whisper';
  content: string; // Text or anonymized voice notes
  mediaUrl?: string; // Photo data URL or storage URL
  burnCountdownSeconds?: number; // Default 5
}

// PUT /api/kinkster/ephemeral-messages (Burn shred trigger)
// Request Payload:
export interface BurnEphemeralMessageRequest {
  messageId: string;
  chamberToken: string;
}
```

### Haptic Engine Contract
```typescript
// lib/haptics.ts
export type HapticPattern = 
  | 'light'           // vibrate(10)
  | 'medium'          // vibrate(25)
  | 'heavy'           // vibrate(50)
  | 'resonance'       // vibrate([10, 30, 10])
  | 'mutualMatch'     // vibrate([30, 60, 30])
  | 'marshallSuccess' // vibrate([40, 60, 40])
  | 'panicTrigger'    // vibrate([80, 50, 80])
  | 'burnWarning'     // vibrate([50, 50, 50, 50])
```

## Code Layout
- `app/admin/marshall-scanner/page.tsx` — Level 2 In-Person Vetting QR Scanner interface
- `app/api/admin/gatherings/verify-in-person/route.ts` — L2 Certification and `gathering_vettings` audit handler
- `app/api/kinkster/resonance/route.ts` — Dual-Blind Desire Resonance mutual pairing handler
- `app/api/kinkster/ephemeral-messages/route.ts` — Ephemeral chat, burn-on-read shred, and 24h purge handler
- `components/StealthPrivacyShield.tsx` — OS App-Switcher multi-tasking privacy shield & Noir Notes memo pad
- `components/Header.tsx` — App header with double-tap logo panic trigger
- `components/kinkster/DesireResonanceModal.tsx` — Comprehensive dynamic & lifestyle tags selector and resonance trigger
- `components/kinkster/EphemeralChatModal.tsx` — Ephemeral chat with 5s burn-on-read photo display and voice whisper recording
- `components/PullToRefresh.tsx` — Touch pull-to-refresh with rotating gold crest indicator
- `components/ui/GestureBottomSheet.tsx` — Reusable Framer Motion swipe-to-dismiss bottom sheet wrapper
- `lib/haptics.ts` — Unified mobile haptic feedback engine
- `lib/audio/pitchShift.ts` — Web Audio API Sultry Noir voice filter graph
- `lib/scanner/qrFallback.ts` — Canvas-based `jsqr` fallback decoder
- `supabase/migrations/20260905000001_gathering_vettings_and_l2_certification.sql` — Database migration
