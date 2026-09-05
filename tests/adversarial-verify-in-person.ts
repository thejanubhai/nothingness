/**
 * Adversarial Stress-Test Suite for Verify-In-Person API
 * Target: /api/admin/gatherings/verify-in-person
 * Tester: m1_challenger_1 (Empirical Challenger)
 */

import fs from 'node:fs';
import path from 'node:path';
import { NextRequest } from 'next/server';

// 1. Ensure environment variables from .env.local are loaded
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...rest] = trimmed.split('=');
      const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

// Fallback defaults if not set in .env.local
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://amlxlguebzkszkwkzroe.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_j1sYCinQQ5qSdfXOA1coHA__YduyI9j';
process.env.MARSHALL_SECURITY_PIN = process.env.MARSHALL_SECURITY_PIN || '1991';

// Import target API route handler and admin client
import { POST as verifyInPersonPost } from '../app/api/admin/gatherings/verify-in-person/route';
import { createAdminClient } from '../lib/supabase/admin';

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  status: number;
  expectedStatus: number | number[];
  details: string;
  responseBody?: any;
}

const results: TestResult[] = [];

function createRequest(body: any, rawBodyString?: string): NextRequest {
  const bodyContent = rawBodyString !== undefined ? rawBodyString : JSON.stringify(body);
  return new NextRequest('http://localhost:3000/api/admin/gatherings/verify-in-person', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: bodyContent,
  });
}

async function runTest(
  category: string,
  name: string,
  req: NextRequest,
  expectedStatus: number | number[],
  validate?: (body: any, status: number) => boolean | string
) {
  const start = Date.now();
  try {
    const res = await verifyInPersonPost(req);
    const status = res.status;
    let body: any = null;
    try {
      body = await res.json();
    } catch {
      body = '<non-json response>';
    }

    const expectedArr = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    const statusMatches = expectedArr.includes(status);
    let validationPassed = true;
    let validationError = '';

    if (statusMatches && validate) {
      const vResult = validate(body, status);
      if (typeof vResult === 'string') {
        validationPassed = false;
        validationError = vResult;
      } else if (!vResult) {
        validationPassed = false;
        validationError = 'Custom validation failed';
      }
    }

    const passed = statusMatches && validationPassed;
    const details = passed
      ? `OK (${Date.now() - start}ms)`
      : `FAILED: Status ${status} (expected ${JSON.stringify(expectedStatus)})${validationError ? ' - ' + validationError : ''}`;

    results.push({
      category,
      name,
      passed,
      status,
      expectedStatus,
      details,
      responseBody: body,
    });

    console.log(`[${passed ? 'PASS' : 'FAIL'}] [${category}] ${name} -> ${details}`);
  } catch (err: any) {
    const details = `CRASHED/THREW: ${err.message}`;
    results.push({
      category,
      name,
      passed: false,
      status: -1,
      expectedStatus,
      details,
    });
    console.error(`[FAIL] [${category}] ${name} -> ${details}`);
  }
}

