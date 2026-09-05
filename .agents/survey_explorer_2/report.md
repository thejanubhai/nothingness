# Comprehensive Survey Report: UI Components, Kinkster Mode, Mobile Touch/APIs & Test Harnesses

**Author**: survey_explorer_2 (Explorer Subagent)  
**Date**: 2026-09-04T19:15:00Z  
**Target Project**: Nothingness (`c:\Users\hudav\Documents\GitHub\nothingness`)  
**Scope**: Requirements R1 through R5 from `ORIGINAL_REQUEST.md`  

---

## Executive Summary

The Nothingness repository possesses a modern Next.js 16 (App Router) + React 19 + Tailwind v4 + Framer Motion foundation with substantial pre-existing UI modules for Kinkster Mode, Admin Portals, Gathering Dossiers, and PWA ergonomics. However, several critical architectural seams and missing bridges exist between the UI components, browser hardware APIs, and the backend routes. 

All explicit user exclusions (NO "Tap-to-Reveal Ambient Blur", NO "In-Sanctuary Radar / Floor Presence") are currently respected in the UI designs. The project currently runs `pnpm test` via `tsc --noEmit` and passes with **0 TypeScript errors**.

---

## 1. Inventory of Kinkster Mode, Gathering Dossier, Admin Routes & User Profiles

### Component & Page Inventory Table

| File Path | Type | Current Purpose | Gaps & Action Items for R1-R5 |
| :--- | :--- | :--- | :--- |
| `app/(user)/kinksters/page.tsx` | Page | Main Kinkster portal. Renders `KinksterLandingPage` for unactivated guests; renders private feed with categories (`all`, `dynamics`, `stories`, `gatherings`), likes, saves, comments for activated members. | Imports `PullToRefresh`, `DesireResonanceModal`, `EphemeralChatModal` at top, but **does not render them in JSX**. Feed lacks pull-to-refresh wrapper and direct resonance trigger. |
| `app/(user)/kinksters/discover/page.tsx` | Page | Member discovery circle. Has tabs for "Chemistry Matches" and "Spice Requests". | Still uses legacy "Spice Up" mechanism with incoming request inbox, which violates R3's zero-notification dual-blind confidentiality. Needs transition to Dual-Blind Resonance cards. |
| `app/(user)/kinksters/[alias]/page.tsx` | Page | Public profile view for `@alias` showing avatar, discretion rating, follower count, health badges, audio vibe player, and 3-column media grid. | Displays media cleanly (no ambient blur, adhering to exclusion). However, action button is "Spice Up 🔥" instead of "Resonate". Does not launch `DesireResonanceModal`. |
| `components/kinkster/DesireResonanceModal.tsx` | Component | Dual-Blind Desire Resonance modal with tags and submission to `/api/kinkster/resonance`. Shows mutual match vs confidential lock state. | Missing Orientation/Unit tags (Solo Female, Solo Male, Couple M+F, Couple F+F, Non-Binary, Poly Dyad). Static modal without mobile swipe-to-dismiss gesture. |
| `components/kinkster/EphemeralChatModal.tsx` | Component | Confidential ephemeral chat with burn-on-read photo (5s countdown timer) and voice whispers via `MediaRecorder`. | Sultry Noir pitch-shift toggle only prefixes a text label; **no Web Audio API pitch shifting DSP is applied**. Static modal without mobile swipe-to-dismiss gesture. |
| `components/kinkster/AudioVibePlayer.tsx` | Component | Audio player with animated soundwave visualizer bars for sensory bio audio clips. | Fully functional for audio playback. |
| `components/events/EventDossierModal.tsx` | Component | Event Gathering Dossier with 4 tabs: Overview (secret coordinates, ratio balance, soundscape preview), Dress Lookbook, Safety & Marshalls, Vetted Guest Roster. | Missing embedded quick-action or floating trigger for authorized Consent Marshalls to launch `/admin/marshall-scanner`. Static modal without swipe-to-dismiss gesture. |
| `components/events/LiveTicketQRModal.tsx` | Component | Dynamic attendee QR ticket with 1-tap consent pact, real-time UTC clock, and JSON payload `{ appId, token, alias, type }`. | Cleanly generates QR payload compatible with marshall scanner. Lacks mobile swipe-down-to-dismiss bottom sheet physics. |
| `app/admin/marshall-scanner/page.tsx` | Page | Dedicated mobile-first scanner for Consent Marshalls. Protected by 4-digit PIN ('1991') or admin session. Live viewfinder, reticle, audio chime, manual fallback. | Uses native `BarcodeDetector` only. **Lacks `jsqr` fallback** when `BarcodeDetector` is missing on iOS Safari. Haptic trigger needs tuning to R1's triple pulse `[40, 60, 40]`. |
| `components/admin/AdminEventsHub.tsx` | Component | Full admin events hub with overview, event editor, curation desk (biometric 3D face matching & AI trust scoring), and gatekeeper scanner tab. | Scanner tab currently only provides a manual text paste area; should link directly or embed `/admin/marshall-scanner`. |
| `app/admin/guests/[id]/page.tsx` & `AdminGuestProfileClient.tsx` | Admin Page | Comprehensive guest profile view with booking history, ID verification, and host toggle for `in_person_vetted`. | Fully functional for manual toggles by admin. |
| `app/(user)/sanctuary-pass/page.tsx` | Page | Sanctuary Pass portal. Displays "✓ Level 2 In-Person Certified" badge immediately when `isInPersonVetted` is true. | Already responsive to `isInPersonVetted` state from `/api/sanctuary-pass/portal-data`. |

