import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Deployment & Infrastructure Guardrails', () => {
  test('Vercel configuration must never declare crons (delegated to cron-job.org)', () => {
    const vercelConfigPath = path.resolve(process.cwd(), 'vercel.json');
    assert.ok(fs.existsSync(vercelConfigPath), 'vercel.json must exist');
    const content = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    assert.ok(
      !content.crons || (Array.isArray(content.crons) && content.crons.length === 0),
      'Do NOT define crons in vercel.json! Vercel Hobby plan rejects sub-daily cron schedules and limits to 2 jobs. External scheduling is handled via cron-job.org pinging /api/cron/* endpoints.'
    );
  });

  test('All Supabase migration filenames follow valid format and have unique version timestamps', () => {
    const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations');
    assert.ok(fs.existsSync(migrationsDir), 'supabase/migrations directory must exist');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    
    assert.ok(files.length > 0, 'There should be migration files');

    const versionRegex = /^(\d{5}|\d{14})_[a-z0-9_]+\.sql$/;
    const seenVersions = new Set<string>();

    for (const file of files) {
      assert.match(
        file, 
        versionRegex, 
        `Migration file "${file}" does not follow the required naming pattern {version}_{name}.sql`
      );
      const version = file.split('_')[0];
      assert.ok(!seenVersions.has(version), `Duplicate migration version detected: ${version} in ${file}`);
      seenVersions.add(version);

      const filePath = path.join(migrationsDir, file);
      const stat = fs.statSync(filePath);
      assert.ok(stat.size > 0, `Migration file ${file} is empty`);
    }
  });

  test('All remote production baseline migrations exist locally', () => {
    const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    const localVersions = new Set(files.map(f => f.split('_')[0]));

    const remoteBaselineVersions = [
      '00001','00002','20260527203808','20260528003100','20260529000000','20260530000000','20260530214306',
      '20260531000000','20260531000001','20260531000002','20260531000003','20260531000004','20260531000005',
      '20260602000000','20260602000001','20260602000002','20260602000003','20260602000004','20260602000005',
      '20260602000006','20260602000007','20260603000001','20260603000002','20260603000003','20260604000000',
      '20260604000001','20260604094137','20260604094749','20260604095242','20260824103300','20260824103307',
      '20260824103314','20260824103324','20260824103329','20260824103335','20260824103341','20260824103347',
      '20260824103351','20260824103357','20260824103549','20260824103616','20260824103914','20260825225450',
      '20260901214128','20260904191907','20260910202527','20260910203955'
    ];

    for (const rv of remoteBaselineVersions) {
      assert.ok(
        localVersions.has(rv),
        `Production baseline migration version ${rv} is missing from local supabase/migrations directory! This will cause Supabase Preview check to fail.`
      );
    }
  });

  test('Cron API route handlers are configured for dynamic execution and protected', () => {
    const cronDir = path.resolve(process.cwd(), 'app/api/cron');
    assert.ok(fs.existsSync(cronDir), 'app/api/cron directory must exist');
    const entries = fs.readdirSync(cronDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const routeFile = path.join(cronDir, entry.name, 'route.ts');
        if (fs.existsSync(routeFile)) {
          const content = fs.readFileSync(routeFile, 'utf8');
          assert.ok(
            content.includes("export const dynamic = 'force-dynamic'"),
            `Cron route /api/cron/${entry.name} must export dynamic = 'force-dynamic'`
          );
        }
      }
    }
  });
});
