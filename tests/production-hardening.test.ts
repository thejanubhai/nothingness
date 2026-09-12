import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Production Hardening & Accuracy Guardrails', () => {
  test('Zero AI-generated jacuzzi hallucinations in app/ and components/', () => {
    const checkDir = (dir: string) => {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const f of files) {
        const fullPath = path.join(dir, f.name);
        if (f.isDirectory()) {
          checkDir(fullPath);
        } else if (/\.(tsx|ts|jsx|js|json|md)$/.test(f.name)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const matches = content.match(/jacuzzi/gi);
          assert.ok(
            !matches,
            `Found AI-generated "jacuzzi" reference in ${fullPath}! Hallucinated amenities must be eradicated.`
          );
        }
      }
    };

    checkDir(path.resolve(process.cwd(), 'app'));
    checkDir(path.resolve(process.cwd(), 'components'));
  });

  test('Purge-ephemeral cron endpoint adheres strictly to AGENTS.md invariants', () => {
    const routePath = path.resolve(process.cwd(), 'app/api/cron/purge-ephemeral/route.ts');
    assert.ok(fs.existsSync(routePath), 'purge-ephemeral route must exist');
    const content = fs.readFileSync(routePath, 'utf8');

    assert.ok(
      content.includes("export const dynamic = 'force-dynamic'"),
      'Must export dynamic = force-dynamic'
    );
    assert.ok(
      content.includes('export async function GET'),
      'Must export GET handler'
    );
    assert.ok(
      content.includes('export async function POST'),
      'Must export POST handler'
    );
    assert.ok(
      content.includes('CRON_SECRET'),
      'Must validate CRON_SECRET authorization'
    );
    assert.ok(
      content.includes('kinkster_ephemeral_messages'),
      'Must purge kinkster_ephemeral_messages'
    );
  });

  test('Gathering SOS endpoint enforces confirmed attendance and authentication', () => {
    const routePath = path.resolve(process.cwd(), 'app/api/events/[id]/sos/route.ts');
    assert.ok(fs.existsSync(routePath), 'Gathering SOS route must exist');
    const content = fs.readFileSync(routePath, 'utf8');

    assert.ok(
      content.includes("export const dynamic = 'force-dynamic'"),
      'Must export dynamic = force-dynamic'
    );
    assert.ok(
      content.includes('sanctuary_event_applications'),
      'Must verify attendance against sanctuary_event_applications'
    );
    assert.ok(
      content.includes("status', 'confirmed'"),
      'Must strictly require confirmed status'
    );
    assert.ok(
      content.includes('gathering_vettings'),
      'Must log SOS alerts into gathering_vettings audit trail'
    );
  });

  test('Marshall Scanner requires exact PIN 1991 without prefix bypasses', () => {
    const scannerPath = path.resolve(process.cwd(), 'app/admin/marshall-scanner/page.tsx');
    assert.ok(fs.existsSync(scannerPath), 'Marshall scanner page must exist');
    const content = fs.readFileSync(scannerPath, 'utf8');

    assert.ok(
      content.includes("pin.trim() === '1991'"),
      'Must strictly check exact PIN 1991'
    );
    assert.ok(
      !content.includes('pin.trim().length >= 4'),
      'Must NOT contain insecure length >= 4 bypass'
    );
  });
});
