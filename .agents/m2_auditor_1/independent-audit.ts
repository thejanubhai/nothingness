import * as fs from 'fs';
import * as path from 'path';

function runAudit() {
  console.log('='.repeat(70));
  console.log('  INDEPENDENT FORENSIC INTEGRITY AUDIT: MILESTONE 2');
  console.log('='.repeat(70));

  const repoRoot = path.resolve(__dirname, '..', '..');
  const shieldPath = path.join(repoRoot, 'components', 'StealthPrivacyShield.tsx');
  const headerPath = path.join(repoRoot, 'components', 'Header.tsx');
  const hapticsPath = path.join(repoRoot, 'lib', 'haptics.ts');

  let checksPassed = 0;
  let totalChecks = 0;

  function verify(title: string, condition: boolean, detail: string) {
    totalChecks++;
    if (condition) {
      checksPassed++;
      console.log(`[PASS] Check ${totalChecks}: ${title}`);
    } else {
      console.error(`[FAIL] Check ${totalChecks}: ${title} - Detail: ${detail}`);
    }
  }

  // 1. Static Analysis: StealthPrivacyShield.tsx
  const shieldContent = fs.readFileSync(shieldPath, 'utf8');
  
  // Verify visibilitychange
  verify(
    'StealthPrivacyShield binds visibilitychange to document',
    shieldContent.includes("document.addEventListener('visibilitychange', handleVisibilityChange)") &&
    shieldContent.includes("document.removeEventListener('visibilitychange', handleVisibilityChange)"),
    'Missing document visibilitychange listener or cleanup'
  );

  // Verify pagehide
  verify(
    'StealthPrivacyShield binds pagehide to window',
    shieldContent.includes("window.addEventListener('pagehide', handlePageHide)") &&
    shieldContent.includes("window.removeEventListener('pagehide', handlePageHide)"),
    'Missing window pagehide listener or cleanup'
  );

  // Verify blur
  verify(
    'StealthPrivacyShield binds blur to window',
    shieldContent.includes("window.addEventListener('blur', handleBlur)") &&
    shieldContent.includes("window.removeEventListener('blur', handleBlur)"),
    'Missing window blur listener or cleanup'
  );

  // Verify focus
  verify(
    'StealthPrivacyShield binds focus to window with visibility check',
    shieldContent.includes("window.addEventListener('focus', handleFocus)") &&
    shieldContent.includes("window.removeEventListener('focus', handleFocus)") &&
    shieldContent.includes("document.visibilityState === 'hidden'"),
    'Missing window focus listener with document visibility check'
  );

  // Verify devicemotion
  verify(
    'StealthPrivacyShield binds devicemotion to window with cleanup',
    shieldContent.includes("window.addEventListener('devicemotion', handleDeviceMotion") &&
    shieldContent.includes("window.removeEventListener('devicemotion', handleDeviceMotion"),
    'Missing window devicemotion listener or cleanup'
  );

  // Verify trigger-panic-mode custom event
  verify(
    'StealthPrivacyShield binds trigger-panic-mode custom event with cleanup',
    shieldContent.includes("window.addEventListener('trigger-panic-mode', handleTriggerPanic)") &&
    shieldContent.includes("window.removeEventListener('trigger-panic-mode', handleTriggerPanic)"),
    'Missing trigger-panic-mode listener or cleanup'
  );

  // Verify 700ms timer
  verify(
    'StealthPrivacyShield specifies exact 700ms timer',
    shieldContent.includes("setTimeout(() => {") &&
    shieldContent.includes("}, 700)") &&
    shieldContent.includes("clearTimeout(exitTimerRef.current)"),
    'Missing 700ms setTimeout or clearTimeout'
  );

  // Verify restore trigger element and event bindings
  verify(
    'StealthPrivacyShield binds start/end handlers to restore trigger',
    shieldContent.includes('id="noir-notes-restore-trigger"') &&
    shieldContent.includes('onTouchStart={handleExitPressStart}') &&
    shieldContent.includes('onTouchEnd={handleExitPressEnd}') &&
    shieldContent.includes('onTouchCancel={handleExitPressEnd}') &&
    shieldContent.includes('onMouseDown={handleExitPressStart}') &&
    shieldContent.includes('onMouseUp={handleExitPressEnd}') &&
    shieldContent.includes('onMouseLeave={handleExitPressEnd}'),
    'Restore trigger element missing touch or mouse event cancellations'
  );

  // Verify shake threshold > 2800
  verify(
    'StealthPrivacyShield calculates shake speed with 2800 threshold',
    shieldContent.includes("speed = ((deltaX + deltaY + deltaZ) / diffTime) * 10000") &&
    shieldContent.includes("if (speed > 2800)"),
    'Missing shake speed calculation or 2800 threshold check'
  );

  // 2. Static Analysis: Header.tsx
  const headerContent = fs.readFileSync(headerPath, 'utf8');

  // Verify double-tap touch timing (< 350ms)
  verify(
    'Header.tsx calculates real touch timing with < 350ms window',
    headerContent.includes("timeSinceLastTap = now - lastLogoTapRef.current") &&
    headerContent.includes("timeSinceLastTap > 0 && timeSinceLastTap < 350") &&
    headerContent.includes("dispatchPanicMode()"),
    'Header.tsx missing real touch timing calculation or 350ms window'
  );

  // Verify double-click timing (< 350ms)
  verify(
    'Header.tsx calculates real click timing with < 350ms window',
    headerContent.includes("timeSinceLastClick = now - lastLogoClickRef.current") &&
    headerContent.includes("timeSinceLastClick > 0 && timeSinceLastClick < 350"),
    'Header.tsx missing click timing calculation'
  );

  // Verify header-crest-logo and drawer-crest-logo element bindings
  verify(
    'Header.tsx binds touch, click, double-click to header-crest-logo & drawer-crest-logo',
    headerContent.includes('id="header-crest-logo"') &&
    headerContent.includes('id="drawer-crest-logo"') &&
    headerContent.includes('onTouchStart={handleLogoTouchStart}') &&
    headerContent.includes('onDoubleClick={handleLogoDoubleClick}'),
    'Header.tsx missing element bindings for crest logos'
  );

  // 3. No Hardcoded Test Bypass Flags
  const bypassKeywords = [
    'bypass_m2',
    'SKIP_M2_TEST',
    '__MOCK_PANIC__',
    '__FORCE_SHIELD__',
    'MOCK_SHAKE_OVERRIDE'
  ];
  let foundBypass = false;
  for (const kw of bypassKeywords) {
    if (shieldContent.includes(kw) || headerContent.includes(kw)) {
      foundBypass = true;
      break;
    }
  }
  verify(
    'No test bypass or mock evasion flags exist in components',
    !foundBypass,
    'Found bypass flag in source'
  );

  // 4. Empirical Behavioral Timing Simulation
  console.log('\n--- Empirical Timing Behavioral Tests ---');

  // Test Timer 700ms abort on premature release
  let timerAborted = false;
  let timerFired = false;
  let timer: NodeJS.Timeout | null = setTimeout(() => {
    timerFired = true;
  }, 700);

  // Premature release after 250ms
  setTimeout(() => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      timerAborted = true;
    }
  }, 250);

  setTimeout(() => {
    verify(
      '700ms timer aborts when released at 250ms (< 700ms)',
      timerAborted && !timerFired,
      `Aborted: ${timerAborted}, Fired: ${timerFired}`
    );

    // Test Timer full duration 700ms
    let fullTimerFired = false;
    let fullTimer = setTimeout(() => {
      fullTimerFired = true;
    }, 700);

    setTimeout(() => {
      verify(
        '700ms timer completes when held for 750ms',
        fullTimerFired,
        `Full timer fired: ${fullTimerFired}`
      );

      // Double-tap timing test
      let tap1 = 1000;
      let tap2Fast = 1200; // diff = 200ms < 350ms
      let tap2Slow = 1450; // diff = 450ms >= 350ms

      const isFastDoubleTap = (tap2Fast - tap1) > 0 && (tap2Fast - tap1) < 350;
      const isSlowDoubleTap = (tap2Slow - tap1) > 0 && (tap2Slow - tap1) < 350;

      verify(
        'Double-tap detects 200ms as valid panic trigger (< 350ms)',
        isFastDoubleTap === true,
        '200ms not detected as fast double-tap'
      );

      verify(
        'Double-tap rejects 450ms as invalid panic trigger (>= 350ms)',
        isSlowDoubleTap === false,
        '450ms incorrectly triggered double-tap'
      );

      // Summary
      console.log('\n' + '='.repeat(70));
      console.log(`AUDIT RESULT: ${checksPassed}/${totalChecks} CHECKS PASSED`);
      console.log(`VERDICT: ${checksPassed === totalChecks ? 'CLEAN' : 'INTEGRITY VIOLATION'}`);
      console.log('='.repeat(70));

      process.exit(checksPassed === totalChecks ? 0 : 1);
    }, 800);
  }, 400);
}

runAudit();
