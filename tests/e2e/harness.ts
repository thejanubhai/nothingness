/**
 * Nothingness Kinkster Mode - E2E Test Harness
 * Provides test runner, assertion library, mock PostgREST in-memory database,
 * browser environment simulation, and haptics monitoring.
 */

import Module from 'node:module';
import { register } from 'node:module';
import { NextRequest } from 'next/server';
import * as mockSupabaseServer from './mocks/supabase-server-mock';

// Intercept CommonJS / tsx module imports for '@/lib/supabase/server'
const originalRequire = (Module.prototype as any).require;
(Module.prototype as any).require = function (id: string) {
  if (id.includes('lib/supabase/server') || id === '@/lib/supabase/server') {
    return mockSupabaseServer;
  }
  return originalRequire.apply(this, arguments);
};

// Register ESM loader for mocking '@/lib/supabase/server'
try {
  register('./mocks/loader.mjs', import.meta.url);
} catch (err) {
  // Loader already registered or running under custom loader
}

import { setTestAuthUser } from './mocks/supabase-server-mock';

// Set test environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-for-admin';
process.env.MARSHALL_SECURITY_PIN = '1991';

// --- Test Reporter & Assertions ---

export interface TestCase {
  name: string;
  fn: () => void | Promise<void>;
  tier: 1 | 2 | 3 | 4;
  feature?: string;
}