---

## 2. Camera & QR Scanner Architecture (BarcodeDetector vs jsqr Fallback)

### Direct Observation of Existing Setup
In `app/admin/marshall-scanner/page.tsx` (lines 85-160):
- Video capture: Uses `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } })`.
- Frame decoding:
  ```typescript
  if ('BarcodeDetector' in window) {
    // @ts-ignore
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
    const codes = await detector.detect(videoRef.current);
    if (codes && codes.length > 0) { ... }
  }
  ```
- Backend certification endpoint: `POST /api/admin/gatherings/verify-in-person`.
  - Accepts `{ token, marshallPin: '1991' }`.
  - Unpacks JSON token generated by `LiveTicketQRModal.tsx` (`appId`, `qr_secret_token`, `userId`).
  - Sets `guest_profiles.in_person_vetted = true`, `kinkster_profiles.in_person_vetted = true`, and marks `sanctuary_event_applications.status = 'checked_in'`.
- Audio chime: Web Audio API oscillator ramped from C5 (523.25 Hz) to C6 (1046.5 Hz) over 350ms.

### Critical Gaps for R1
1. **Missing `jsqr` Fallback**: Native `window.BarcodeDetector` is only natively supported in Chromium-based mobile browsers (Chrome on Android) and macOS/iOS Safari only under experimental flags or newer WebKit builds. On standard iOS Safari PWA installations, `BarcodeDetector` is undefined. The scanner fails silently, forcing marshalls to use manual backup input.
2. **Missing Package**: Neither `jsqr` nor `@zxing/library` is currently installed in `package.json`. A canvas frame grab (`canvas.getContext('2d').drawImage(video, 0, 0, w, h)`) coupled with `jsqr(imageData.data, w, h)` is required as the seamless fallback.
3. **Database Audit Table**: Requirement R1 requires logging into a `gathering_vettings` table with `marshall_id`, `event_id`, and `verified_at`. Currently, the API updates `in_person_vetted` on profiles and sets `checked_in_by` on `sanctuary_event_applications`, but the dedicated `gathering_vettings` audit table is not yet migrated in Supabase.

---

## 3. Stealth Mode, OS App-Switcher Privacy Shield & Panic Camouflage

### Direct Observation of Existing Setup
In `components/StealthPrivacyShield.tsx` (lines 17-94):
- Lifecycle listeners:
  ```typescript
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', handlePageHide);
  ```
- App-switcher screen:
  ```tsx
  <div id="os-app-switcher-shield" className="fixed inset-0 z-[999999] bg-black flex flex-col items-center justify-center pointer-events-none select-none">
    <div className="w-16 h-16 rounded-3xl bg-zinc-950 border border-amber-500/30 flex items-center justify-center shadow-2xl mb-4">
      <span className="font-serif text-2xl font-bold text-amber-400">N</span>
    </div>
    <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-zinc-600">Nothingness • Confidential</p>
  </div>
  ```
- Panic screen ("Noir Notes"):
  - Renders a clean Apple Notes / Obsidian style notepad (`# Q3 Brand Guidelines & Architectural Review`) with synced status and folder header.
  - Exit trigger: 700ms long-press on "Encrypted with Obsidian" in the footer (`handleExitPressStart` / `handleExitPressEnd`).
  - Shake trigger: Listens to `devicemotion` acceleration threshold (`speed > 2800`).
  - Custom event trigger: Listens for `window.addEventListener('trigger-panic-mode')`.

