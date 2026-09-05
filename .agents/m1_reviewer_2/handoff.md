# Milestone 1 Handoff Report: Security & Adversarial Review

**Agent**: `m1_reviewer_2`  
**Milestone**: M1 (Level 2 In-Person Vetting QR Scanner — R1)  
**Parent Orchestrator**: `teamwork_preview_orchestrator_1` (`02c3aaab-5fbc-45c0-823f-14bab9365c11`)  
**Date**: 2026-09-04T19:31:00Z  

---

## 1. Observation

1. **Test Execution**:
   Command: `pnpm test` (`tsc --noEmit`)
   Exit Code: `0`
   Output:
   ```
   > temp_app@0.1.0 test C:\Users\hudav\Documents\GitHub\nothingness
   > tsc --noEmit
   ```
   Zero TypeScript compilation errors across all files.

2. **Insecure RLS Policies in Migration**:
   File: `supabase/migrations/20260905000001_gathering_vettings_and_l2_certification.sql`
   - Lines 25–26:
     ```sql
     CREATE POLICY "Admins and Marshalls manage vettings" ON public.gathering_vettings
         FOR ALL TO public USING (true) WITH CHECK (true);
     ```
   - Lines 56–59:
     ```sql
     CREATE POLICY "Public update for kinkster_profiles" ON public.kinkster_profiles 
         FOR UPDATE TO public USING (true) WITH CHECK (true);
     ```
   - Lines 126–128:
     ```sql
     CREATE POLICY "Allow members read ephemeral messages" ON public.kinkster_ephemeral_messages 
         FOR SELECT TO authenticated USING (true);
     ```

3. **Ghost Certification on Nonexistent / Craft JSON Tokens**:
   File: `app/api/admin/gatherings/verify-in-person/route.ts`
   - Lines 94–101:
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
   - Lines 129, 148, 166: `if (!targetUserId)` guards skip database searches when `targetUserId` is populated.
   - Lines 180–194: If `targetUserId` does not exist in DB, `kinksterProfile` and `guestProfile` are `null`.
   - Line 257:
     ```typescript
     return NextResponse.json({
       success: true,
       userAlias,
       userId: targetUserId,
       eventTitle,
       isIdVerified,
       isInPersonVetted: true,
       checkedInAt: now,
       certifiedBy: marshallAlias,
       message: `Level 2 Physical Vetting Confirmed for @${userAlias}`,
     });
     ```
     Returns `success: true` and `isInPersonVetted: true` without an existing profile or updated database record.

4. **Client PIN Gate Behavior**:
   File: `app/admin/marshall-scanner/page.tsx`
   - Lines 73–83:
     ```typescript
     const handleUnlockWithPin = (e: React.FormEvent) => {
       e.preventDefault();
       if (pin.trim() === '1991' || pin.trim().length >= 4) {
         setIsUnlocked(true);
         triggerHaptic('success');
         toast.success('Marshall Security Mode Active');
       } else {
         triggerHaptic('warning');
         toast.error('Invalid Marshall Security PIN');
       }
     };
     ```
     Unlocks the scanner viewfinder for any input >= 4 characters.

5. **Level 1 ID Verification Handling**:
   File: `app/api/admin/gatherings/verify-in-person/route.ts`
   - Lines 197–224: Unconditionally executes `is_in_person_vetted: true` and `in_person_vetted: true` on profiles even when `isIdVerified` is `false`.
   File: `app/admin/marshall-scanner/page.tsx`
   - Lines 355–385: Displays green `Level 2 Certified ✓`, triggers success chime and `marshallSuccess` triple haptics even when `lastScannedResult.isIdVerified` is `false`.

6. **Interval Accumulation in Scanner**:
   File: `app/admin/marshall-scanner/page.tsx`
   - Lines 102, 113–119, 131–174: `startScanningLoop` interval return is ignored by `startCamera()`, and `stopCamera()` does not clear the interval.

---

## 2. Logic Chain

