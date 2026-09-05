# Dispatch: m1_worker_1

**Mission**: Implement Milestone 1 (M1) — Level 2 In-Person Vetting QR Scanner for Consent Marshalls & Staff (Requirement R1).

**Mandatory Reading**:
- `c:\Users\hudav\Documents\GitHub\nothingness\ORIGINAL_REQUEST.md` (read first)
- `c:\Users\hudav\Documents\GitHub\nothingness\PROJECT.md`
- `c:\Users\hudav\Documents\GitHub\nothingness\.agents\survey_explorer_1\report.md`
- `c:\Users\hudav\Documents\GitHub\nothingness\.agents\survey_spec_miner_1\report.md`
- `c:\Users\hudav\Documents\GitHub\nothingness\.agents\survey_explorer_2\report.md`

**MANDATORY INTEGRITY WARNING**:
> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

**File Ownership**:
- You own:
  - `next.config.js`
  - `supabase/migrations/20260905000001_gathering_vettings_and_l2_certification.sql`
  - `app/api/admin/gatherings/verify-in-person/route.ts`
  - `app/admin/marshall-scanner/page.tsx`
  - `components/events/EventDossierModal.tsx`
  - `components/admin/AdminEventsHub.tsx`
  - `lib/scanner/qrFallback.ts` (if needed for canvas jsqr decoding)

**Scope of Work**:
1. **`next.config.js`**:
   - Update `Permissions-Policy` header to permit camera and microphone: `camera=(self), microphone=(self), geolocation=()`.
2. **Database Migration**:
   - Create `supabase/migrations/20260905000001_gathering_vettings_and_l2_certification.sql` based on `survey_spec_miner_1/report.md §5`.
   - Ensure table `gathering_vettings` is defined with `id`, `event_id`, `attendee_id`, `marshall_id`, `marshall_alias`, `verified_at`, `verification_method`, `notes`, `created_at`.
   - Ensure `is_in_person_vetted` is added to `kinkster_profiles` and `guest_profiles`.
   - Ensure `kinkster_resonances` and `kinkster_ephemeral_messages` tables and policies are defined.
3. **Backend API (`/api/admin/gatherings/verify-in-person/route.ts`)**:
   - Fix bug where it queried `.from('profiles')`.
   - Authenticate via PIN `1991` or Supabase admin session.
   - Match scanned token against `sanctuary_event_applications`, `kinkster_profiles`, or `guest_profiles`.
   - Verify Level 1 Govt ID status.
   - Update `kinkster_profiles.in_person_vetted = true` AND `kinkster_profiles.is_in_person_vetted = true` (and same on `guest_profiles`).
   - Insert an audit entry into `gathering_vettings` with `marshall_id`, `event_id`, `attendee_id`, `verified_at = NOW()`.
   - Return `{ success: true, isInPersonVetted: true, userAlias, ... }`.
4. **Marshall Scanner UI (`app/admin/marshall-scanner/page.tsx`)**:
   - Support 4-digit PIN lock screen (default `1991` / `process.env.MARSHALL_SECURITY_PIN`).
   - Camera video QR scanning: use native `BarcodeDetector` if present, with canvas fallback (e.g. `lib/scanner/qrFallback.ts` using `jsqr` or software canvas decoder).
   - Affirmative green badge, guest moniker/alias display, affirmative audio chime (Web Audio API), and distinctive triple haptic pulse `vibrate([40, 60, 40])`.
5. **Staff Access Launcher**:
   - Embed a quick-access button to `/admin/marshall-scanner` in `components/events/EventDossierModal.tsx` and/or `components/admin/AdminEventsHub.tsx`.
6. **Build & Test Verification**:
   - Run `pnpm test` (`tsc --noEmit`) to verify 0 type errors.

**Output**:

## 2026-09-04T19:17:03Z
You are m1_worker_1.
Your working directory: c:\Users\hudav\Documents\GitHub\nothingness\.agents\m1_worker_1
Your parent orchestrator: teamwork_preview_orchestrator_1 (Conversation ID: 02c3aaab-5fbc-45c0-823f-14bab9365c11)

MANDATORY FIRST STEP:
Read c:\Users\hudav\Documents\GitHub\nothingness\ORIGINAL_REQUEST.md, c:\Users\hudav\Documents\GitHub\nothingness\PROJECT.md, and c:\Users\hudav\Documents\GitHub\nothingness\.agents\m1_worker_1\DISPATCH.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

TASK:
Implement Milestone 1: Level 2 In-Person Vetting QR Scanner (Requirement R1).
1. In `next.config.js`: Update `Permissions-Policy` to `camera=(self), microphone=(self), geolocation=()`.
2. In `supabase/migrations/20260905000001_gathering_vettings_and_l2_certification.sql`: Create migration adding `gathering_vettings` audit table, adding `is_in_person_vetted` to `kinkster_profiles` and `guest_profiles`, and ensuring `kinkster_resonances` and `kinkster_ephemeral_messages` tables exist.
3. In `app/api/admin/gatherings/verify-in-person/route.ts`: Fix query to check `kinkster_profiles` and `guest_profiles` (remove invalid `from('profiles')`), update `is_in_person_vetted = true`, verify Level 1 ID, insert audit record into `gathering_vettings`, and return full certification status.
4. In `app/admin/marshall-scanner/page.tsx`: Support 4-digit PIN lock screen, camera live stream with BarcodeDetector and fallback (e.g. `lib/scanner/qrFallback.ts`), instant green badge, guest moniker display, Web Audio chime, and triple haptic pulse `vibrate([40, 60, 40])`.
5. In `components/events/EventDossierModal.tsx` and `components/admin/AdminEventsHub.tsx`: Embed direct launcher button to `/admin/marshall-scanner` for staff.
6. Verify changes with `pnpm test` (`tsc --noEmit`).

Write your progress to c:\Users\hudav\Documents\GitHub\nothingness\.agents\m1_worker_1\progress.md
Write your handoff to c:\Users\hudav\Documents\GitHub\nothingness\.agents\m1_worker_1\handoff.md
Send a completion message back to parent when done.