### Critical Gaps for R2
1. **Missing `blur` Listener**: `window.addEventListener('blur')` is not hooked. On iOS Safari and Android Chrome, the window `blur` event fires *before* `visibilitychange` when opening the app switcher or pulling down Control Center/notification shade. Adding `blur` ensures zero frame leakage into OS snapshots.
2. **Missing Logo Double-Tap Trigger**: In `components/Header.tsx` (lines 100-112), the Nothingness logo is wrapped in a standard Next.js `<Link href="/">`. There is no `onDoubleClick` or touch double-tap listener (`lastTap` within 300ms) to dispatch `window.dispatchEvent(new CustomEvent('trigger-panic-mode'))`.

---

## 4. Audio Recording, Playback & Sultry Noir Web Audio Pitch Shifting

### Direct Observation of Existing Setup
- `components/kinkster/AudioVibePlayer.tsx`: Playback component with play/pause state and 7 animated EQ visualizer bars.
- `components/kinkster/EphemeralChatModal.tsx` (lines 149-184):
  - Microphone capture via `navigator.mediaDevices.getUserMedia({ audio: true })`.
  - Recording via `new MediaRecorder(stream)`.
  - Captures `dataavailable` chunks into `Blob(audioChunks, { type: 'audio/webm' })`.
  - Reads as Base64 DataURL via `FileReader.readAsDataURL` and posts to `/api/kinkster/ephemeral-messages`.
  - Has a UI checkbox: `pitchShiftEnabled` ("Sultry Timbre Anonymizer").

### Critical Gap for R4
- **No Real Audio Pitch Shifting**: In `EphemeralChatModal.tsx` (line 192):
  ```typescript
  content: pitchShiftEnabled ? '🎙️ [Anonymized Voice Whisper]' : '🎙️ [Voice Whisper]',
  mediaUrl: base64Audio,
  ```
  The audio blob transmitted to the server is the completely unmanipulated microphone recording. It merely alters the text caption!
- **Required Web Audio API Architecture**:
  To achieve true "Sultry Noir" pitch shifting in-browser before upload:
  - Connect `MediaStream` to an `AudioContext`:
    ```typescript
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(micStream);
    // Apply pitch shifting or dark formant shaping (BiquadFilter low-pass/low-shelf at 800Hz + gain boost at 120Hz)
    const lowPass = audioCtx.createBiquadFilter();
    lowPass.type = 'lowshelf';
    lowPass.frequency.value = 300;
    lowPass.gain.value = 6;
    const dest = audioCtx.createMediaStreamDestination();
    source.connect(lowPass);
    lowPass.connect(dest);
    const recorder = new MediaRecorder(dest.stream);
    ```
  - Alternatively, post-process recorded buffer using `decodeAudioData` and detuned playback or phase vocoder worklet into an `OfflineAudioContext`.

---

## 5. Mobile Touch Ergonomics, Gestures & Dynamic Haptics

### Direct Observation of Existing Setup
- `components/PullToRefresh.tsx`:
  - Implements touch physics: `elasticDistance = Math.min(diff * 0.45, 110)`.
  - Threshold: 70px.
  - Haptics: Triggers `light` at threshold, `medium` on release.
  - Indicator: Spinning gold crest and `Release to Refresh` pill.
  - **Gap**: Not wrapped around `app/(user)/kinksters/page.tsx` feed or `app/(user)/sanctuary-pass/page.tsx`.
- `globals.css` (lines 222-229):
  - Defines `.sheet-drag-pill` for bottom sheet drag indicators.
  - **Gap**: Modals (`DesireResonanceModal`, `EphemeralChatModal`, `EventDossierModal`, `LiveTicketQRModal`, and Reflections modal) are wrapped in standard `items-end sm:items-center` fixed divs with no Framer Motion drag gestures (`drag="y"`, `dragConstraints={{ top: 0 }}`, swipe dismiss threshold `y > 100`).
