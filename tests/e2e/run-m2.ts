import './m2-stealth-privacy-shield.test';
import { runAllSuites } from './harness';

async function main() {
  console.log('='.repeat(70));
  console.log('   MILESTONE 2 (M2) TEST SUITE - STEALTH & PRIVACY SHIELD');
  console.log('='.repeat(70));

  const results = await runAllSuites();

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
  console.log('='.repeat(70));

  if (results.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
