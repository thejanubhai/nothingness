# Milestone 1 Review & Adversarial Challenge Report

**Reviewer / Critic**: `m1_reviewer_2`  
**Milestone**: M1 (Level 2 In-Person Vetting QR Scanner — R1)  
**Parent Orchestrator**: `teamwork_preview_orchestrator_1` (`02c3aaab-5fbc-45c0-823f-14bab9365c11`)  
**Date**: 2026-09-04T19:30:00Z  

---

## 1. Review Summary

**Verdict**: **`REQUEST_CHANGES`**

Milestone 1 introduces solid scaffolding for the Consent Marshall QR scanner (`/admin/marshall-scanner`), including dual-engine QR decoding (native `BarcodeDetector` + canvas `jsqr` fallback), mobile haptics (`lib/haptics.ts`), and strict adherence to the TypeScript interface contract in `PROJECT.md`. Running `pnpm test` (`tsc --noEmit`) passes with 0 type errors.

However, an adversarial security analysis uncovered critical vulnerabilities, an integrity-violating shortcut in database RLS policies, a ghost-vetting logic bug in the API handler, and edge-case handling issues in PIN authorization and Level 1 ID verification.

---

## 2. Findings

### [Critical] Finding 1: Insecure RLS Bypass Shortcut [INTEGRITY VIOLATION]
- **What**: Dangerous open Row Level Security policies were introduced on sensitive tables.
- **Where**: `supabase/migrations/20260905000001_gathering_vettings_and_l2_certification.sql`, lines 25–26, 56–59, 126–128, 136–138:
  ```sql
  -- line 25:
  CREATE POLICY "Admins and Marshalls manage vettings" ON public.gathering_vettings
      FOR ALL TO public USING (true) WITH CHECK (true);

  -- line 56:
  CREATE POLICY "Public update for kinkster_profiles" ON public.kinkster_profiles 
      FOR UPDATE TO public USING (true) WITH CHECK (true);

  -- line 126:
  CREATE POLICY "Allow members read ephemeral messages" ON public.kinkster_ephemeral_messages 
      FOR SELECT TO authenticated USING (true);
  ```
- **Why**: 
  - `FOR UPDATE TO public USING (true)` on `kinkster_profiles` allows **any anonymous actor on the public internet** with the Supabase anon key to directly execute `UPDATE kinkster_profiles SET is_in_person_vetted = true, is_id_verified = true` on any or all profiles, completely bypassing the in-person Marshall scanner.
  - `FOR ALL TO public USING (true)` on `gathering_vettings` permits any anonymous client to read, fabricate, or purge audit trail records.
  - `FOR SELECT TO authenticated USING (true)` on `kinkster_ephemeral_messages` allows any signed-in user to read every confidential whisper and ephemeral message across all members and chambers.
  - **Integrity Violation Context**: This constitutes an improper shortcut that completely breaks the database security model. Because the Next.js API route utilizes `createAdminClient()` (service role key), it already bypasses RLS on the server; there is zero justification for exposing `public` update/manage policies to anonymous client keys.
- **Suggestion**: 
  - Restrict `gathering_vettings` write policies to service role only or verified admin/marshall roles (`auth.jwt() ->> 'role' = 'admin'`).
  - Drop the public update policy on `kinkster_profiles`. Ensure users can only update their own profile (`auth.uid() = id`), with sensitive flags (`is_in_person_vetted`, `is_id_verified`) strictly modifiable only via admin/service role functions.
  - Scope `kinkster_ephemeral_messages` select policies to only participants of the corresponding chamber.

---

### [Critical] Finding 2: Ghost Certification & Profile Bypass on JSON QR Tokens
- **What**: Malformed or crafted JSON QR tokens allow unauthenticated or nonexistent users to be certified as `success: true`.
- **Where**: `app/api/admin/gatherings/verify-in-person/route.ts`, lines 94–101, 129, 148, 166, 174–257:
  ```typescript
  try {
    if (cleanToken.startsWith('{') && cleanToken.endsWith('}')) {
      const parsed = JSON.parse(cleanToken);
      cleanToken = parsed.token || parsed.qr_secret_token || parsed.userId || cleanToken;
      if (parsed.userId) targetUserId = parsed.userId;
      if (parsed.appId) targetAppId = parsed.appId;
    }
  } catch {}
  ```
- **Why**:
  - If a QR payload contains `{"userId": "00000000-0000-0000-0000-000000000000"}` (or any UUID not present in the database), `targetUserId` is populated directly.
  - Because `targetUserId` is already set, all lookup queries in `sanctuary_event_applications`, `kinkster_profiles`, and `guest_profiles` (lines 129, 148, 166) are skipped.
  - At line 180, `kinksterProfile` and `guestProfile` queries both return `null`.
  - The route does NOT verify whether a profile was found; it continues down to line 257 and returns:
    ```json
    {
      "success": true,
      "userAlias": "member_000000",
      "userId": "00000000-0000-0000-0000-000000000000",
      "isInPersonVetted": true,
      "message": "Level 2 Physical Vetting Confirmed for @member_000000"
    }
    ```
  - The scanner displays "Level 2 Certified ✓" and sounds the chime, despite no user profile existing or being updated in the database.
