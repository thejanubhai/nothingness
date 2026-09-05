# Milestone 1 Handoff Report: Reviewer & Critic Verdict

**Agent**: `m1_reviewer_1`  
**Milestone**: M1 (Level 2 In-Person Vetting QR Scanner — Requirement R1)  
**Parent Orchestrator**: `teamwork_preview_orchestrator_1` (`02c3aaab-5fbc-45c0-823f-14bab9365c11`)  
**Date**: 2026-09-04T19:34:00Z  
**Verdict**: **REQUEST_CHANGES**  

---

## 1. Observation

Direct observations and evidence collected during code inspection, database verification, and test execution:

1. **Permissions-Policy (`next.config.js:53`)**:
   Line 53 specifies `value: 'camera=(self), microphone=(self), geolocation=()'`. Confirmed camera and microphone access are permitted for same-origin execution.

2. **Supabase Migration Status**:
   Inspected remote Supabase project `amlxlguebzkszkwkzroe` via MCP `execute_sql`:
   - Table `gathering_vettings`: Exists with columns `id`, `event_id`, `attendee_id`, `marshall_id`, `marshall_alias`, `verified_at`, `verification_method`, `notes`, `created_at`.
   - Table `kinkster_profiles`: Has `is_in_person_vetted` (boolean).
   - Table `guest_profiles`: Has `is_in_person_vetted` (boolean).
   - Tables `kinkster_resonances` and `kinkster_ephemeral_messages`: Both exist.

3. **Silent Persistence Bypass in Route Handler (`app/api/admin/gatherings/verify-in-person/route.ts`)**:
   - Lines 174-194:
     ```typescript
     const isTargetUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId);
     let kinksterProfile: any = null;
     let guestProfile: any = null;
     if (isTargetUuid) {
       // queries kinkster_profiles and guest_profiles
     }
     ```
   - Lines 203-224: Profile updates to `in_person_vetted: true` and `is_in_person_vetted: true` only execute if `guestProfile?.id` or `kinksterProfile?.id` are defined.
   - Lines 242-255: `gathering_vettings` insert is wrapped in `if (isTargetUuid) { ... }`.
   - Result: When `targetUserId` is not formatted as an 8-4-4-4-12 UUID (e.g. `'usr_guest_101'`), no profile queries run, no database records are updated, and no audit record is inserted into `gathering_vettings`. Despite zero database writes occurring, line 258 returns:
     ```json
     { "success": true, "isInPersonVetted": true, "userAlias": "member_usr_gu" }
     ```

4. **Client-Side PIN Gate Bypass (`app/admin/marshall-scanner/page.tsx:75`)**:
   Line 75 implements:
   ```typescript
   if (pin.trim() === '1991' || pin.trim().length >= 4) {
     setIsUnlocked(true);
   ```
   Entering any 4-character string (e.g. "0000", "abcd") unlocks the UI camera viewfinder immediately without authentication.

5. **Automated Test Results**:
   - `pnpm test` (`tsc --noEmit`): Exit code 0 (zero compiler errors).
   - `npx tsx tests/e2e/runner.ts`: 7 tests failed out of 20 covering Milestone 1:
     - `FAIL F2_QR_Decoding TC2.4`: Fallback resolution by direct member alias in QR token (HTTP 404).
     - `FAIL F3_L2_Certification TC3.1`: Updates `kinkster_profiles.in_person_vetted = true` in database.
     - `FAIL F3_L2_Certification TC3.2`: Updates `guest_profiles.in_person_vetted = true` in database.
     - `FAIL F3_L2_Certification TC3.4`: Verified Level 1 ID on file is reported as `isIdVerified: true`.
     - `FAIL F3_L2_Certification TC3.5`: Unverified Level 1 ID reports `isIdVerified: false` while recording check-in.
     - `FAIL F4_Feedback_Signals TC4.1`: Affirmative message includes member moniker `@velvet_cord`.
     - `FAIL F4_Feedback_Signals TC4.2`: Moniker falls back to `full_name` when alias is absent.

6. **Feedback Hardware & UI Signals**:
   - `lib/haptics.ts:34` defines `marshallSuccess` emitting `navigator.vibrate([40, 60, 40])`.
   - `app/admin/marshall-scanner/page.tsx:199-204` triggers both `triggerHaptic('marshallSuccess')` and direct `navigator.vibrate([40, 60, 40])`.
   - `app/admin/marshall-scanner/page.tsx:40-62` synthesizes C5 (523.25Hz) to C6 (1046.5Hz) Web Audio chime.
   - Staff launchers confirmed in `components/events/EventDossierModal.tsx:289` and `components/admin/AdminEventsHub.tsx:296, 924`.