export interface TestResult {
  name: string;
  tier: 1 | 2 | 3 | 4;
  feature?: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

const registeredSuites: { name: string; cases: TestCase[] }[] = [];
let currentSuite: { name: string; cases: TestCase[] } | null = null;

export function describe(name: string, fn: () => void) {
  const previousSuite = currentSuite;
  currentSuite = { name, cases: [] };
  registeredSuites.push(currentSuite);
  fn();
  currentSuite = previousSuite;
}

export function it(
  name: string,
  tier: 1 | 2 | 3 | 4,
  feature: string | undefined,
  fn: () => void | Promise<void>
) {
  if (!currentSuite) {
    currentSuite = { name: 'Default Suite', cases: [] };
    registeredSuites.push(currentSuite);
  }
  currentSuite.cases.push({ name, fn, tier, feature });
}

export function assert(condition: any, message?: string) {
  if (!condition) {
    throw new Error(message || 'Assertion failed: expected truthy value');
  }
}

export function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(
      message ||
        `Assertion failed: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

export function assertDeepEqual<T>(actual: T, expected: T, message?: string) {
  const aStr = JSON.stringify(actual);
  const eStr = JSON.stringify(expected);
  if (aStr !== eStr) {
    throw new Error(
      message || `Assertion failed:\nExpected: ${eStr}\nActual:   ${aStr}`
    );
  }
}

export function assertIncludes(actual: string, expected: string, message?: string) {
  if (!actual || !actual.includes(expected)) {
    throw new Error(
      message || `Assertion failed: expected "${actual}" to include "${expected}"`
    );
  }
}

export function assertMatches(actual: string, regex: RegExp, message?: string) {
  if (!regex.test(actual)) {
    throw new Error(
      message || `Assertion failed: expected "${actual}" to match ${regex}`
    );
  }
}

export async function assertThrows(
  fn: () => any | Promise<any>,
  expectedErrorSubstr?: string
) {
  let threw = false;
  try {
    await fn();
  } catch (err: any) {
    threw = true;
    if (expectedErrorSubstr) {
      assertIncludes(err.message, expectedErrorSubstr);
    }
  }
  if (!threw) {
    throw new Error('Expected function to throw, but it succeeded.');
  }
}

// --- In-Memory Database Store ---

export interface DbState {
  profiles: any[];
  guest_profiles: any[];
  kinkster_profiles: any[];
  sanctuary_events: any[];
  sanctuary_event_applications: any[];
  kinkster_resonances: any[];
  kinkster_ephemeral_messages: any[];
  gathering_vettings: any[];
}

const initialDb: DbState = {
  profiles: [
    {
      id: 'a0000000-0000-4000-8000-000000000001',
      role: 'admin',
      email: 'consent_lead@nothingness.test',
      is_in_person_vetted: true,
    },
    {
      id: 'a0000000-0000-4000-8000-000000000002',
      role: 'member',
      email: 'regular_member@nothingness.test',
      is_in_person_vetted: false,
    },
  ],
  guest_profiles: [
    {
      id: 'g1010000-0000-4000-8000-000000000101',
      user_id: 'e1010000-0000-4000-8000-000000000101',
      full_name: 'Elena Rostova',
      phone: '+919876543210',
      phone_number: '+919876543210',
      document_number: 'PASS_IND_9901',
      doc_number: 'PASS_IND_9901',
      is_verified: true,
      in_person_vetted: false,
      is_in_person_vetted: false,
      updated_at: new Date().toISOString(),
    },
    {
      id: 'g1020000-0000-4000-8000-000000000102',
      user_id: 'd1020000-0000-4000-8000-000000000102',
      full_name: 'Damian Vance',
      phone: '+919876543211',
      phone_number: '+919876543211',
      document_number: 'PASS_IND_9902',
      doc_number: 'PASS_IND_9902',
      is_verified: false, // Unverified L1 ID
      in_person_vetted: false,
      is_in_person_vetted: false,
      updated_at: new Date().toISOString(),
    },
  ],
  kinkster_profiles: [
    {
      id: 'e1010000-0000-4000-8000-000000000101',
      alias: 'velvet_cord',
      in_person_vetted: false,
      is_in_person_vetted: false,
      is_id_verified: true,
      avatar_url: '/images/IMG_9955.jpg',
      bio: 'Sensory seeker & shibari enthusiast.',
      tags: ['Switch', 'Shibari Artisan', 'Sensory Exploration'],
      updated_at: new Date().toISOString(),
    },
    {
      id: 'd1020000-0000-4000-8000-000000000102',
      alias: 'noir_architect',
      in_person_vetted: false,
      is_in_person_vetted: false,
      is_id_verified: false,
      avatar_url: '/images/IMG_9956.jpg',
      bio: 'Architectural minimalism and dynamic tension.',
      tags: ['Rigger', 'Dominant', 'Private Suite'],
      updated_at: new Date().toISOString(),
    },
    {
      id: 'c1030000-0000-4000-8000-000000000103',
      alias: 'silk_shadow',
      in_person_vetted: true,
      is_in_person_vetted: true,
      is_id_verified: true,
      avatar_url: '/images/IMG_9957.jpg',
      bio: 'Conversationalist and protocol enthusiast.',
      tags: ['Submissive', 'Rope Bunny', 'Conversational Salon'],
      updated_at: new Date().toISOString(),
    },
  ],
  sanctuary_events: [
    {
      id: 'b2010000-0000-4000-8000-000000000201',
      title: 'Midnight Noir Salon at The Obsidian Sanctuary',
      start_time: new Date(Date.now() - 2 * 3600000).toISOString(),
      end_time: new Date(Date.now() + 4 * 3600000).toISOString(),
    },
  ],
  sanctuary_event_applications: [
    {
      id: 'a1010000-0000-4000-8000-000000000101',
      user_id: 'e1010000-0000-4000-8000-000000000101',
      event_id: 'b2010000-0000-4000-8000-000000000201',
      status: 'approved',
      qr_secret_token: 'QR_PASS_TOKEN_ELENA_9901',
      checked_in_at: null,
      checked_in_by: null,
      updated_at: new Date().toISOString(),
      sanctuary_events: {
        title: 'Midnight Noir Salon at The Obsidian Sanctuary',
      },
    },
  ],
  kinkster_resonances: [],
  kinkster_ephemeral_messages: [],
  gathering_vettings: [],
};

let db: DbState = JSON.parse(JSON.stringify(initialDb));

export function getDb() {
  return db;
}

export function resetDb() {
  db = JSON.parse(JSON.stringify(initialDb));
  setTestAuthUser({ id: 'e1010000-0000-4000-8000-000000000101', email: 'elena@nothingness.test' });
}

export function seedDb(partial: Partial<DbState>) {
  for (const [key, val] of Object.entries(partial)) {
    (db as any)[key] = JSON.parse(JSON.stringify(val));
  }
}

// --- Intercept Global Fetch for Supabase PostgREST ---

const originalFetch = globalThis.fetch;

export function setupFetchInterceptor() {
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlStr = typeof input === 'string' ? input : input.toString();

    // Check if request is targeting our mock Supabase REST API
    if (urlStr.includes('127.0.0.1:54321/rest/v1/')) {
      const url = new URL(urlStr);
      const pathname = url.pathname;
      const tableMatch = pathname.match(/\/rest\/v1\/([a-zA-Z0-9_]+)/);
      const tableName = tableMatch ? tableMatch[1] : null;

      if (!tableName || !(tableName in db)) {
        return new Response(JSON.stringify({ error: `Table ${tableName} not found in mock db` }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const method = (init?.method || 'GET').toUpperCase();
      const body = init?.body ? JSON.parse(init.body as string) : null;
      const searchParams = url.searchParams;

      console.log(`[MockFetch] ${method} ${urlStr}`);

      const tableData: any[] = (db as any)[tableName];

      if (method === 'GET') {
        let results = [...tableData];

        // Apply filters: key=eq.val, key=ilike.val, key=lt.val, or=(...)
        for (const [paramKey, paramVal] of searchParams.entries()) {
          if (paramVal.startsWith('eq.')) {
            const val = paramVal.slice(3);
            results = results.filter((row) => String(row[paramKey]) === val);
          } else if (paramVal.startsWith('ilike.')) {
            const val = paramVal.slice(6);
            results = results.filter((row) => String(row[paramKey] || '').toLowerCase() === val.toLowerCase());
          } else if (paramVal.startsWith('lt.')) {
            const val = paramVal.slice(3);
            results = results.filter((row) => row[paramKey] < val);
          } else if (paramKey === 'or') {
            // e.g. (sender_id.eq.usr_1,target_id.eq.usr_1) or (phone.eq.X,user_id.eq.Y) or alias.eq.val,id.eq.val
            const rawOr = paramVal.replace(/^\(|\)$/g, '');
            const clauses = rawOr.split(',');
            results = results.filter((row) => {
              return clauses.some((clause) => {
                const parts = clause.split('.');
                if (parts.length >= 3) {
                  const [cCol, cOp, ...cVals] = parts;
                  const cVal = cVals.join('.');
                  if (cOp === 'eq') {
                    return String(row[cCol]) === String(cVal);
                  }
                  if (cOp === 'ilike') {
                    return String(row[cCol] || '').toLowerCase() === String(cVal || '').toLowerCase();
                  }
                }
                return false;
              });
            });
          }
        }

        // Apply ordering if requested
        const orderParam = searchParams.get('order');
        if (orderParam) {
          const [orderCol, orderDir] = orderParam.split('.');
          const isAsc = orderDir !== 'desc';
          results.sort((a, b) => {
            if (a[orderCol] < b[orderCol]) return isAsc ? -1 : 1;
            if (a[orderCol] > b[orderCol]) return isAsc ? 1 : -1;
            return 0;
          });
        }

        // If relations requested, e.g. kinkster_profiles
        results = results.map((row) => {
          const rowCopy = { ...row };
          if (tableName === 'kinkster_resonances') {
            const otherProfile = db.kinkster_profiles.find(
              (p) => p.id === row.target_id || p.id === row.sender_id
            );
            rowCopy.kinkster_profiles = otherProfile || null;
          }
          if (tableName === 'kinkster_ephemeral_messages') {
            const senderProfile = db.kinkster_profiles.find((p) => p.id === row.sender_id);
            rowCopy.kinkster_profiles = senderProfile || null;
          }
          if (tableName === 'sanctuary_event_applications' && row.sanctuary_events) {
            rowCopy.sanctuary_events = row.sanctuary_events;
          }
          return rowCopy;
        });

        const accept = (init?.headers as any)?.['Accept'] || (init?.headers as any)?.['accept'] || '';
        const wantsSingle = accept.includes('application/vnd.pgrst.object+json');

        if (wantsSingle) {
          if (results.length === 0) {
            return new Response(JSON.stringify(null), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return new Response(JSON.stringify(results[0]), {
            status: 200,
            headers: { 'Content-Type': 'application/vnd.pgrst.object+json' },
          });
        }

        const countHeader = `${results.length > 0 ? '0-' + (results.length - 1) : '*'}/${results.length}`;
        return new Response(JSON.stringify(results), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Range': countHeader,
          },
        });
      }

      if (method === 'POST') {
        const toInsert = Array.isArray(body) ? body : [body];
        const insertedRows: any[] = [];
        for (const item of toInsert) {
          const row = {
            id: item.id || 'id_' + Math.random().toString(36).substring(2, 10),
            created_at: new Date().toISOString(),
            ...item,
          };
          tableData.push(row);
          insertedRows.push(row);
        }

        const accept = (init?.headers as any)?.['Accept'] || (init?.headers as any)?.['accept'] || '';
        const wantsSingle = accept.includes('application/vnd.pgrst.object+json');

        return new Response(JSON.stringify(wantsSingle ? insertedRows[0] : insertedRows), {
          status: 201,
          headers: {
            'Content-Type': wantsSingle ? 'application/vnd.pgrst.object+json' : 'application/json',
            'Content-Range': `0-${insertedRows.length - 1}/${tableData.length}`,
          },
        });
      }

      if (method === 'PATCH') {
        let updatedCount = 0;
        const updatedRows: any[] = [];

        // Apply filters for update target
        for (let i = 0; i < tableData.length; i++) {
          let match = true;
          for (const [paramKey, paramVal] of searchParams.entries()) {
            if (paramVal.startsWith('eq.')) {
              const val = paramVal.slice(3);
              if (String(tableData[i][paramKey]) !== val) {
                match = false;
                break;
              }
            }
          }
          if (match) {
            tableData[i] = { ...tableData[i], ...body };
            updatedRows.push(tableData[i]);
            updatedCount++;
          }
        }

        const accept = (init?.headers as any)?.['Accept'] || (init?.headers as any)?.['accept'] || '';
        const wantsSingle = accept.includes('application/vnd.pgrst.object+json');

        return new Response(JSON.stringify(wantsSingle ? (updatedRows[0] || null) : updatedRows), {
          status: 200,
          headers: {
            'Content-Type': wantsSingle ? 'application/vnd.pgrst.object+json' : 'application/json',
            'Content-Range': `0-${updatedCount - 1}/${tableData.length}`,
          },
        });
      }

      if (method === 'DELETE') {
        const remaining: any[] = [];
        for (let i = 0; i < tableData.length; i++) {
          let match = true;
          for (const [paramKey, paramVal] of searchParams.entries()) {
            if (paramVal.startsWith('eq.')) {
              const val = paramVal.slice(3);
              if (String(tableData[i][paramKey]) !== val) {
                match = false;
              }
            } else if (paramVal.startsWith('lt.')) {
              const val = paramVal.slice(3);
              if (tableData[i][paramKey] >= val) {
                match = false;
              }
            }
          }
          if (!match) {
            remaining.push(tableData[i]);
          }
        }
        (db as any)[tableName] = remaining;

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return originalFetch(input, init);
  };
}

export function teardownFetchInterceptor() {
  globalThis.fetch = originalFetch;
}

// --- NextRequest Simulation Helper ---

export function createApiRequest(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  headers: Record<string, string> = {}
): NextRequest {
  const url = `http://localhost:3000${path}`;
  const init: any = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  if (body !== undefined && method !== 'GET') {
    init.body = JSON.stringify(body);
  }
  return new NextRequest(url, init);
}

// --- Browser Environment Simulation ---

export class MockBrowserEnvironment {
  private listeners: Map<string, Function[]> = new Map();
  public visibilityState: 'visible' | 'hidden' = 'visible';
  public vibrationHistory: (number | number[])[] = [];