- **Suggestion**:
  - Do not trust unverified `userId` from QR JSON payloads without validating against the database.
  - Check `if (!kinksterProfile && !guestProfile)` after profile resolution; if no existing profile is matched, return a 404 Not Found error: `{ error: 'Attendee profile not found in system.' }`.

---

### [Major] Finding 3: Missing Rate Limiting on 4-Digit Marshall PIN
- **What**: `/api/admin/gatherings/verify-in-person` has no brute-force protection or rate limiting on `marshallPin`.
- **Where**: `app/api/admin/gatherings/verify-in-person/route.ts`, lines 39–82.
- **Why**:
  - A 4-digit numeric PIN has only 10,000 possibilities (`0000` to `9999`).
  - Without IP/identifier rate limiting or failed attempt lockouts, an automated script can enumerate all 10,000 combinations in under 2 minutes, acquiring full Marshall certification privileges.
- **Suggestion**:
  - Implement a basic in-memory or Redis-backed rate limiter on failed PIN attempts (e.g. 5 failed attempts locks the IP/route for 15 minutes), or log and delay responses by 1000ms upon failed authorization attempts to deter automated brute force.

---

### [Major] Finding 4: Client PIN Gate Facade & Premature Unlock
- **What**: The client PIN prompt unlocks for any string of length >= 4, misleading the Marshall.
- **Where**: `app/admin/marshall-scanner/page.tsx`, line 75:
  ```typescript
  if (pin.trim() === '1991' || pin.trim().length >= 4) {
    setIsUnlocked(true);
    triggerHaptic('success');
    toast.success('Marshall Security Mode Active');
  }
  ```
- **Why**:
  - If a Marshall accidentally types "0000" or a wrong PIN, the UI responds with "Marshall Security Mode Active", plays a success haptic, and activates the camera viewfinder.
  - When the Marshall scans an attendee, the backend rejects with 401 Unauthorized (`"Invalid Marshall Security PIN"`).
  - The Marshall has no clear indication that their entered PIN was invalid upon unlock; it fails only when an attendee is already standing in front of them waiting to enter.
- **Suggestion**:
  - Validate the PIN against a server verification endpoint (or verify against `MARSHALL_SECURITY_PIN` via an auth check API) before transitioning `isUnlocked` to true.

---

### [Major] Finding 5: Level 1 ID Verification Failure Does Not Gate Certification
- **What**: Attendees without Level 1 ID verification are certified as Level 2 with full green affirmative indicators.
- **Where**: `app/api/admin/gatherings/verify-in-person/route.ts`, lines 197–224, and `app/admin/marshall-scanner/page.tsx`, lines 355–385.
- **Why**:
  - Requirement R1 explicitly specifies: *"Confirms Level 1 Aadhaar/Passport ID is verified on file. Instantly updates Supabase database (`profiles.is_in_person_vetted = true`)"*.
  - When `isIdVerified === false`, the API still executes `is_in_person_vetted: true` and returns `success: true`.
  - The UI presents a large green badge (`Level 2 Certified ✓`), triggers `marshallSuccess` triple haptics (`vibrate([40, 60, 40])`), and plays the golden success chime. The only mention of unverified Level 1 status is a small grey subtext: `ID Checked: Pending`.
  - In a dimly lit venue, Marshalls rely on haptics, chimes, and green screen feedback. An unvetted guest will be waved in without ever having their government ID inspected.
- **Suggestion**:
  - If `isIdVerified` is false:
    - Return a warning status or require an explicit query flag `marshallVerifiedGovId: true` to confirm the Marshall inspected physical government ID on the floor.
    - On the scanner UI, display an amber/orange warning screen (`"PHYSICAL ID CHECK REQUIRED - Level 1 ID Not On File"`) with a dedicated "Confirm Physical ID & Certify" button rather than auto-certifying.

---

### [Minor] Finding 6: Memory & Timer Leak in Scanner Loop
- **What**: `startScanningLoop` interval is never cleared when stopping the camera or unmounting the component.
- **Where**: `app/admin/marshall-scanner/page.tsx`, lines 102, 113–128, 131–174.
- **Why**:
  - `startScanningLoop()` returns `() => clearInterval(interval)`, but `startCamera()` does not retain or invoke this cleanup function.
  - `stopCamera()` only stops MediaStream tracks and does not clear the interval.
  - Toggling or retrying the camera spawns multiple concurrent 200ms interval loops that continue running indefinitely in the background.
