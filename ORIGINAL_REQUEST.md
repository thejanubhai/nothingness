# Original User Request

## 2026-09-04T19:08:50Z

Build the definitive native-app experience for Nothingness Kinkster Mode, leaving FetLife and Feeld far behind through physical identity trust, zero-rejection dual-blind resonance, military-grade stealth camouflage, and native mobile ergonomics.

Working directory: c:\Users\hudav\Documents\GitHub\nothingness
Integrity mode: development

## Scope & Explicit Exclusions
- **Explicitly Excluded by User**: 
  - NO "Tap-to-Reveal Ambient Blur" (media displays cleanly without requiring tap-and-hold blur reveal).
  - NO "In-Sanctuary Radar / Floor Presence" (no in-room Bluetooth/geofenced attendee radar).
- **Explicitly Required Deliverables**:
  - R1: Level 2 In-Person Vetting QR Scanner for Consent Marshalls & Staff.
  - R2: Stealth Mode, App-Switcher Shield & Panic Camouflage.
  - R3: Dual-Blind "Desire Resonance" Mutual Pairing & Comprehensive Dynamic Tags.
  - R4: Ephemeral Confidential Whispers, Burn-on-Read Media & Voice Notes.
  - R5: Native PWA Touch Ergonomics, Haptics & Bottom Sheet Gestures.

---

## Detailed Requirements

### R1. Level 2 In-Person Vetting QR Scanner (Consent Marshalls & Admins)
- **Access & Security**: Mobile-first scanner interface at `/admin/marshall-scanner` (and embedded inside Gathering Dossier for authorized staff). Protected by admin authentication and a quick 4-digit Marshall Security PIN for instant on-floor access.
- **Instant 1-Second Certification**:
  - Camera-based live video QR decoder (using native `BarcodeDetector` or `jsqr` fallback).
  - Validates the scanned token against `event_applications` / `sanctuary_passes`.
  - Confirms Level 1 Aadhaar/Passport ID is verified on file.
  - Instantly updates Supabase database (`profiles.is_in_person_vetted = true` and logs into `gathering_vettings` with `marshall_id`, `event_id`, and `verified_at`).
- **Feedback**: Instant affirmative green badge, guest moniker display, and distinctive triple haptic pulse (`vibrate([40, 60, 40])`).

### R2. Stealth Mode & OS App-Switcher Privacy Shield
- **OS-Level Multi-Tasking Shield**:
  - Hook into native browser lifecycle events (`visibilitychange`, `pagehide`, `blur`).
  - When the app is minimized, user switches to another app, or opens the mobile multitasking drawer, replace the DOM viewport with an opaque dark noir screen featuring only the minimalist Nothingness geometric crest.
  - Ensures zero screenshots or lifestyle photos are captured in iOS/Android recent apps previews.
- **Panic Camouflage Trigger**:
  - Double-tapping the top Nothingness crest or performing a rapid device shake instantly switches the UI to a neutral "Noir Notes" minimalist memo pad.
  - A discreet long-press on the notes footer unlocks and restores the active session.

### R3. Dual-Blind "Desire Resonance" Mutual Pairing Architecture
- **Rich Dynamic & Lifestyle Tags**:
  - **Dynamics / Roles**: Dominant, Submissive, Switch, Shibari Artisan, Primal, Sadist, Masochist, Brat, Rigger, Rope Bunny, Protocol, Pet Play, Voyeur, Exhibitionist.
  - **Orientation / Unit**: Solo Female, Solo Male, Couple (M+F), Couple (F+F), Non-Binary, Poly Dyad.
  - **Desired Contexts**: Conversational Salon, Shibari Jam, Sensory Exploration, Noir Masquerade, Private Suite.
- **Zero-Rejection Dual-Blind Mechanics**:
  - Members browse verified @aliases with their chosen tags, photos, and vetted badges.
  - Tapping "Resonate" records the member's intention with selected vibe tags into `kinkster_resonances` in Supabase.
  - **Strict Confidentiality**: The targeted member receives NO alert, zero notification, and cannot see who resonated. This completely eliminates awkwardness or rejection anxiety at physical gatherings.
  - **Mutual Lock**: Only when both members mutually tap "Resonate" on each other within 48 hours does the system trigger a "Resonance Matched" gold banner and provision a private ephemeral chamber.

### R4. Ephemeral Confidential Whispers & Auto-Purging Noir Chat
- **Burn-on-Read Media**:
  - Photos shared inside ephemeral chambers can be flagged as "Burn on Read".
  - Opening the photo initiates a 5-second countdown timer, after which the media is shredded from client state and marked expired on storage.
- **Voice Whispers**:
  - In-browser microphone audio recording for voice whispers.
  - Includes an optional "Sultry Noir" pitch-shift toggle to anonymize vocal timbre for members desiring total privacy.
- **Automated Post-Gathering Purge**:
  - Gathering-linked ephemeral connection chats automatically self-destruct 24 hours after the event concludes, ensuring zero digital residue.

### R5. Native Touch Ergonomics & Dynamic Haptic Engine
- **Pull-to-Refresh**: Native physics bounce on feed and gathering screens with an animated spinning gold crest indicator.
- **Gesture Bottom Sheets**: Mobile swipe-down to dismiss on member profiles, reflection modals, and QR ticket sheets.
- **Haptic Feedback**:
  - Light tap on resonance selection (`vibrate(10)`).
  - Heavy double rumble on mutual match (`vibrate([30, 60, 30])`).
  - Verification success pulse on marshall scan (`vibrate([50, 80, 50])`).

---

## Acceptance Criteria

### Marshall Scanner
- [ ] Scanning an attendee QR updates their profile to `is_in_person_vetted = true` in Supabase in under 1 second.
- [ ] Attendee view immediately reflects "Level 2 In-Person Certified" badge.

### Stealth & Panic
- [ ] Switching away from the PWA blanks the app switcher preview immediately.
- [ ] Double-tap on logo triggers instant camouflage screen.

### Desire Resonance
- [ ] Single-sided resonance remains strictly confidential with no alerts to the target.
- [ ] Mutual resonance within 48 hours unlocks an ephemeral connection room.

### Ephemeral Chat & Voice
- [ ] Burn-on-read photo expires and becomes inaccessible after 5 seconds.
- [ ] Voice notes record and play back smoothly with pitch-shift option.

### Verification & Performance
- [ ] `pnpm test` (`tsc --noEmit`) passes with 0 errors.
- [ ] Responsive, native-feeling mobile touch interactions across iOS and Android PWAs.