  constructor() {
    this.setupGlobals();
  }

  setupGlobals() {
    const self = this;

    // Window event listener mock
    (globalThis as any).window = {
      addEventListener: (type: string, listener: Function) => {
        if (!self.listeners.has(type)) self.listeners.set(type, []);
        self.listeners.get(type)!.push(listener);
      },
      removeEventListener: (type: string, listener: Function) => {
        const list = self.listeners.get(type) || [];
        self.listeners.set(
          type,
          list.filter((l) => l !== listener)
        );
      },
      dispatchEvent: (event: any) => {
        const list = self.listeners.get(event.type) || [];
        for (const l of list) l(event);
      },
    };

    // Document mock
    (globalThis as any).document = {
      get visibilityState() {
        return self.visibilityState;
      },
      addEventListener: (type: string, listener: Function) => {
        if (!self.listeners.has(type)) self.listeners.set(type, []);
        self.listeners.get(type)!.push(listener);
      },
      removeEventListener: (type: string, listener: Function) => {
        const list = self.listeners.get(type) || [];
        self.listeners.set(
          type,
          list.filter((l) => l !== listener)
        );
      },
    };

    // Navigator.vibrate mock
    try {
      Object.defineProperty(globalThis.navigator, 'vibrate', {
        value: (pattern: number | number[]) => {
          self.vibrationHistory.push(pattern);
          return true;
        },
        configurable: true,
        writable: true,
      });
    } catch {
      try {
        (globalThis.navigator as any).vibrate = (pattern: number | number[]) => {
          self.vibrationHistory.push(pattern);
          return true;
        };
      } catch {}
    }
  }