- `lib/haptics.ts`:
  - Implements `triggerHaptic(type)`.
  - Current vibration patterns:
    - `light`: `vibrate(10)`
    - `medium`: `vibrate(25)`
    - `heavy`: `vibrate(50)`
    - `success`: `vibrate([25, 40, 30])`
    - `warning`: `vibrate([40, 30, 40])`
    - `resonance`: `vibrate([30, 50, 40, 60, 30])`
  - **Alignment needed for R1 & R5**:
    - Light tap on resonance selection: `vibrate(10)` (matches `light`).
    - Heavy double rumble on mutual match: `vibrate([30, 60, 30])`.
    - Verification success pulse on marshall scan: `vibrate([40, 60, 40])` or `vibrate([50, 80, 50])`.

---

## 6. Verification of Explicit Exclusions

| User Exclusion | Specification | Codebase Finding | Compliance Status |
| :--- | :--- | :--- | :--- |
| **NO "Tap-to-Reveal Ambient Blur"** | Media must display cleanly without requiring tap-and-hold blur reveal. | Inspected `app/(user)/kinksters/page.tsx` (feed media `img` / `video`), `app/(user)/kinksters/[alias]/page.tsx` (3-column media grid), and `components/kinkster/KinksterLandingPage.tsx`. Media tags are rendered directly without CSS `filter: blur(...)` or tap-to-reveal handlers. In `EphemeralChatModal.tsx`, burn-on-read photos are veiled behind a "Tap to View (Burns in 5s)" button as part of R4 ephemeral self-destruct, not ambient blur. | **COMPLIANT** |
| **NO "In-Sanctuary Radar / Floor Presence"** | No in-room Bluetooth/geofenced attendee radar. | Searched codebase for Web Bluetooth, Geolocation watchers, or floor radar presence logic. None exists. `KinksterLandingPage.tsx` contains a section named "The Desire Matrix & Chemistry Radar", but line-by-line inspection confirms this is a static marketing desire quiz (comparing user preferences against local averages), NOT a real-time Bluetooth or GPS presence radar. | **COMPLIANT** |

---

## 7. Component Tests & Browser API Mock Strategies

### Current Test Environment
- `package.json` specifies `"test": "tsc --noEmit"`.
- Vitest and Jest are not currently configured or installed in `package.json`.
- Running `pnpm test` executes `tsc --noEmit`, which completes with **0 errors**.

### Browser API Mock Strategies for Vitest / Testing Library

When implementing unit and integration tests for R1-R5 components, the following mock strategies must be established in test setup helpers:

```typescript
// test-utils/mock-browser-apis.ts

// 1. Haptics (navigator.vibrate)
export function mockVibrate() {
  const vibrateMock = vi.fn().mockReturnValue(true);
  Object.defineProperty(navigator, 'vibrate', {
    value: vibrateMock,
    writable: true,
    configurable: true,
  });
  return vibrateMock;
}

// 2. Camera & Microphone (navigator.mediaDevices.getUserMedia)
export function mockMediaDevices() {
  const fakeStream = {
    getTracks: () => [{ stop: vi.fn(), kind: 'video' }],
    getVideoTracks: () => [{ stop: vi.fn() }],
    getAudioTracks: () => [{ stop: vi.fn() }],
  };
  const getUserMediaMock = vi.fn().mockResolvedValue(fakeStream);
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia: getUserMediaMock },
    writable: true,
    configurable: true,
  });
  return { getUserMediaMock, fakeStream };
}

// 3. Native BarcodeDetector
export function mockBarcodeDetector(detectedCodes: Array<{ rawValue: string }> = []) {
  class MockBarcodeDetector {
    detect = vi.fn().mockResolvedValue(detectedCodes);
  }
  Object.defineProperty(window, 'BarcodeDetector', {
    value: MockBarcodeDetector,
    writable: true,
    configurable: true,
  });
  return MockBarcodeDetector;
}

// 4. Web Audio API (AudioContext & Pitch Shift nodes)
export function mockAudioContext() {
  class MockAudioContext {
    currentTime = 0;
    destination = {};
    createOscillator = vi.fn().mockReturnValue({
      type: 'sine',
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    });
    createGain = vi.fn().mockReturnValue({
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    });
    createMediaStreamSource = vi.fn().mockReturnValue({
      connect: vi.fn(),
    });
    createBiquadFilter = vi.fn().mockReturnValue({
      type: 'lowshelf',
      frequency: { value: 300 },
      gain: { value: 6 },
      connect: vi.fn(),
    });
    createMediaStreamDestination = vi.fn().mockReturnValue({
      stream: {},
    });
  }
  Object.defineProperty(window, 'AudioContext', {
    value: MockAudioContext,
    writable: true,
    configurable: true,
  });
  return MockAudioContext;
}

// 5. MediaRecorder
export function mockMediaRecorder() {
  class MockMediaRecorder {
    state = 'inactive';
    ondataavailable: ((e: any) => void) | null = null;
    onstop: (() => void) | null = null;
    start = vi.fn(() => { this.state = 'recording'; });
    stop = vi.fn(() => {
      this.state = 'inactive';
      if (this.ondataavailable) {
        this.ondataavailable({ data: new Blob(['fake-audio'], { type: 'audio/webm' }) });
      }
      if (this.onstop) this.onstop();
    });
  }
  Object.defineProperty(window, 'MediaRecorder', {
    value: MockMediaRecorder,
    writable: true,
    configurable: true,
  });
  return MockMediaRecorder;
}

// 6. Device Motion (Shake-to-Panic)
export function triggerDeviceMotionShake(speed = 3000) {
  const event = new Event('devicemotion') as any;
  event.accelerationIncludingGravity = { x: speed / 100, y: speed / 100, z: 0 };
  window.dispatchEvent(event);
}

// 7. Visibility Change (App-Switcher Shield)
export function setVisibilityState(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', {
    value: state,
    writable: true,
    configurable: true,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}
```

