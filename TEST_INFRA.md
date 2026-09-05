# E2E Test Infra: Nothingness Kinkster Mode

## Test Philosophy
- Opaque-box, requirement-driven. Derived from `ORIGINAL_REQUEST.md` and user-facing specifications.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial Testing + Real-World Workload Testing.

## Feature Inventory & Test Coverage Matrix
| # | Feature | Requirement Source | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Scenario) |
|---|---------|-------------------|:----------------:|:-----------------:|:-----------------:|:-----------------:|
| 1 | R1: Marshall Scanner PIN & Auth | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 2 | R1: QR Decoding (Dual Engine) | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 3 | R1: L2 Vetting Certification & Audit Log | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 4 | R1: Feedback Signals (Badge, Moniker, Haptic) | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 5 | R2: OS App-Switcher Privacy Shield | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 6 | R2: Panic Camouflage (Double-tap & Shake) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 7 | R2: Discreet Session Restore (Long-press) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 8 | R3: Dynamic & Lifestyle Tags | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 9 | R3: Zero-Rejection Dual-Blind Intention | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 10 | R3: 48h Mutual Lock & Ephemeral Chamber | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 11 | R4: Burn-on-Read 5s Media Shred | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| 12 | R4: Voice Whispers & Sultry Noir Filter | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| 13 | R4: 24h Post-Gathering Chat Purge | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| 14 | R5: Pull-to-Refresh with Gold Crest | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ | ✓ |
| 15 | R5: Gesture Bottom Sheets | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ | ✓ |
| 16 | R5: Haptic Engine Patterns | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- Test Runner: Node.js / TypeScript test script executable via `pnpm test` (or dedicated test runner `tsx scripts/run-e2e-tests.ts` integrated into `package.json` test script).
- Test Layout: `tests/e2e/`
  - `tests/e2e/tier1-feature-coverage.test.ts`
  - `tests/e2e/tier2-boundary-corner.test.ts`
  - `tests/e2e/tier3-pairwise-combinations.test.ts`
  - `tests/e2e/tier4-real-world-scenarios.test.ts`
  - `tests/e2e/runner.ts`

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | On-Floor Marshall Flow: Physical check-in, PIN entry, QR scan, L1 ID verification, database audit log, moniker display, triple haptic pulse | F1, F2, F3, F4, F16 | High |
| 2 | Emergency Camouflage: Attendee in public transit switches apps (privacy shield blanks screen), receives sudden observer glance (double-tap crest triggers Noir Notes memo pad), returns home and performs 700ms footer long-press to restore active session | F5, F6, F7, F16 | High |
| 3 | Dual-Blind Sanctuary Pairing: Member A resonates with Member B with Shibari Artisan & Conversational Salon tags (zero alerts to B); 12 hours later Member B resonates with Member A; mutual lock triggers gold banner, unlocks ephemeral chamber | F8, F9, F10, F16 | High |
| 4 | Confidential Whispers: Two mutually paired members exchange a 5-second burn-on-read photo (auto-shredded) and a Sultry Noir pitch-shifted voice note; 24 hours later the chamber auto-purges | F11, F12, F13 | High |
| 5 | Mobile PWA Navigation: Member pulls to refresh the feed (gold crest spins with elastic physics), opens member profile bottom sheet, swipes down to dismiss with haptic confirmation | F14, F15, F16 | Medium |

## Coverage Thresholds
- Tier 1: >= 5 tests per feature (>= 80 tests total)
- Tier 2: >= 5 tests per feature (>= 80 tests boundary/negative tests total)
- Tier 3: Pairwise combinations across features (>= 16 tests)
- Tier 4: >= 5 comprehensive end-to-end user journeys
- Pass Criteria: 100% tests passing with exit code 0, integrated with `pnpm test`