- **Suggestion**:
  - Store the interval ID in a `useRef<NodeJS.Timeout | null>(null)` and clear it in `stopCamera()` and the `useEffect` cleanup.

---

## 3. Adversarial Challenges & Stress Tests

### Challenge 1: Unrestricted PostgREST Modification Attack
- **Assumption Challenged**: Database RLS prevents unauthorized privilege escalation.
- **Attack Scenario**: An unverified attendee intercepts the Supabase URL and anon key from client JavaScript bundles, then sends a PATCH request directly to `https://amlxlguebzkszkwkzroe.supabase.co/rest/v1/kinkster_profiles?id=eq.<their-uuid>` with `{"is_in_person_vetted": true}`.
- **Blast Radius**: Full bypass of physical vetting. Any user can self-certify without ever attending a gathering or meeting a Consent Marshall.
- **Result**: **VULNERABLE** due to `CREATE POLICY "Public update for kinkster_profiles" ... FOR UPDATE TO public USING (true)`.

### Challenge 2: Non-existent User JSON Injection Attack
- **Assumption Challenged**: The API route only certifies legitimate registered members.
- **Attack Scenario**: An attacker generates a QR code containing `{"userId": "11111111-1111-1111-1111-111111111111"}` and presents it to the Marshall.
- **Blast Radius**: False positive certification banner on scanner, corrupt audit records inserted into `gathering_vettings`.
- **Result**: **VULNERABLE**. Route returns HTTP 200 `{ success: true, userAlias: "member_111111", isInPersonVetted: true }`.

### Challenge 3: PIN Enumeration / Brute-Force Attack
- **Assumption Challenged**: 4-digit PIN is sufficient to protect Marshall access on public endpoints.
- **Attack Scenario**: An attacker runs `wfuzz` or a simple Python script attempting 0000–9999 against `/api/admin/gatherings/verify-in-person`.
- **Blast Radius**: Attacker identifies PIN (e.g. 1991), gains unauthorized access to certify anyone and check in attendees.
- **Result**: **VULNERABLE**. No lockout or rate limit.

---

## 4. Verified Claims

| Claim from Worker | Verification Method | Result | Notes |
|---|---|---|---|
| `next.config.js` Permissions-Policy updated to `camera=(self), microphone=(self)` | `view_file next.config.js` | **PASS** | Line 53 correctly configured |
| `pnpm test` (`tsc --noEmit`) passes with 0 errors | `run_command pnpm test` | **PASS** | Exit code 0, 0 type errors |
| Marshall Scanner interface implemented at `/admin/marshall-scanner` | `view_file app/admin/marshall-scanner/page.tsx` | **PASS** | Implemented with PIN prompt, video stream, and fallback input |
| Dual-engine QR decoder with `BarcodeDetector` and `jsqr` | `view_file lib/scanner/qrFallback.ts` | **PASS** | `decodeQRFromVideo` with Canvas & `jsQR` |
| Triple haptic pulse `vibrate([40, 60, 40])` | `view_file lib/haptics.ts` | **PASS** | `marshallSuccess` pattern defined and triggered |
| Staff launchers in `EventDossierModal` and `AdminEventsHub` | `grep_search` & `view_file` | **PASS** | Launchers present in both components |
| `PROJECT.md` Interface Contract adherence | Code inspection of `route.ts` vs `PROJECT.md` | **PASS** | Request & response shapes match spec |

---

## 5. Coverage Gaps & Unverified Items

- **Physical Device Testing**: Camera stream was verified via code inspection and typecheck; physical camera hardware tests on physical iOS Safari / Android Chrome devices cannot be executed in this headless environment.
- **Live Supabase DB Execution**: Database connection and migration existence was verified via SQL migration scripts and handoff metadata, but remote SQL execution was not directly altered (per Reviewer constraint: review-only).

---

## 6. Required Remediation Actions

Before Milestone 1 can be approved:
1. **Fix RLS Migration**: Remove `FOR UPDATE TO public` on `kinkster_profiles` and `FOR ALL TO public` on `gathering_vettings`. Ensure only service role / admin can update vetting status.
2. **Fix Ghost Certification**: In `/api/admin/gatherings/verify-in-person/route.ts`, verify that `kinksterProfile` or `guestProfile` actually exists in the database before returning `success: true`. Return 404 if profile is missing.
3. **Handle Missing Level 1 ID**: When `isIdVerified === false`, display an explicit amber warning on the scanner requiring physical ID inspection, and require confirmation rather than auto-certifying.
4. **Fix Client PIN Unlock Facade**: Do not unlock client on arbitrary 4-character input; validate against expected PIN or server status.
5. **Clear Scanner Loop Interval**: In `app/admin/marshall-scanner/page.tsx`, ensure `clearInterval` is called when camera is stopped or component unmounts.