---

## 8. Actionable Implementation Matrix for Implementer Agents

| Requirement | Target Files | Key Implementation Action |
| :--- | :--- | :--- |
| **R1: Marshall Scanner** | `app/admin/marshall-scanner/page.tsx`<br>`components/events/EventDossierModal.tsx`<br>`supabase/migrations/` | 1. Add `jsqr` canvas decoding fallback loop when `BarcodeDetector` is missing.<br>2. Add Marshall Scanner entry button inside Gathering Dossier Safety & Marshalls tab for authorized staff.<br>3. Create `gathering_vettings` audit table migration and insert verification records upon scan.<br>4. Update haptics to triple pulse `[40, 60, 40]`. |
| **R2: Stealth Mode & Panic** | `components/StealthPrivacyShield.tsx`<br>`components/Header.tsx` | 1. Add `window.addEventListener('blur')` to immediately trigger `#os-app-switcher-shield`.<br>2. In `Header.tsx`, add a double-tap/double-click handler on the Nothingness logo to dispatch `'trigger-panic-mode'`. |
| **R3: Dual-Blind Desire Resonance** | `components/kinkster/DesireResonanceModal.tsx`<br>`app/(user)/kinksters/[alias]/page.tsx`<br>`app/(user)/kinksters/discover/page.tsx` | 1. Expand `DesireResonanceModal.tsx` tags to include Orientation/Unit tags.<br>2. Replace "Spice Up 🔥" button on `[alias]/page.tsx` with "Resonate" button opening `DesireResonanceModal`.<br>3. Transition `discover/page.tsx` away from incoming request notifications to purely confidential mutual discovery. |
| **R4: Ephemeral Chat & Sultry Noir** | `components/kinkster/EphemeralChatModal.tsx` | 1. Implement real Web Audio API audio stream filtering (BiquadFilter/low-shelf formant shaping) before passing to `MediaRecorder` when Sultry Noir is toggled ON.<br>2. Retain 5-second countdown timer and server shredding for burn-on-read photos. |
| **R5: Touch Ergonomics & Haptics** | `components/PullToRefresh.tsx`<br>`app/(user)/kinksters/page.tsx`<br>`components/kinkster/DesireResonanceModal.tsx`<br>`components/kinkster/EphemeralChatModal.tsx`<br>`components/events/LiveTicketQRModal.tsx`<br>`lib/haptics.ts` | 1. Wrap `PullToRefresh` around the active feed in `kinksters/page.tsx`.<br>2. Convert bottom-anchored modals to Framer Motion gesture sheets (`drag="y"`, `dragConstraints={{ top: 0 }}`, swipe dismiss at 100px) with `.sheet-drag-pill`.<br>3. Tune `lib/haptics.ts` for resonance tap (`10ms`), mutual match rumble (`[30, 60, 30]`), and marshall scan (`[40, 60, 40]`). |

---

## Conclusion

The architecture of Nothingness is well-positioned for the R1-R5 native app experience. The existing codebase contains roughly 70% of the foundational visual components and database schema, but requires critical bridge implementations for browser hardware APIs (`jsqr` fallback, Web Audio pitch shifting, blur/double-tap panic triggers, gesture bottom sheets, and haptic synchronization).
