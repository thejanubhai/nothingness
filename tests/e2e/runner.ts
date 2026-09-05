/**
 * Nothingness Kinkster Mode - E2E Master Test Runner
 * Executes Tiers 1-4 Test Suites and outputs detailed audit reports.
 */

import './tier1-feature-coverage.test';
import './tier2-boundary-corner.test';
import './tier3-pairwise-combinations.test';
import { runAllSuites } from './harness';

async function main() {
  console.log('='.repeat(70));
  console.log('   NOTHINGNESS KINKSTER MODE - MASTER E2E TEST RUNNER');
  console.log('='.repeat(70));
  console.log(`Node: ${process.version} | Timestamp: ${new Date().toISOString()}\n`);

  const results = await runAllSuites();

  console.log('--- TEST RESULTS BREAKDOWN ---');
  for (const r of results.results) {
    const icon = r.passed ? '✓' : '✗';
    const tag = `[Tier ${r.tier} | ${r.feature || 'General'}]`;
    if (!r.passed) {
      console.error(`${icon} ${tag} ${r.name} (${r.durationMs}ms)`);
      console.error(`  ERROR: ${r.error}`);
    } else {
      console.log(`${icon} ${tag} ${r.name} (${r.durationMs}ms)`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`TOTAL: ${results.total} | PASSED: ${results.passed} | FAILED: ${results.failed}`);
  for (const [tier, counts] of Object.entries(results.tierCounts)) {
    console.log(`  Tier ${tier}: ${counts.passed}/${counts.total} passed`);
  }
  console.log('='.repeat(70));

  if (results.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
