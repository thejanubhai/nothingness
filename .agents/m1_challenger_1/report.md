# Adversarial Stress-Test & Challenge Report: Milestone 1 Verify-In-Person API

**Agent**: `m1_challenger_1` (Empirical Challenger)  
**Milestone**: M1 (Requirement R1: Level 2 In-Person Vetting QR Scanner & Audit Trail)  
**Target Route**: `app/api/admin/gatherings/verify-in-person/route.ts`  
**Database**: Supabase PostgreSQL (`gathering_vettings`, `kinkster_profiles`, `guest_profiles`)  
**Timestamp**: 2026-09-04T19:33:30Z  

---

## Verdict: `REQUEST_CHANGES`

While the core happy paths (PIN authentication, default alias matching, double check-in, and audit logging into `gathering_vettings`) succeed under typical conditions, empirical adversarial stress testing surfaced **two confirmed security and stability defects**:
1. **CRITICAL**: PostgREST Filter Injection in `.or()` clause via comma delimiter allowing unauthorized/arbitrary attendee certification.
2. **MEDIUM**: Server crash (`TypeError: cleanToken.startsWith is not a function` returning HTTP 500) when a scanned JSON QR payload contains a non-string token property.

---

## Challenge Summary

**Overall Risk Assessment**: **HIGH**

- Total Tests Executed: **29**
- Tests Passed: **27** (93.1%)
- Tests Failed: **2** (6.9%)
- Database Audit Trail Verified: **YES** (`gathering_vettings` records correctly with timestamps and marshall alias).
- Idempotency / Double Check-In Verified: **YES** (multiple scans succeed and log separate timestamped audit records).
- Typecheck (`pnpm test` / `tsc --noEmit`): **PASSED** (0 errors).

---

## Challenges & Confirmed Failure Modes

### [Critical] Challenge 1: PostgREST Filter Injection via Comma-Delimited Adversarial Token

- **Assumption Challenged**: The code assumes `cleanToken` and `cleanTokenWithoutAt` can be safely interpolated directly into PostgREST `.or(...)` filter strings:
  ```typescript
  // route.ts:137
  kpQuery = kpQuery.or(`alias.ilike.${cleanToken},alias.ilike.${cleanTokenWithoutAt}`);
  // route.ts:157
  guestQuery = guestQuery.or(`phone.eq.${cleanToken},phone_number.eq.${cleanToken},document_number.eq.${cleanToken}`);
  ```
- **Attack Scenario**: PostgREST's `.or()` syntax interprets commas as logical OR delimiters separating conditions. If an attacker presents a QR code or manual input with an arbitrary string containing commas and PostgREST operators, e.g.:
  `ghost,id.neq.00000000-0000-0000-0000-000000000000`
  The resulting query sent to PostgREST becomes:
  ```
  alias.ilike.ghost,id.neq.00000000-0000-0000-0000-000000000000,alias.ilike.ghost,id.neq.00000000-0000-0000-0000-000000000000
  ```
  Because `id != '00000000-0000-0000-0000-000000000000'` evaluates to TRUE for all existing database records, PostgREST returns the first user profile in the database (`lucifer`), which is then immediately certified as Level 2 In-Person Vetted!
- **Empirical Reproduction**:
  Executed against live endpoint via `tests/test-filter-injection.ts`:
  - Request: `{ "token": "ghost,id.neq.00000000-0000-0000-0000-000000000000", "marshallPin": "1991" }`
  - Result: **HTTP 200 OK**
  - Response payload:
    ```json
    {
      "success": true,
      "userAlias": "lucifer",
      "userId": "024e5001-02f7-4530-8c84-c41556db1eab",
      "isIdVerified": true,
      "isInPersonVetted": true,
      "message": "Level 2 Physical Vetting Confirmed for @lucifer"
    }
    ```
- **Blast Radius**: An attacker with any invalid or unrecognized QR ticket can forge a filter injection payload that matches and certifies legitimate sanctuary members without their physical presence or authentic QR pass.
- **Suggested Mitigation**:
  Sanitize `cleanToken` and `cleanTokenWithoutAt` before embedding them into `.or()` strings. Reject or strip commas `,` and parentheses `()`, or enforce a strict whitelist regex on aliases (e.g. `^[a-zA-Z0-9_.-]+$`).

