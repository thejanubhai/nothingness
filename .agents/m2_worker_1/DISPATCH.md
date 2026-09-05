# Dispatch: m2_worker_1

**Mission**: Implement Milestone 2 (M2) — Stealth Mode, OS App-Switcher Privacy Shield & Panic Camouflage (Requirement R2).

**Mandatory Reading**:
- `c:\Users\hudav\Documents\GitHub\nothingness\ORIGINAL_REQUEST.md` (read first)
- `c:\Users\hudav\Documents\GitHub\nothingness\PROJECT.md`
- `c:\Users\hudav\Documents\GitHub\nothingness\.agents\survey_explorer_1\report.md`
- `c:\Users\hudav\Documents\GitHub\nothingness\.agents\survey_explorer_2\report.md`

**MANDATORY INTEGRITY WARNING**:
> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

**File Ownership**:
- You own:
  - `components/StealthPrivacyShield.tsx`
  - `components/Header.tsx`

**Scope of Work**:
1. **OS App-Switcher Privacy Shield (`components/StealthPrivacyShield.tsx`)**:
   - Ensure event listeners hook into `document.addEventListener('visibilitychange')`, `window.addEventListener('pagehide')`, AND `window.addEventListener('blur')`.
   - When blurred/hidden, render an opaque dark noir screen featuring the minimalist Nothingness geometric crest ("N" emblem) and "Nothingness • Confidential".
   - Restores immediately upon `window.addEventListener('focus')` or `visibilitychange === 'visible'`.
2. **Panic Camouflage Trigger (`components/Header.tsx`)**:
   - Double-tapping or rapid double-clicking the top Nothingness crest logo in `components/Header.tsx` dispatches `window.dispatchEvent(new CustomEvent('trigger-panic-mode'))`.
   - Add touch event tracking for mobile double-tap (<350ms between taps on the logo).
3. **Panic Camouflage Screen & Restore (`components/StealthPrivacyShield.tsx`)**:
   - In response to `trigger-panic-mode` or rapid device shake (`devicemotion`), switch UI immediately to neutral "Noir Notes" minimalist memo pad.
   - Discreet 700ms long-press on the memo pad footer ("Encrypted with Obsidian" or notes footer) unlocks and restores the active session.
   - Fire subtle haptic feedback if available.
4. **Verification**:
   - Run `pnpm test` (`tsc --noEmit`) to verify 0 errors.

**Output**:

## 2026-09-04T19:27:30Z
You are m2_worker_1.
Your working directory: c:\Users\hudav\Documents\GitHub\nothingness\.agents\m2_worker_1
Your parent orchestrator: teamwork_preview_orchestrator_1 (Conversation ID: 02c3aaab-5fbc-45c0-823f-14bab9365c11)

MANDATORY FIRST STEP:
Read c:\Users\hudav\Documents\GitHub\nothingness\ORIGINAL_REQUEST.md, c:\Users\hudav\Documents\GitHub\nothingness\PROJECT.md, and c:\Users\hudav\Documents\GitHub\nothingness\.agents\m2_worker_1\DISPATCH.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

TASK:
Implement Milestone 2: Stealth Mode, OS App-Switcher Privacy Shield & Panic Camouflage (Requirement R2).
1. In `components/StealthPrivacyShield.tsx`:
   - Hook into `visibilitychange`, `pagehide`, and `blur`.
   - In multitasking drawer or when blurred, replace DOM viewport with opaque dark noir screen featuring Nothingness geometric crest ("N" emblem) and "Nothingness • Confidential".
   - Rapid shake (`devicemotion`) or event `trigger-panic-mode` transitions UI immediately to neutral "Noir Notes" memo pad.
   - 700ms discreet long-press on notes footer restores active session.
2. In `components/Header.tsx`:
   - Add double-tap and double-click handler on Nothingness crest logo to dispatch `window.dispatchEvent(new CustomEvent('trigger-panic-mode'))`.
3. Verify changes with `pnpm test` (`tsc --noEmit`).

Write your progress to c:\Users\hudav\Documents\GitHub\nothingness\.agents\m2_worker_1\progress.md
Write your handoff to c:\Users\hudav\Documents\GitHub\nothingness\.agents\m2_worker_1\handoff.md
Send a completion message back to parent when done.