async function main() {
  console.log('================================================================');
  console.log('⚔️  STARTING ADVERSARIAL STRESS TEST SUITE: VERIFY-IN-PERSON');
  console.log('================================================================\n');

  // =========================================================================
  // CATEGORY 1: MARSHALL SECURITY PIN & AUTHORIZATION
  // =========================================================================
  await runTest(
    'PIN Authorization',
    '1.1 Valid default PIN (1991) with valid alias',
    createRequest({ token: 'lucifer', marshallPin: '1991' }),
    200,
    (b) => b.success === true && b.certifiedBy.includes('1991')
  );

  await runTest(
    'PIN Authorization',
    '1.2 Invalid PIN (0000)',
    createRequest({ token: 'lucifer', marshallPin: '0000' }),
    401,
    (b) => b.error && b.error.includes('Unauthorized')
  );

  await runTest(
    'PIN Authorization',
    '1.3 Missing PIN field',
    createRequest({ token: 'lucifer' }),
    401,
    (b) => b.error && b.error.includes('Unauthorized')
  );

  await runTest(
    'PIN Authorization',
    '1.4 Empty string PIN ("")',
    createRequest({ token: 'lucifer', marshallPin: '' }),
    401
  );

  await runTest(
    'PIN Authorization',
    '1.5 Whitespace padded PIN ("  1991  ")',
    createRequest({ token: 'lucifer', marshallPin: '  1991  ' }),
    200,
    (b) => b.success === true
  );

  await runTest(
    'PIN Authorization',
    '1.6 Numeric type PIN (1991 as number)',
    createRequest({ token: 'lucifer', marshallPin: 1991 }),
    200,
    (b) => b.success === true
  );

  await runTest(
    'PIN Authorization',
    '1.7 PIN SQL injection payload ("1991\' OR \'1\'=\'1")',
    createRequest({ token: 'lucifer', marshallPin: "1991' OR '1'='1" }),
    401
  );

  // =========================================================================
  // CATEGORY 2: REQUEST PAYLOAD & MALFORMED INPUTS
  // =========================================================================
  await runTest(
    'Malformed Payloads',
    '2.1 Missing token property in body',
    createRequest({ marshallPin: '1991' }),
    400,
    (b) => b.error && b.error.includes('token is required')
  );

  await runTest(
    'Malformed Payloads',
    '2.2 Token is null',
    createRequest({ token: null, marshallPin: '1991' }),
    400
  );

  await runTest(
    'Malformed Payloads',
    '2.3 Token is empty string ("")',
    createRequest({ token: '', marshallPin: '1991' }),
    400
  );

  await runTest(
    'Malformed Payloads',
    '2.4 Token is whitespace only ("    ")',
    createRequest({ token: '    ', marshallPin: '1991' }),
    [400, 404],
    (b) => !!b.error
  );

  await runTest(
    'Malformed Payloads',
    '2.5 Malformed JSON body syntax',
    createRequest(null, '{"token": "lucifer", "marshallPin": 1991,'), // syntax error
    [400, 500],
    (b) => !!b.error
  );

  // =========================================================================
  // CATEGORY 3: ALIAS RESOLUTION & EDGE CASES
  // =========================================================================
  await runTest(
    'Alias Resolution',
    '3.1 Plain non-UUID alias ("lucifer")',
    createRequest({ token: 'lucifer', marshallPin: '1991' }),
    200,
    (b) => b.success === true && b.userAlias === 'lucifer' && b.isInPersonVetted === true
  );

  await runTest(
    'Alias Resolution',
    '3.2 Alias with leading @ ("@lucifer")',
    createRequest({ token: '@lucifer', marshallPin: '1991' }),
    200,
    (b) => b.success === true && b.userAlias === 'lucifer'
  );

  await runTest(
    'Alias Resolution',
    '3.3 Case-insensitive alias match ("LUCIFER")',
    createRequest({ token: 'LUCIFER', marshallPin: '1991' }),
    200,
    (b) => b.success === true
  );

  await runTest(
    'Alias Resolution',
    '3.4 Alias with surrounding whitespace ("  @lucifer   ")',
    createRequest({ token: '  @lucifer   ', marshallPin: '1991' }),
    200,
    (b) => b.success === true
  );

  await runTest(
    'Alias Resolution',
    '3.5 Non-existent alias ("@ghost")',
    createRequest({ token: '@ghost', marshallPin: '1991' }),
    404,
    (b) => b.error && b.error.includes('not recognized')
  );

  await runTest(
    'Alias Resolution',
    '3.6 SQL injection attempt in alias ("lucifer\' OR \'1\'=\'1")',
    createRequest({ token: "lucifer' OR '1'='1", marshallPin: '1991' }),
    404 // PostgREST parameterizes filter literals, so this will not find an alias and return 404
  );

  await runTest(
    'Alias Resolution',
    '3.7 Special characters in token ("!@#$%^&*()_+")',
    createRequest({ token: '!@#$%^&*()_+', marshallPin: '1991' }),
    404
  );

  await runTest(
    'Alias Resolution',
    '3.8 PostgREST filter injection attempt ("lucifer,id.neq.00000000-0000-0000-0000-000000000000")',
    createRequest({ token: 'lucifer,id.neq.00000000-0000-0000-0000-000000000000', marshallPin: '1991' }),
    [400, 404]
  );

  // =========================================================================
  // CATEGORY 4: JSON-FORMATTED QR PAYLOADS
  // =========================================================================
  await runTest(
    'JSON QR Payload',
    '4.1 JSON payload with "token" property: {"token": "lucifer"}',
    createRequest({ token: JSON.stringify({ token: 'lucifer' }), marshallPin: '1991' }),
    200,
    (b) => b.success === true && b.userAlias === 'lucifer'
  );

  await runTest(
    'JSON QR Payload',
    '4.2 JSON payload with "qr_secret_token" property',
    createRequest({ token: JSON.stringify({ qr_secret_token: 'lucifer' }), marshallPin: '1991' }),
    200,
    (b) => b.success === true
  );

  await runTest(
    'JSON QR Payload',
    '4.3 JSON payload with "userId" property (UUID)',
    createRequest({
      token: JSON.stringify({ userId: '024e5001-02f7-4530-8c84-c41556db1eab' }),
      marshallPin: '1991',
    }),
    200,
    (b) => b.success === true && b.userId === '024e5001-02f7-4530-8c84-c41556db1eab'
  );

  await runTest(
    'JSON QR Payload',
    '4.4 JSON payload with unclosed curly brace: {"token": "lucifer"',
    createRequest({ token: '{"token": "lucifer"', marshallPin: '1991' }),
    404,
    (b) => !!b.error
  );

  await runTest(
    'JSON QR Payload',
    '4.5 JSON payload with non-string token: {"token": 99999}',
    createRequest({ token: JSON.stringify({ token: 99999 }), marshallPin: '1991' }),
    [400, 404, 500],
    (b, status) => {
      if (status === 500) {
        return 'CRASHED with 500! cleanToken type confusion bug detected!';
      }
      return true;
    }
  );

  // =========================================================================
  // CATEGORY 5: DOUBLE CHECK-IN & IDEMPOTENCY
  // =========================================================================
  console.log('\n--- Testing Double Check-In / Idempotency ---');
  const adminClient = createAdminClient();

  // Get current audit count before double check-in
  const { data: vettingsBefore } = await adminClient
    .from('gathering_vettings')
    .select('id')
    .eq('attendee_id', '024e5001-02f7-4530-8c84-c41556db1eab');
  const countBefore = vettingsBefore?.length || 0;

  // Scan 1
  await runTest(
    'Double Check-In',
    '5.1 First scan of attendee',
    createRequest({ token: 'lucifer', marshallPin: '1991' }),
    200,
    (b) => b.success === true && b.isInPersonVetted === true
  );

  // Scan 2 immediately after
  await runTest(
    'Double Check-In',
    '5.2 Second scan of identical attendee (idempotency)',
    createRequest({ token: 'lucifer', marshallPin: '1991' }),
    200,
    (b) => b.success === true && b.isInPersonVetted === true
  );

  // Check audit count after double check-in
  const { data: vettingsAfter } = await adminClient
    .from('gathering_vettings')
    .select('id, verified_at, marshall_alias, verification_method, notes')
    .eq('attendee_id', '024e5001-02f7-4530-8c84-c41556db1eab')
    .order('verified_at', { ascending: false });

  const countAfter = vettingsAfter?.length || 0;
  const auditDiff = countAfter - countBefore;

  await runTest(
    'Audit Table Verification',
    '6.1 gathering_vettings records audit row on scan',
    createRequest({ token: 'lucifer', marshallPin: '1991' }),
    200,
    () => {
      if (auditDiff < 2) {
        return `Expected at least 2 audit entries created during double check-in, but got diff=${auditDiff}`;
      }
      const latest = vettingsAfter?.[0];
      if (!latest) return 'No audit record found';
      if (!latest.verified_at) return 'Missing verified_at';
      if (latest.verification_method !== 'qr_scan') return `Unexpected method: ${latest.verification_method}`;
      return true;
    }
  );

  // =========================================================================
  // CATEGORY 6: HIGH-VOLUME CONCURRENT REQUESTS
  // =========================================================================
  console.log('\n--- Testing Concurrent Rapid Requests ---');
  const concurrentCount = 5;
  const concurrentReqs = Array.from({ length: concurrentCount }, (_, i) =>
    createRequest({ token: 'lucifer', marshallPin: '1991' })
  );

  const startConc = Date.now();
  const concResponses = await Promise.all(concurrentReqs.map((req) => verifyInPersonPost(req)));
  const concDuration = Date.now() - startConc;

  const all200 = concResponses.every((r) => r.status === 200);
  const jsonResponses = await Promise.all(concResponses.map((r) => r.json()));
  const allSuccess = jsonResponses.every((j) => j.success === true);

  results.push({
    category: 'Concurrency Stress',
    name: '7.1 Rapid concurrent check-in requests (5x parallel)',
    passed: all200 && allSuccess,
    status: all200 ? 200 : -1,
    expectedStatus: 200,
    details: `All ${concurrentCount} requests resolved in ${concDuration}ms with 200 OK`,
  });
  console.log(`[${all200 && allSuccess ? 'PASS' : 'FAIL'}] [Concurrency Stress] 7.1 Rapid concurrent check-in requests -> ${concDuration}ms`);

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  console.log('\n================================================================');
  console.log('📊 ADVERSARIAL STRESS TEST SUMMARY');
  console.log('================================================================');

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total Tests Run: ${total}`);
  console.log(`Passed:         ${passed}`);
  console.log(`Failed:         ${failed}`);
  console.log(`Success Rate:   ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    for (const f of results.filter((r) => !r.passed)) {
      console.log(` - [${f.category}] ${f.name}: ${f.details}`);
      if (f.responseBody) {
        console.log(`   Response: ${JSON.stringify(f.responseBody)}`);
      }
    }
  }

  // Export results JSON to a variable or write to stdout for inspection
  const jsonReport = JSON.stringify({ total, passed, failed, results }, null, 2);
  fs.writeFileSync(path.resolve(process.cwd(), 'tests/adversarial-results.json'), jsonReport, 'utf8');
}

main().catch((err) => {
  console.error('Fatal error in stress test harness:', err);
  process.exit(1);
});