---

### [Medium] Challenge 2: Type Confusion Crash on Non-String JSON QR Payloads

- **Assumption Challenged**: The code assumes `parsed.token`, `parsed.qr_secret_token`, or `parsed.userId` in a parsed JSON payload is always a string:
  ```typescript
  // route.ts:97
  cleanToken = parsed.token || parsed.qr_secret_token || parsed.userId || cleanToken;
  ...
  // route.ts:103
  const cleanTokenWithoutAt = cleanToken.startsWith('@') ? cleanToken.slice(1) : cleanToken;
  ```
- **Attack Scenario**: If an attendee scans a QR code containing valid JSON with a numeric or non-string token, e.g.:
  `{ "token": 99999 }`
  `cleanToken` is assigned the number `99999`. Line 103 calls `cleanToken.startsWith('@')`, which throws an unhandled `TypeError: cleanToken.startsWith is not a function`.
- **Empirical Reproduction**:
  Executed against live endpoint via `tests/test-type-confusion.ts`:
  - Request: `{ "token": "{\"token\": 99999}", "marshallPin": "1991" }`
  - Result: **HTTP 500 Internal Server Error**
  - Verbatim Server Log:
    ```
    In-Person Vetting Error: TypeError: cleanToken.startsWith is not a function
        at POST (app/api/admin/gatherings/verify-in-person/route.ts:103:44)
    ```
- **Blast Radius**: Scanning malformed or non-string QR tokens causes 500 errors on the Marshall Scanner interface, interrupting the check-in line and degrading reliability.
- **Suggested Mitigation**:
  Ensure `cleanToken` is explicitly cast to a string after extracting properties from `parsed`:
  ```typescript
  if (parsed.token !== undefined) cleanToken = String(parsed.token).trim();
  else if (parsed.qr_secret_token !== undefined) cleanToken = String(parsed.qr_secret_token).trim();
  else if (parsed.userId !== undefined) cleanToken = String(parsed.userId).trim();
  ```

---

## Stress Test Results (29 Test Scenarios)

