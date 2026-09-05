# Milestone 1 Adversarial Challenge Report: Scanner Fallback, Permissions Policy & Haptics

**Agent**: `m1_challenger_2`  
**Role**: Empirical Challenger (critic, specialist)  
**Milestone**: Milestone 1 (Requirement R1)  
**Timestamp**: 2026-09-04T19:32:00Z  
**Explicit Verdict**: **`APPROVE`**

---

## 1. Challenge Summary

**Overall Risk Assessment**: **LOW**

The Milestone 1 implementation was subjected to an empirical adversarial challenge suite comprising 31 automated test scenarios executed directly against live runtime and mock environments. All 31 tests passed cleanly, and `pnpm test` (`tsc --noEmit`) confirmed 0 compilation errors across the repository.

| Domain | Tested Aspect | Target File | Result | Risk Level |
|---|---|---|:---:|:---:|
| **Scanner Fallback** | Degraded video inputs, 0x0 dims, buffer underruns, solid black/white, noise, inverted QR, SSR, canvas context loss | `lib/scanner/qrFallback.ts` | **PASS (15/15)** | LOW |
| **Permissions Policy** | `camera=(self)`, `microphone=(self)`, `geolocation=()`, universal route matching, W3C spec conformance | `next.config.js` | **PASS (9/9)** | LOW |
| **Haptic Engine** | `[40, 60, 40]` pattern execution, SSR safety, iOS Safari fallback, `NotAllowedError` absorption | `lib/haptics.ts`, `app/admin/marshall-scanner/page.tsx` | **PASS (7/7)** | LOW |
| **Type Integrity** | TypeScript full project typecheck | Root project (`tsconfig.json`) | **PASS (0 errors)** | LOW |

---

## 2. Adversarial Challenges & Findings

### [Low / Advisory] Challenge 1: Error Boundary in `decodeQRFromVideo` Canvas Operations
- **Assumption Challenged**: `ctx.drawImage` and `ctx.getImageData` will never throw exceptions prior to reaching `jsQR(...)`.
- **Attack Scenario**: If a video source is cross-origin without CORS headers (tainting the canvas) or the video element encounters an unplayable/decoding hardware failure during frame capture, `ctx.getImageData()` throws a `DOMException` (`SecurityError` or `InvalidStateError`). In `lib/scanner/qrFallback.ts` lines 28–29:
  ```typescript
  ctx.drawImage(video, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);

  try {
    const code = jsQR(imageData.data, imageData.width, imageData.height, ...);
    return code?.data || null;
  } catch {
    return null;
  }
  ```
  `ctx.drawImage` and `ctx.getImageData` reside *outside* the `try...catch` block.
- **Empirical Observation**: In `app/admin/marshall-scanner/page.tsx` line 157–161, the scanning loop wraps `decodeQRFromVideo(videoRef.current)` in an outer `try...catch` block:
  ```typescript
  if (!detectedValue && videoRef.current) {
    try {
      detectedValue = decodeQRFromVideo(videoRef.current);
    } catch {
      // Ignore fallback decode errors
    }
  }
  ```
  Because the caller explicitly swallows decode errors, the application does not crash in production.
- **Blast Radius**: Zero in `marshall-scanner`. Potential unhandled exception if a future caller invokes `decodeQRFromVideo` without their own try/catch block.
- **Mitigation (Recommended for future refactor)**: Move lines 28–29 inside the `try...catch` block within `decodeQRFromVideo`.

### [Informational] Challenge 2: Duplicate Vibration Call in `marshall-scanner/page.tsx`
- **Assumption Challenged**: Calling both `triggerHaptic('marshallSuccess')` and direct `navigator.vibrate([40, 60, 40])` could cause conflicting vibration intervals or stutter.
- **Attack Scenario**: Lines 199–204 of `app/admin/marshall-scanner/page.tsx`:
  ```typescript
  triggerHaptic('marshallSuccess');
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([40, 60, 40]);
    } catch {}
  }
  ```
- **Empirical Observation**: Per W3C Vibration API specification (Section 4), invoking `navigator.vibrate()` cancels any active vibration pattern and immediately begins the new pattern. Because both invocations provide the exact same pattern `[40, 60, 40]`, the second call restarts the 40ms pulse at t=0ms. Test 3.7 demonstrated that both invocations execute safely with zero errors across all browser and headless profiles.
- **Blast Radius**: None.
- **Mitigation**: Purely cosmetic cleanup in future cleanup passes; current behavior is resilient and fully functional.

### [Informational] Challenge 3: Inverted QR Code Decoding Support
- **Assumption Challenged**: Attendance badges displayed on dark-mode mobile screens (white modules on dark background) might fail to decode in low-light Sanctuary environments.
- **Stress Test**: Synthesized an inverted QR code buffer (`bg = 0`, `fg = 255`) with text `https://nothingness.app/inverted-token`.
- **Result**: `decodeQRFromImageData` decoded the inverted payload in under 2ms because `jsQR` is configured with `{ inversionAttempts: 'attemptBoth' }`.

---

## 3. Empirical Stress Test Results

Executed via automated test runner: `npx tsx tests/adversarial-m1-scanner-haptics.test.ts`

