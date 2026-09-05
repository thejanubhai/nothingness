# Milestone 1 Review & Adversarial Challenge Report

**Target**: Level 2 In-Person Vetting QR Scanner (Requirement R1)  
**Reviewer**: `m1_reviewer_1`  
**Parent Orchestrator**: `teamwork_preview_orchestrator_1` (`02c3aaab-5fbc-45c0-823f-14bab9365c11`)  
**Date**: 2026-09-04T19:33:00Z  

---

## 1. Review Summary

**Verdict**: **REQUEST_CHANGES**

While the foundations (Permissions-Policy header, database migration deployment to Supabase `amlxlguebzkszkwkzroe`, UI layout, dual-engine fallback, Web Audio chimes, and haptics) are solidly constructed, a critical logic defect in the Route Handler silently bypasses database profile updates and audit logging for non-UUID attendees while falsely returning `success: true`. Furthermore, a client-side PIN validation bypass and 7 failing E2E tests in the test suite require immediate remediation before Milestone 1 can be certified.

---

## 2. Findings

### [Critical] Finding 1: Silent Bypass of Profile Updates and Audit Logging on Non-UUID Identifiers
- **Location**: `app/api/admin/gatherings/verify-in-person/route.ts`, lines 174, 180, 203, 214, 242.
- **What was found**:
  The handler contains:
  ```typescript
  const isTargetUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId);
  ...
  if (isTargetUuid) {
    // fetch kinksterProfile & guestProfile
  }
  ...
  if (guestProfile?.id) { ... }
  if (kinksterProfile?.id) { ... }
  ...
  if (isTargetUuid) {
    // insert into gathering_vettings
  }
  ```
- **Why this is a critical problem**:
  1. When `targetUserId` does not match the 36-character hexadecimal UUID format (e.g. test harness user IDs like `'usr_guest_101'`, custom legacy IDs, or federated auth tokens):
     - `kinksterProfile` and `guestProfile` queries are completely skipped.
     - Profile updates (`in_person_vetted = true`, `is_in_person_vetted = true`) are skipped because `guestProfile?.id` and `kinksterProfile?.id` remain `undefined`.
     - Most critically, the audit record in `gathering_vettings` is **SILENTLY OMITTED**.
     - Moniker resolution defaults to `member_${targetUserId.slice(0, 6)}` (`member_usr_gu`), failing tests TC4.1 and TC4.2.
  2. In spite of this complete omission of database writes, the API returns:
     ```json
     {
       "success": true,
       "isInPersonVetted": true,
       "userAlias": "member_usr_gu",
       "message": "Level 2 Physical Vetting Confirmed for @member_usr_gu"
     }
     ```
     This creates a false-positive attestation: the scanner reports success to the Marshall, but the attendee's profile is never updated in the database and no audit trail is preserved!
- **Suggestion**:
  - Do NOT gate profile lookups or database updates behind `if (isTargetUuid)`. Query `kinkster_profiles` and `guest_profiles` using standard `.eq('id', targetUserId)` or `.eq('user_id', targetUserId)`.
  - In PostgreSQL, querying a UUID column with an arbitrary text string can trigger error `22P02`. Protect the query by safely resolving the record or handling Postgres exceptions, rather than silently skipping business logic. If a record is truly invalid or missing, return HTTP 404 or HTTP 400 instead of a facade `success: true`.

---

### [Major] Finding 2: Client-Side PIN Gate Allows Unrestricted Unlock with Arbitrary 4-Digit Input
- **Location**: `app/admin/marshall-scanner/page.tsx`, line 75:
  ```typescript
  const handleUnlockWithPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === '1991' || pin.trim().length >= 4) {
      setIsUnlocked(true);
      triggerHaptic('success');
      toast.success('Marshall Security Mode Active');
    } else { ... }
  };
  ```
- **Why this is a problem**:
  The condition `pin.trim() === '1991' || pin.trim().length >= 4` evaluates to `true` for **ANY string of 4 or more digits** (e.g. "0000", "1234", "9999"). Any unauthenticated attendee could enter four random digits to bypass the PIN barrier and activate the camera viewfinder on a staff member's device.
- **Suggestion**:
  Validate the PIN either:
  1. Against the configured PIN directly (or an authorized server status check `/api/admin/system/status`), or
  2. Send a quick validation request, or at minimum restrict to `pin.trim() === '1991'` (or the client-accessible configured PIN).

---

### [Major] Finding 3: 7 Automated E2E Tests Failing for Milestone 1 (F1-F4)
- **Location**: `tests/e2e/tier1-feature-coverage.test.ts`
- **What was found**:
  Running `tests/e2e/runner.ts` results in 7 failures out of the 20 tests covering Requirement R1:
  - `FAIL F2_QR_Decoding TC2.4`: Fallback resolution by direct member alias in QR token (got HTTP 404 instead of 200). Caused by `.or(alias.ilike...)` syntax in `route.ts:137`.
  - `FAIL F3_L2_Certification TC3.1`: Updates `kinkster_profiles.in_person_vetted = true` in database (assertion failed because update was skipped).
  - `FAIL F3_L2_Certification TC3.2`: Updates `guest_profiles.in_person_vetted = true` in database (assertion failed because update was skipped).
  - `FAIL F3_L2_Certification TC3.4`: Verified Level 1 ID on file reported as `isIdVerified: true` (got `false`).
  - `FAIL F3_L2_Certification TC3.5`: Unverified Level 1 ID reports `isIdVerified: false` while recording check-in (got undefined / 404).
  - `FAIL F4_Feedback_Signals TC4.1`: Affirmative message includes member moniker `@velvet_cord` (got `@member_usr_gu`).
  - `FAIL F4_Feedback_Signals TC4.2`: Moniker falls back to `full_name` when alias is absent (got `@member_usr_gu`).