| # | Test Scenario | Expected Behavior | Actual Behavior | Result |
|---|---------------|-------------------|-----------------|:------:|
| 1.1 | Valid default PIN `1991` with valid alias | HTTP 200, certified by PIN 1991 | HTTP 200, `certifiedBy: "Consent Marshall (PIN 1991)"` | **PASS** |
| 1.2 | Invalid PIN `0000` | HTTP 401 Unauthorized | HTTP 401, `"Unauthorized. Invalid Marshall Security PIN..."` | **PASS** |
| 1.3 | Missing PIN field | HTTP 401 Unauthorized | HTTP 401, `"Unauthorized. Invalid Marshall Security PIN..."` | **PASS** |
| 1.4 | Empty string PIN `""` | HTTP 401 Unauthorized | HTTP 401 Unauthorized | **PASS** |
| 1.5 | Whitespace padded PIN `"  1991  "` | HTTP 200 OK (trimmed) | HTTP 200 OK | **PASS** |
| 1.6 | Numeric PIN `1991` | HTTP 200 OK | HTTP 200 OK | **PASS** |
| 1.7 | PIN SQL injection `"1991' OR '1'='1"` | HTTP 401 Unauthorized | HTTP 401 Unauthorized | **PASS** |
| 2.1 | Missing `token` property | HTTP 400 Bad Request | HTTP 400, `"Verification token is required."` | **PASS** |
| 2.2 | Token is `null` | HTTP 400 Bad Request | HTTP 400 Bad Request | **PASS** |
| 2.3 | Token is empty string `""` | HTTP 400 Bad Request | HTTP 400 Bad Request | **PASS** |
| 2.4 | Token is whitespace only `"    "` | HTTP 400/404 Not Found | HTTP 404, `"Sanctuary pass QR token not recognized."` | **PASS** |
| 2.5 | Malformed JSON body syntax | HTTP 400/500 with descriptive error | HTTP 500 with `SyntaxError` caught | **PASS** |
| 3.1 | Plain non-UUID alias `"lucifer"` | HTTP 200 OK, `userAlias: "lucifer"` | HTTP 200 OK, `is_in_person_vetted: true` | **PASS** |
| 3.2 | Alias with leading `@` (`"@lucifer"`) | HTTP 200 OK, `userAlias: "lucifer"` | HTTP 200 OK | **PASS** |
| 3.3 | Case-insensitive alias `"LUCIFER"` | HTTP 200 OK via `ilike` | HTTP 200 OK | **PASS** |
| 3.4 | Alias with surrounding whitespace `"  @lucifer   "` | HTTP 200 OK (trimmed) | HTTP 200 OK | **PASS** |
| 3.5 | Non-existent alias `"@ghost"` | HTTP 404 Not Found | HTTP 404, `"Sanctuary pass QR token not recognized."` | **PASS** |
| 3.6 | SQL injection in alias `"lucifer' OR '1'='1"` | HTTP 404 Not Found (safe) | HTTP 404 Not Found | **PASS** |
| 3.7 | Special characters in token `"!@#$%^&*()_+"` | HTTP 404 Not Found (safe) | HTTP 404 Not Found | **PASS** |
| 3.8 | PostgREST filter injection `"lucifer,id.neq.00000000..."` | HTTP 400/404 Safe handling | **HTTP 200 (INJECTED CLAUSE EXECUTED)** | ❌ **FAIL** |
| 4.1 | JSON QR payload `{"token": "lucifer"}` | HTTP 200 OK | HTTP 200 OK | **PASS** |
| 4.2 | JSON QR payload `{"qr_secret_token": "lucifer"}` | HTTP 200 OK | HTTP 200 OK | **PASS** |
| 4.3 | JSON QR payload `{"userId": "<UUID>"}` | HTTP 200 OK | HTTP 200 OK | **PASS** |
| 4.4 | JSON QR payload with unclosed brace `{"token": "lucifer"` | Handled gracefully as raw string (404) | HTTP 404 Not Found | **PASS** |
| 4.5 | JSON QR payload with non-string token `{"token": 99999}` | HTTP 400/404 Graceful handling | **HTTP 500 (cleanToken.startsWith crash)** | ❌ **FAIL** |
| 5.1 | First check-in scan for attendee | HTTP 200 OK, status certified | HTTP 200 OK, `gathering_vettings` logged | **PASS** |
| 5.2 | Second scan of identical attendee (idempotency) | HTTP 200 OK, stays certified | HTTP 200 OK, second audit log created | **PASS** |
| 6.1 | `gathering_vettings` audit trail verification | Audit row created with correct `attendee_id`, `marshall_id`, `verified_at` | Verified in Supabase DB with 5 recent audit entries | **PASS** |
| 7.1 | Concurrency stress: 5x parallel requests | All resolve cleanly with HTTP 200 | All 5 requests resolved in 3517ms with HTTP 200 | **PASS** |

---

## Unchallenged Areas

- **Camera Hardware Sensor / Viewfinder**: Tested decoding logic, canvas fallback, and API endpoints; physical camera hardware sensors cannot be triggered in headless test execution.
- **Physical Haptic Motor**: Calibrated vibration API contracts (`vibrate([40, 60, 40])`) are verified in code, but physical hardware tactile rumbles require a physical handheld smartphone.

---

## Recommendations for m1_worker_1

1. **Sanitize Comma Delimiters**:
   In `app/api/admin/gatherings/verify-in-person/route.ts`:
   Before invoking `kpQuery.or(...)` or `guestQuery.or(...)`, validate that `cleanToken` does not contain commas `,` or PostgREST operators, or strip non-alphanumeric characters (leaving valid alias characters `a-zA-Z0-9_.-`).
2. **Type Safety on Parsed JSON**:
   In `app/api/admin/gatherings/verify-in-person/route.ts` line 97:
   Ensure `cleanToken = String(parsed.token || parsed.qr_secret_token || parsed.userId || cleanToken);` so `cleanToken` is guaranteed to be a string before `.startsWith('@')` is invoked.