### Section 1: Scanner Fallback Degraded Conditions (`lib/scanner/qrFallback.ts`)
| Test ID | Scenario | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|:---:|
| 1.1 | Valid standard QR code (URL) | Decodes exact string | Decodes `https://nothingness.app/guest/elena-1991` | **PASS** |
| 1.2 | Complex JSON Sanctuary Pass Token | Decodes exact JSON string | Decodes 77-byte JSON payload | **PASS** |
| 1.3 | Inverted QR Code (white-on-black) | Decodes successfully | Decodes `https://nothingness.app/inverted-token` | **PASS** |
| 1.4 | Solid black image (dark room/covered lens) | Returns `null`, no crash | Returned `null` (0ms) | **PASS** |
| 1.5 | Solid white image (sensor glare) | Returns `null`, no crash | Returned `null` (0ms) | **PASS** |
| 1.6 | High-entropy random noise frame | Returns `null`, no crash | Returned `null` (1ms) | **PASS** |
| 1.7 | Buffer length underrun (corrupted slice) | Caught by try-catch -> `null` | Returned `null` (0ms) | **PASS** |
| 1.8 | 0x0 degenerate dimensions buffer | Returns `null`, no crash | Returned `null` (0ms) | **PASS** |
| 1.9 | `decodeQRFromVideo(null / undefined)` | Returns `null` immediately | Returned `null` (0ms) | **PASS** |
| 1.10 | Video `readyState < 2` (0 or 1) | Returns `null` immediately | Returned `null` (0ms) | **PASS** |
| 1.11 | Video `videoWidth === 0` or `videoHeight === 0` | Returns `null` immediately | Returned `null` (0ms) | **PASS** |
| 1.12 | SSR environment (`document === undefined`) | Returns `null` safely | Returned `null` (0ms) | **PASS** |
| 1.13 | Full canvas pipeline frame extraction | Draws & extracts QR string | Extracted `https://nothingness.app/resilience-check` | **PASS** |
| 1.14 | Canvas context creation failure (`getContext => null`) | Returns `null` safely | Returned `null` (0ms) | **PASS** |
| 1.15 | Canvas `SecurityError` (tainted frame) | Caller try-catch absorbs error | Safely absorbed by caller try-catch | **PASS** |

### Section 2: Permissions-Policy Configuration (`next.config.js`)
| Test ID | Scenario | Expected Directive | Evaluated Directive | Result |
|---|---|---|---|:---:|
| 2.1 | `next.config.js` export format | `async headers()` function | Returns array of route rules | **PASS** |
| 2.2 | Universal route match | `source: '/(.*)'` present | Verified `/(.*)` rule active | **PASS** |
| 2.3 | Header presence | `Permissions-Policy` header key | Present in headers list | **PASS** |
| 2.4 | Camera permission | `camera=(self)` | Present and matches regex | **PASS** |
| 2.5 | Microphone permission | `microphone=(self)` | Present and matches regex | **PASS** |
| 2.6 | Geolocation permission | `geolocation=()` | Disabled with empty tuple | **PASS** |
| 2.7 | Adversarial: Camera not disabled | `camera` is NOT `()` | Confirmed `camera` is not disabled | **PASS** |
| 2.8 | Adversarial: Microphone not disabled | `microphone` is NOT `()` | Confirmed `microphone` is not disabled | **PASS** |
| 2.9 | Security: Origin scoping | Restricted to `(self)`, not `*` | Prevents iframe camera hijacking | **PASS** |

### Section 3: Haptic Feedback Engine (`lib/haptics.ts`)
| Test ID | Scenario | Expected Invocation | Evaluated Invocation | Result |
|---|---|---|---|:---:|
| 3.1 | Marshall success pattern | `navigator.vibrate([40, 60, 40])` | Exact match `[40, 60, 40]` | **PASS** |
| 3.2 | SSR environment (`window === undefined`) | No-op, 0 exceptions | Safe return, 0 exceptions | **PASS** |
| 3.3 | iOS Safari (`'vibrate' in navigator === false`) | No-op, 0 exceptions | Safe return, 0 exceptions | **PASS** |
| 3.4 | User activation required (`NotAllowedError`) | Caught by internal try-catch | Swallowed safely, 0 exceptions | **PASS** |
| 3.5 | Vibration disabled in OS (`vibrate() => false`) | Returns cleanly | Handled without error | **PASS** |
| 3.6 | Default parameter invocation | Defaults to `'light'` (10ms) | Invocated with `10` | **PASS** |
| 3.7 | Marshall Scanner page success sequence | Consecutive `[40, 60, 40]` | Both emit `[40, 60, 40]` safely | **PASS** |

---

## 4. Unchallenged Areas

- **Physical Optical Camera Sensor Performance**: Hardware auto-focus lag and low-light ambient lumens on actual physical phone cameras were tested via synthetic pixel data and frame mockers rather than physical hardware.
- **Physical Mobile Haptic Motor Actuators**: The exact resonant frequency (e.g. Apple Taptic Engine vs Android ERM/LRA) depends on mobile device hardware; software layer adherence to the W3C Vibration API specification was verified.

---

## 5. Explicit Verdict

### **`APPROVE`**

Milestone 1 satisfies all adversarial criteria:
1. Canvas extraction in `lib/scanner/qrFallback.ts` handles degraded, inverted, malformed, and corrupted image buffers without crashing.
2. `next.config.js` properly configures `Permissions-Policy` with `camera=(self)` and `microphone=(self)`.
3. The haptics pattern `[40, 60, 40]` executes accurately and falls back gracefully in SSR, iOS Safari, and non-supporting browsers.
4. `pnpm test` (`tsc --noEmit`) passes with 0 errors.