- **Suggestion**:
  Fixing Finding 1 and alias resolution in `route.ts` will bring all 7 tests into passing status.

---

### [Minor] Finding 4: Scan Cooldown Timer Not Bound in `try/finally` Block
- **Location**: `app/admin/marshall-scanner/page.tsx`, lines 165-171.
- **Why this is a problem**:
  ```typescript
  if (detectedValue) {
    isProcessingRef.current = true;
    await processVerification(detectedValue);
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 2500);
  }
  ```
  If `processVerification` encounters an unexpected error or rejects before the `setTimeout` statement, `isProcessingRef.current` remains `true` indefinitely, locking up camera frame processing until the browser tab is refreshed.
- **Suggestion**:
  Wrap the scan dispatch in a `try/finally` or trigger the cooldown timer within a guaranteed `finally` block.

---

### [Minor] Finding 5: Migration Policy Grants Unrestricted Write on `gathering_vettings`
- **Location**: `supabase/migrations/20260905000001_gathering_vettings_and_l2_certification.sql`, lines 25-27:
  ```sql
  CREATE POLICY "Admins and Marshalls manage vettings" ON public.gathering_vettings
      FOR ALL TO public USING (true) WITH CHECK (true);
  ```
- **Why this is a problem**:
  Granting `FOR ALL TO public USING (true) WITH CHECK (true)` allows any client holding the public anonymous Supabase key to forge or delete vetting records directly via PostgREST.
- **Suggestion**:
  Restrain public writes to authenticated users with admin/marshall roles, or rely strictly on the Service Role key in the Next.js API route.

---

## 3. Verified Claims

| Claim | Verification Method | Result | Notes |
|---|---|---|---|
| `next.config.js` Permissions-Policy includes camera & mic | `view_file next.config.js` | **PASS** | Line 53: `camera=(self), microphone=(self)` |
| Database migration deployed to Supabase | Supabase MCP `execute_sql` | **PASS** | `gathering_vettings`, `kinkster_resonances`, `kinkster_ephemeral_messages`, `is_in_person_vetted` confirmed |
| TypeScript compiles with zero errors | `pnpm test` (`tsc --noEmit`) | **PASS** | Exit code 0, 0 type errors |
| 4-digit PIN authentication in API route | `tests/e2e/tier1-feature-coverage.test.ts` (TC1.1-TC1.5) | **PASS** | Default `1991`, custom env PIN, whitespace trimming, and 401 rejection verified |
| Web Audio C5->C6 synthesizer chime | `app/admin/marshall-scanner/page.tsx:40-62` | **PASS** | 523.25Hz -> 1046.5Hz exponential ramp |
| Triple haptic pulse `vibrate([40, 60, 40])` | `lib/haptics.ts:34` & `page.tsx:202` | **PASS** | `marshallSuccess` pattern correctly matches spec |
| Staff launchers in Dossier & Admin Hub | `EventDossierModal.tsx:289`, `AdminEventsHub.tsx:296, 924` | **PASS** | Functional links to `/admin/marshall-scanner` verified |
| Software QR fallback implementation | `lib/scanner/qrFallback.ts` | **PASS** | Canvas draw + jsQR decoding correctly structured |

---

## 4. Adversarial Stress-Testing

### Challenge 1: Arbitrary PIN Unlock on Floor Devices
- **Attack Scenario**: An attendee picks up an unattended Marshall tablet or phone at the door and types "0000" or any 4 digits.
- **Observation**: `MarshallScannerPage:75` unlocks immediately (`pin.trim().length >= 4`).
- **Blast Radius**: Full camera viewfinder and physical venue attendance scanner are exposed.
- **Mitigation**: Require exact match against authorized PIN or server session.

### Challenge 2: Non-UUID Attendee Certification
- **Attack Scenario**: Attendee checks in with pass token or QR code referencing an alphanumeric user ID.
- **Observation**: Scanner displays green checkmark "Level 2 Certified ✓" with moniker `@member_usr_gu`. Attendee enters the sanctuary.
- **Blast Radius**: The attendee's database record is NOT updated (`is_in_person_vetted` remains `false`), and no audit record is written to `gathering_vettings`. If questioned later by safety marshalls, no record of their vetting exists in the system.
- **Mitigation**: Ensure database lookup and audit insertion execute regardless of user ID string format.

---

## 5. Coverage Gaps & Unverified Items

- **Physical Mobile Camera Sensor**: Verified via software canvas fallback and mock streams; live optical hardware autofocus/exposure under extreme low-light sanctuary conditions cannot be physically validated in headless CI and should be spot-checked on physical devices.

---

## 6. Actionable Fix Checklist for Worker

1. In `app/api/admin/gatherings/verify-in-person/route.ts`:
   - Remove the `if (isTargetUuid)` gate that blocks profile fetching, profile updates, and `gathering_vettings` insert.
   - For `kinkster_profiles` query by alias, ensure it supports exact matching (`.eq` / `.ilike`) cleanly so both aliases and tokens resolve.
   - Ensure `isIdVerified`, `userAlias`, profile table updates, and `gathering_vettings` inserts execute properly.
2. In `app/admin/marshall-scanner/page.tsx`:
   - Fix line 75: replace `pin.trim() === '1991' || pin.trim().length >= 4` with `pin.trim() === '1991'` (or validated PIN).
   - In `startScanningLoop`, ensure `isProcessingRef.current = false` is safely protected in a `finally` block or cleared reliably.
3. Run `npx tsx tests/e2e/runner.ts` and verify that all M1 test cases (TC1.1-TC4.5) pass with 100% success.