1. **Observation 1 & 2 -> Critical Security Risk**: While the TypeScript compiler passes without errors (Observation 1), the migration introduces policies that permit `public` (unauthenticated anonymous clients) to execute `UPDATE` operations on `kinkster_profiles` and manage all rows in `gathering_vettings` (Observation 2). Because the API route runs on the server using `createAdminClient()` (Supabase service role), it does not depend on public RLS permissions. Exposing unrestricted public updates allows any internet user to self-certify `is_in_person_vetted = true` directly through PostgREST, neutralizing the physical Marshall vetting requirement.
2. **Observation 3 -> Critical Logic Defect**: Accepting an unverified `userId` from JSON QR tokens without verifying that the user profile actually exists in the database causes the route handler to report `success: true` and `isInPersonVetted: true` for phantom accounts. A malicious actor can present a QR code with an arbitrary UUID to gain physical entry to a gathering without having any record in the system.
3. **Observation 4 -> Major UX & Security Inconsistency**: Unlocking the client UI when `pin.trim().length >= 4` creates a false sense of authorization. If a Marshall enters an incorrect 4-digit code (e.g. `0000`), the UI indicates success but every scan will fail at the API level with HTTP 401.
4. **Observation 5 -> Requirement Incomplete**: Requirement R1 requires verifying that Level 1 government ID is on file before granting Level 2 physical vetting. Elevating unverified attendees to Level 2 without an explicit override or warning screen allows unvetted individuals into physical sanctuaries.
5. **Observation 6 -> Quality / Stability Defect**: Failing to clean up `setInterval` on camera stop or unmount leaks CPU and battery resources on mobile devices.

---

## 3. Caveats

- In headless review environments, physical camera hardware cannot be tested; verification was performed via source inspection, static analysis, and TypeScript compilation.
- Reviewer is constrained to review-only and cannot directly edit implementation files or execute destructive database migrations.
- Detailed challenge scenarios, blast radius assessments, and mitigation recommendations are documented in `c:\Users\hudav\Documents\GitHub\nothingness\.agents\m1_reviewer_2\report.md`.

---

## 4. Conclusion

**Verdict**: **`REQUEST_CHANGES`**

Milestone 1 satisfies the user interface scaffolding, dual QR engine decoding with canvas fallback, Permissions-Policy headers, and TypeScript interface contracts. However, changes are requested due to:
1. **Critical Integrity Violation / Security Hole**: Public update and manage RLS policies on `kinkster_profiles` and `gathering_vettings`.
2. **Critical Ghost Certification Bug**: JSON QR tokens with non-existent user IDs return `success: true`.
3. **Major Edge Case Handling**: Lack of brute-force rate limiting on Marshall PIN, client PIN gate unlocking on arbitrary 4-character inputs, and Level 1 ID bypass during Level 2 certification.
4. **Resource Leak**: Uncleaned scanning interval in the camera viewfinder component.

---

## 5. Verification Method

To independently verify these findings:

1. **Verify TypeScript Build**:
   ```bash
   pnpm test
   ```
   Expected: Exit code 0 (Pass).

2. **Inspect Vulnerable RLS Policy**:
   Open `supabase/migrations/20260905000001_gathering_vettings_and_l2_certification.sql` and observe lines 25 and 56.
   Verify that `FOR UPDATE TO public USING (true)` and `FOR ALL TO public USING (true)` are present.

3. **Inspect Ghost Certification Flow**:
   Open `app/api/admin/gatherings/verify-in-person/route.ts` at line 98 and trace execution when `token = '{"userId": "00000000-0000-0000-0000-000000000000"}'`.
   Observe that `kinksterProfile` is null, `guestProfile` is null, yet line 257 returns `success: true`.

4. **Inspect Scanner Timer Leak**:
   Open `app/admin/marshall-scanner/page.tsx` at line 102 and 113.
   Observe that `startScanningLoop()` returns a cleanup function that is discarded, and `stopCamera()` has no reference to the interval ID.