  simulateVisibilityChange(state: 'visible' | 'hidden') {
    this.visibilityState = state;
    const callbacks = this.listeners.get('visibilitychange') || [];
    for (const cb of callbacks) cb();
  }

  simulatePageHide() {
    const callbacks = this.listeners.get('pagehide') || [];
    for (const cb of callbacks) cb();
  }

  simulateDeviceMotion(x: number, y: number, z: number) {
    const callbacks = this.listeners.get('devicemotion') || [];
    const event = {
      accelerationIncludingGravity: { x, y, z },
    };
    for (const cb of callbacks) cb(event);
  }

  simulateTriggerPanicMode() {
    const callbacks = this.listeners.get('trigger-panic-mode') || [];
    for (const cb of callbacks) cb();
  }

  clearVibrations() {
    this.vibrationHistory = [];
  }

  getLastVibration(): number | number[] | undefined {
    return this.vibrationHistory[this.vibrationHistory.length - 1];
  }
}

export const browser = new MockBrowserEnvironment();

// --- Test Suite Execution Engine ---

export async function runAllSuites(): Promise<{
  results: TestResult[];
  passed: number;
  failed: number;
  total: number;
  tierCounts: Record<number, { passed: number; total: number }>;
}> {
  setupFetchInterceptor();
  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  const tierCounts: Record<number, { passed: number; total: number }> = {
    1: { passed: 0, total: 0 },
    2: { passed: 0, total: 0 },
    3: { passed: 0, total: 0 },
    4: { passed: 0, total: 0 },
  };

  for (const suite of registeredSuites) {
    for (const tc of suite.cases) {
      resetDb();
      tierCounts[tc.tier].total++;
      const start = performance.now();
      try {
        await tc.fn();
        const durationMs = Math.round((performance.now() - start) * 100) / 100;
        passed++;
        tierCounts[tc.tier].passed++;
        results.push({
          name: tc.name,
          tier: tc.tier,
          feature: tc.feature,
          passed: true,
          durationMs,
        });
      } catch (err: any) {
        const durationMs = Math.round((performance.now() - start) * 100) / 100;
        failed++;
        results.push({
          name: tc.name,
          tier: tc.tier,
          feature: tc.feature,
          passed: false,
          durationMs,
          error: err.stack || err.message,
        });
      }
    }
  }

  teardownFetchInterceptor();

  return {
    results,
    passed,
    failed,
    total: passed + failed,
    tierCounts,
  };
}

export function getAllRegisteredSuites() {
  return registeredSuites;
}