---

## 2. Logic Chain

1. From Observation 1 & 2: Infrastructure prerequisites (browser permissions header and database schema migration) were completed and deployed.
2. From Observation 3: The core requirement of R1 states: *"Instantly updates Supabase database (profiles.is_in_person_vetted = true and logs into gathering_vettings with marshall_id, event_id, and verified_at)"*. By wrapping the profile resolution, profile update, and audit log insert in `if (isTargetUuid)` while still returning `success: true` and `isInPersonVetted: true`, the API performs a false-positive attestation whenever non-standard user identifiers are processed.
3. From Observation 4: The 4-digit PIN security lock requirement specifies protecting the camera scanner interface from unauthorized on-floor access. Bypassing the check with `pin.trim().length >= 4` invalidates the security boundary on the client.
4. From Observation 5: 7 of 20 automated tests specifically validating Requirement R1 fail in `tests/e2e/tier1-feature-coverage.test.ts` as a direct consequence of the logic chain in Step 2 and alias query syntax in Step 1.
5. Therefore, while TypeScript builds cleanly (`pnpm test` passes), the functional and security criteria for Milestone 1 are not fully satisfied.

---

## 3. Caveats

- In test environments lacking a physical camera device, camera streaming is simulated; the manual token fallback form in `/admin/marshall-scanner` provides functional redundancy.
- Supabase production databases use UUID v4 for `auth.users.id`; however, applications and profiles may be referenced by legacy identifiers or aliases, and the test harness uses structured test IDs (`usr_guest_101`). A robust production handler must handle these without silent write drops.

---

## 4. Conclusion

**Verdict**: **REQUEST_CHANGES**

Milestone 1 cannot be approved in its current state due to:
1. **Critical Database Persistence Defect**: Silent omission of profile vetting updates and `gathering_vettings` audit log rows on non-UUID identifiers while returning `success: true`.
2. **Major Client-Side PIN Bypass**: `pin.trim().length >= 4` unlocks the camera scanner for any 4-digit input.
3. **Failing E2E Tests**: 7 test failures in `tests/e2e/tier1-feature-coverage.test.ts` (TC2.4, TC3.1, TC3.2, TC3.4, TC3.5, TC4.1, TC4.2).

### Required Changes for `m1_worker_1`:
1. In `app/api/admin/gatherings/verify-in-person/route.ts`:
   - Remove the `if (isTargetUuid)` gating condition on lines 174, 180, and 242. Allow `kinkster_profiles` and `guest_profiles` to be resolved and updated, and ensure `gathering_vettings` audit rows are always recorded.
   - For `kinkster_profiles` query by alias, ensure exact match fallback works (`.or(`alias.eq.${cleanToken},alias.eq.${cleanTokenWithoutAt}`)` or appropriate PostgREST filter) so alias resolution (e.g. `velvet_cord`) returns HTTP 200.
2. In `app/admin/marshall-scanner/page.tsx`:
   - Remove `|| pin.trim().length >= 4` from line 75 so only the authorized PIN (`1991` or configured value) unlocks the interface.
   - Protect scan loop cooldown timeout in a `try/finally` block.
3. Verify that `npx tsx tests/e2e/runner.ts` passes 100% for Milestone 1 features (F1 to F4, TC1.1 to TC4.5).

---

## 5. Verification Method

To independently re-verify once the changes are applied:

1. **Run TypeScript Typecheck**:
   ```bash
   pnpm test
   ```
   Expected: Exit code 0, 0 errors.

2. **Run E2E Suite for Milestone 1**:
   ```bash
   npx tsx -e "import { runAllSuites } from './tests/e2e/harness'; import './tests/e2e/tier1-feature-coverage.test'; runAllSuites().then(res => { const m1 = res.results.filter(r => ['F1_PIN_Auth', 'F2_QR_Decoding', 'F3_L2_Certification', 'F4_Feedback_Signals'].includes(r.feature)); console.log('M1 Results:', m1.filter(r => r.passed).length + '/' + m1.length, 'passed'); });"
   ```
   Expected: 20/20 passed.

3. **Verify PIN Security**:
   - Entering "0000" in `MarshallScannerPage` must reject with "Invalid Marshall Security PIN".
   - Entering "1991" must unlock the scanner.

4. **Verify Database Audit & Vetting Update**:
   - Send verification request for attendee pass `QR_PASS_TOKEN_ELENA_9901`.
   - Confirm attendee's `is_in_person_vetted` is `true` in both profiles.
   - Confirm audit row inserted in `gathering_vettings`.
