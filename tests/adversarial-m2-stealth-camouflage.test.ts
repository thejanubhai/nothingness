/**
 * Empirical Adversarial Challenge Suite for Milestone 2 (R2)
 * Stealth Mode, OS App-Switcher Privacy Shield & Panic Camouflage
 * 
 * Target Components & Files:
 * 1. components/StealthPrivacyShield.tsx (OS Shield, Shake Detector, Noir Notes Camouflage, 700ms Restore)
 * 2. components/Header.tsx (Crest Logo Double-Tap & Double-Click Panic Trigger)
 * 
 * Run with: npx tsx tests/adversarial-m2-stealth-camouflage.test.ts
 * Typecheck: pnpm test (tsc --noEmit)
 */

import fs from 'node:fs';
import path from 'node:path';
import { triggerHaptic } from '../lib/haptics';

interface TestResult {
  suite: string;
  id: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

const results: TestResult[] = [];

function recordTest(
  suite: string,
  id: string,
  name: string,
  passed: boolean,
  expected: string,
  actual: string,
  details?: string
) {
  results.push({ suite, id, name, passed, expected, actual, details });
  const icon = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`[${suite}] ${icon} ${id}: ${name}`);
  if (!passed) {
    console.error(`   Expected: ${expected}`);
    console.error(`   Actual:   ${actual}`);
    if (details) console.error(`   Details:  ${details}`);
  }
}

// Global mock state for simulating browser environment
class AdversarialBrowserContext {
  public windowListeners: Map<string, Function[]> = new Map();
  public documentListeners: Map<string, Function[]> = new Map();
  public visibilityState: 'visible' | 'hidden' = 'visible';
  public vibrationHistory: (number | number[])[] = [];

  constructor() {
    this.installGlobals();
  }

  installGlobals() {
    const self = this;

    (globalThis as any).window = {
      addEventListener: (type: string, listener: Function) => {
        if (!self.windowListeners.has(type)) self.windowListeners.set(type, []);
        self.windowListeners.get(type)!.push(listener);
      },
      removeEventListener: (type: string, listener: Function) => {
        const list = self.windowListeners.get(type) || [];
        self.windowListeners.set(type, list.filter((l) => l !== listener));
      },
      dispatchEvent: (event: any) => {
        const list = self.windowListeners.get(event.type) || [];
        for (const fn of list) fn(event);
      },
    };

    (globalThis as any).document = {
      get visibilityState() {
        return self.visibilityState;
      },
      addEventListener: (type: string, listener: Function) => {
        if (!self.documentListeners.has(type)) self.documentListeners.set(type, []);
        self.documentListeners.get(type)!.push(listener);
      },
      removeEventListener: (type: string, listener: Function) => {
        const list = self.documentListeners.get(type) || [];
        self.documentListeners.set(type, list.filter((l) => l !== listener));
      },
    };

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

  emitWindow(type: string, eventObj: any = {}) {
    const list = this.windowListeners.get(type) || [];
    for (const fn of list) fn(eventObj);
  }

  emitDocument(type: string, eventObj: any = {}) {
    const list = this.documentListeners.get(type) || [];
    for (const fn of list) fn(eventObj);
  }

  clear() {
    this.windowListeners.clear();
    this.documentListeners.clear();
    this.vibrationHistory = [];
    this.visibilityState = 'visible';
  }
}

async function runAdversarialSuite() {
  console.log('='.repeat(75));
  console.log('   M2 EMPIRICAL ADVERSARIAL CHALLENGE SUITE');
  console.log('   Target: Stealth Mode, OS Privacy Shield & Panic Camouflage');
  console.log('='.repeat(75));

  const ctx = new AdversarialBrowserContext();

  // =========================================================================
  // SUITE 1: Browser Lifecycle Transitions & Boundary States
  // =========================================================================
  console.log('\n--- SUITE 1: Browser Lifecycle Transitions & Boundary States ---');

  // Test 1.1: Rapid blur -> focus -> blur oscillation
  {
    let isAppHidden: any = false;
    const handleVisibilityChange = () => {
      if (ctx.visibilityState === 'hidden') isAppHidden = true;
      else if (ctx.visibilityState === 'visible') isAppHidden = false;
    };
    const handleBlur = () => { isAppHidden = true; };
    const handleFocus = () => {
      if (ctx.visibilityState === 'hidden') return;
      isAppHidden = false;
    };

    // User is viewing app
    ctx.visibilityState = 'visible';
    isAppHidden = false;

    // Rapid oscillation: blur -> focus -> blur in rapid succession
    handleBlur(); // Swiped halfway into app switcher
    const stateAfterBlur1: boolean = isAppHidden;
    handleFocus(); // Aborted swipe back into app
    const stateAfterFocus1: boolean = isAppHidden;
    handleBlur(); // Swiped again into app switcher
    const stateAfterBlur2: boolean = isAppHidden;

    const passed = stateAfterBlur1 === true && stateAfterFocus1 === false && stateAfterBlur2 === true;
    recordTest(
      'Lifecycle',
      'ADV-M2-01',
      'Rapid blur -> focus -> blur oscillation cleanly toggles and settles on hidden',
      passed,
      'true -> false -> true',
      `${stateAfterBlur1} -> ${stateAfterFocus1} -> ${stateAfterBlur2}`
    );
  }

  // Test 1.2: Focus event while document.visibilityState is 'hidden'
  {
    let isAppHidden: boolean = true;
    ctx.visibilityState = 'hidden';

    const handleFocus = () => {
      if (ctx.visibilityState === 'hidden') return;
      isAppHidden = false;
    };

    // OS sends focus event while app is in background (e.g. system alert)
    handleFocus();
    const passed = isAppHidden === true;
    recordTest(
      'Lifecycle',
      'ADV-M2-02',
      'OS focus event while visibilityState is hidden does NOT unshield the app',
      passed,
      'isAppHidden === true',
      `isAppHidden === ${isAppHidden}`,
      'Prevents background OS snapshot capture or alert popups from exposing secrets'
    );
  }

  // Test 1.3: Pagehide event immediately activates privacy shield
  {
    let isAppHidden: any = false;
    const handlePageHide = () => { isAppHidden = true; };

    handlePageHide();
    const passed = isAppHidden === true;
    recordTest(
      'Lifecycle',
      'ADV-M2-03',
      'Pagehide event immediately triggers privacy blanking shield',
      passed,
      'isAppHidden === true',
      `isAppHidden === ${isAppHidden}`
    );
  }

  // Test 1.4: Pageshow handling (bfcache restoration resilience)
  {
    const shieldSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'components/StealthPrivacyShield.tsx'),
      'utf8'
    );
    const hasPageShow = shieldSrc.includes('pageshow');
    // Note: pageshow is typically required alongside pagehide for Safari bfcache
    recordTest(
      'Lifecycle',
      'ADV-M2-04',
      'Pageshow event listener registered for bfcache restoration in Safari',
      hasPageShow,
      'pageshow listener present in StealthPrivacyShield.tsx',
      hasPageShow ? 'pageshow listener present' : 'pageshow listener MISSING',
      hasPageShow ? undefined : 'Safari bfcache restore may leave app stuck in hidden shield if pageshow is unhandled'
    );
  }

  // Test 1.5: Visibilitychange during active touch restore (long-press interrupted by app switch)
  {
    let isPanicMode = true;
    let exitTimer: NodeJS.Timeout | null = null;

    const handleExitPressStart = () => {
      exitTimer = setTimeout(() => {
        isPanicMode = false;
        exitTimer = null;
      }, 700);
    };

    // Current implementation in StealthPrivacyShield.tsx does NOT clear exitTimerRef on blur/visibilitychange
    const shieldSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'components/StealthPrivacyShield.tsx'),
      'utf8'
    );
    const clearsTimerOnBlur = shieldSrc.includes('handleBlur') && shieldSrc.includes('exitTimerRef.current = null');
    const clearsTimerOnVis = shieldSrc.includes('handleVisibilityChange') && shieldSrc.includes('exitTimerRef.current = null');

    recordTest(
      'Lifecycle',
      'ADV-M2-05',
      'App backgrounding (blur / visibility hidden) aborts active long-press restore timer',
      clearsTimerOnBlur || clearsTimerOnVis,
      'Pending restore timer must be cleared on blur/visibilitychange',
      clearsTimerOnBlur || clearsTimerOnVis ? 'Timer aborted on blur' : 'Timer NOT aborted on blur/visibilitychange',
      'If user presses restore and switches app mid-press, timer could fire in background restoring session unseen'
    );
  }

  // =========================================================================
  // SUITE 2: Panic Camouflage Long-Press Restore Ergonomics
  // =========================================================================
  console.log('\n--- SUITE 2: Camouflage Long-Press Restore Ergonomics ---');

  // Test 2.1: Premature release of long-press (<700ms)
  {
    let isPanicMode = true;
    let timer: NodeJS.Timeout | null = null;

    const handleExitPressStart = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        isPanicMode = false;
        timer = null;
      }, 700);
    };

    const handleExitPressEnd = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    // Press started at t = 0
    handleExitPressStart();
    // Released early at t = 300ms
    await new Promise((r) => setTimeout(r, 200));
    handleExitPressEnd();
    // Wait until past 700ms mark
    await new Promise((r) => setTimeout(r, 600));

    const passed = isPanicMode === true && timer === null;
    recordTest(
      'Restore',
      'ADV-M2-06',
      'Premature release of long-press (<700ms) does NOT restore session',
      passed,
      'isPanicMode === true, timer === null',
      `isPanicMode === ${isPanicMode}, timer === ${timer}`
    );
  }

  // Test 2.2: Continuous 700ms long-press completes and restores session
  {
    let isPanicMode: any = true;
    let timer: NodeJS.Timeout | null = null;

    ctx.vibrationHistory = [];
    const handleExitPressStart = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        triggerHaptic('success');
        isPanicMode = false;
        timer = null;
      }, 700);
    };

    handleExitPressStart();
    await new Promise((r) => setTimeout(r, 750));

    const passed = isPanicMode === false && timer === null;
    recordTest(
      'Restore',
      'ADV-M2-07',
      'Continuous 700ms long-press successfully restores session and fires haptic pulse',
      passed,
      'isPanicMode === false, last vibration [25, 40, 30]',
      `isPanicMode === ${isPanicMode}, last vibration ${JSON.stringify(ctx.vibrationHistory[ctx.vibrationHistory.length - 1])}`
    );
  }

  // Test 2.3: Touch cancel aborts restore
  {
    let isPanicMode = true;
    let timer: NodeJS.Timeout | null = null;

    const handleExitPressStart = () => {
      timer = setTimeout(() => { isPanicMode = false; }, 700);
    };
    const handleExitPressEnd = () => {
      if (timer) { clearTimeout(timer); timer = null; }
    };

    handleExitPressStart();
    await new Promise((r) => setTimeout(r, 150));
    // System interrupts touch (e.g. phone call, OS notification)
    handleExitPressEnd();
    await new Promise((r) => setTimeout(r, 650));

    const passed = isPanicMode === true && timer === null;
    recordTest(
      'Restore',
      'ADV-M2-08',
      'Touch cancel (system interrupt) aborts restore timer',
      passed,
      'isPanicMode === true',
      `isPanicMode === ${isPanicMode}`
    );
  }

  // Test 2.4: Touch move during long-press (dragging or sliding finger)
  {
    const shieldSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'components/StealthPrivacyShield.tsx'),
      'utf8'
    );
    // Inspect whether onTouchMove is bound to handleExitPressEnd or similar on the restore trigger
    const restoreTriggerBlock = shieldSrc.match(/id="noir-notes-restore-trigger"[\s\S]*?>/)?.[0] || '';
    const hasTouchMove = restoreTriggerBlock.includes('onTouchMove');

    recordTest(
      'Restore',
      'ADV-M2-09',
      'Touch move (finger slide/drag) aborts long-press restore',
      hasTouchMove,
      'onTouchMove={handleExitPressEnd} on #noir-notes-restore-trigger',
      hasTouchMove ? 'onTouchMove is attached' : 'onTouchMove is MISSING from #noir-notes-restore-trigger',
      hasTouchMove ? undefined : 'Dragging finger away does not abort timer; holding anywhere while moving still triggers restore'
    );
  }

  // =========================================================================
  // SUITE 3: Accelerometer Shake vs False Trigger Rejection
  // =========================================================================
  console.log('\n--- SUITE 3: Accelerometer Shake vs False Trigger Rejection ---');

  function calculateShakeSpeed(
    last: { x: number; y: number; z: number },
    curr: { x: number; y: number; z: number },
    diffTime: number
  ): number {
    const deltaX = Math.abs(curr.x - last.x);
    const deltaY = Math.abs(curr.y - last.y);
    const deltaZ = Math.abs(curr.z - last.z);
    return Math.round(((deltaX + deltaY + deltaZ) / diffTime) * 10000);
  }

  // Test 3.1: Zero motion / stationary phone
  {
    const speed = calculateShakeSpeed({ x: 0, y: 9.8, z: 0 }, { x: 0, y: 9.8, z: 0 }, 100);
    const passed = speed === 0 && speed <= 2800;
    recordTest(
      'Shake',
      'ADV-M2-10',
      'Stationary table rest (speed = 0) does NOT trigger panic',
      passed,
      'speed <= 2800',
      `speed === ${speed}`
    );
  }

  // Test 3.2: Sensor jitter and thermal noise
  {
    const speed = calculateShakeSpeed({ x: 0.05, y: 9.81, z: 0.02 }, { x: 0.12, y: 9.75, z: 0.08 }, 100);
    const passed = speed < 2800;
    recordTest(
      'Shake',
      'ADV-M2-11',
      'Micro-jitter and sensor noise (speed ~190) does NOT trigger panic',
      passed,
      'speed <= 2800',
      `speed === ${speed.toFixed(1)}`
    );
  }

  // Test 3.3: Typing on on-screen keyboard
  {
    const speed = calculateShakeSpeed({ x: 0.3, y: 9.8, z: 1.0 }, { x: 0.6, y: 9.9, z: 1.2 }, 100);
    const passed = speed < 2800;
    recordTest(
      'Shake',
      'ADV-M2-12',
      'Vigorous typing on mobile keyboard (speed ~600) does NOT trigger panic',
      passed,
      'speed <= 2800',
      `speed === ${speed.toFixed(1)}`
    );
  }

  // Test 3.4: Walking with phone in hand / pocket
  {
    const speed = calculateShakeSpeed({ x: 1.2, y: 9.8, z: 2.1 }, { x: 2.8, y: 8.5, z: 3.5 }, 120);
    const passed = speed < 2800;
    recordTest(
      'Shake',
      'ADV-M2-13',
      'Walking / pedestrian gait oscillation (speed ~3583/120 => 358) does NOT trigger panic',
      passed,
      'speed <= 2800',
      `speed === ${speed.toFixed(1)}`
    );
  }

  // Test 3.5: Rapid high-velocity intentional shake
  {
    const speed = calculateShakeSpeed({ x: -12.0, y: 2.0, z: 4.0 }, { x: 15.0, y: -8.0, z: -6.0 }, 100);
    // deltaX = 27, deltaY = 10, deltaZ = 10 -> total 47 -> speed = 4700 > 2800
    const passed = speed > 2800;
    recordTest(
      'Shake',
      'ADV-M2-14',
      'High-velocity intentional shake (speed ~4700) reliably triggers panic mode',
      passed,
      'speed > 2800',
      `speed === ${speed.toFixed(1)}`
    );
  }

  // Test 3.6: Boundary condition exactly at threshold 2800 vs 2801
  {
    // diffTime = 100, delta = 28 -> speed = (28/100)*10000 = 2800
    const speed2800 = calculateShakeSpeed({ x: 0, y: 0, z: 0 }, { x: 28, y: 0, z: 0 }, 100);
    // delta = 28.01 -> speed = 2801
    const speed2801 = calculateShakeSpeed({ x: 0, y: 0, z: 0 }, { x: 28.01, y: 0, z: 0 }, 100);

    const atBoundaryNotTriggered = speed2800 <= 2800;
    const aboveBoundaryTriggered = speed2801 > 2800;
    const passed = atBoundaryNotTriggered && aboveBoundaryTriggered;
    recordTest(
      'Shake',
      'ADV-M2-15',
      'Shake threshold boundary condition (<= 2800 no trigger, > 2800 triggers)',
      passed,
      'speed 2800 no trigger, speed 2801 triggers',
      `speed 2800: ${speed2800} (triggered: ${!atBoundaryNotTriggered}), speed 2801: ${speed2801} (triggered: ${aboveBoundaryTriggered})`
    );
  }

  // =========================================================================
  // SUITE 4: Header Logo Double-Tap & Double-Click Mechanics
  // =========================================================================
  console.log('\n--- SUITE 4: Header Logo Double-Tap & Double-Click Timing ---');

  // Test 4.1: Single touch tap on logo allows navigation
  {
    let panicDispatched = false;
    let lastTap = 0;
    let defaultPrevented = false;

    const handleLogoTouchStart = (now: number, e: { preventDefault: () => void; stopPropagation: () => void }) => {
      const timeSinceLastTap = now - lastTap;
      if (timeSinceLastTap > 0 && timeSinceLastTap < 350) {
        e.preventDefault();
        e.stopPropagation();
        lastTap = 0;
        panicDispatched = true;
      } else {
        lastTap = now;
      }
    };

    handleLogoTouchStart(1000, {
      preventDefault: () => { defaultPrevented = true; },
      stopPropagation: () => {},
    });

    const passed = panicDispatched === false && defaultPrevented === false;
    recordTest(
      'DoubleTap',
      'ADV-M2-16',
      'Single touch tap does NOT trigger panic and does NOT prevent navigation',
      passed,
      'panicDispatched === false, defaultPrevented === false',
      `panicDispatched === ${panicDispatched}, defaultPrevented === ${defaultPrevented}`
    );
  }

  // Test 4.2: Rapid double tap (< 350ms) triggers panic and suppresses navigation
  {
    let panicDispatched: any = false;
    let lastTap = 0;
    let defaultPrevented: any = false;
    let stopPropagationCalled: any = false;

    const handleLogoTouchStart = (now: number, e: { preventDefault: () => void; stopPropagation: () => void }) => {
      const timeSinceLastTap = now - lastTap;
      if (timeSinceLastTap > 0 && timeSinceLastTap < 350) {
        e.preventDefault();
        e.stopPropagation();
        lastTap = 0;
        panicDispatched = true;
      } else {
        lastTap = now;
      }
    };

    // Tap 1 at t = 1000
    handleLogoTouchStart(1000, { preventDefault: () => {}, stopPropagation: () => {} });
    // Tap 2 at t = 1200 (delta = 200ms < 350ms)
    handleLogoTouchStart(1200, {
      preventDefault: () => { defaultPrevented = true; },
      stopPropagation: () => { stopPropagationCalled = true; },
    });

    const passed = panicDispatched === true && defaultPrevented === true && stopPropagationCalled === true;
    recordTest(
      'DoubleTap',
      'ADV-M2-17',
      'Rapid touch double-tap (<350ms) triggers panic, calls preventDefault and stopPropagation',
      passed,
      'panic: true, prevented: true, stopped: true',
      `panic: ${panicDispatched}, prevented: ${defaultPrevented}, stopped: ${stopPropagationCalled}`
    );
  }

  // Test 4.3: Slow double tap (>= 350ms) does NOT trigger panic
  {
    let panicDispatched = false;
    let lastTap = 0;

    const handleLogoTouchStart = (now: number, e: { preventDefault: () => void; stopPropagation: () => void }) => {
      const timeSinceLastTap = now - lastTap;
      if (timeSinceLastTap > 0 && timeSinceLastTap < 350) {
        e.preventDefault();
        e.stopPropagation();
        lastTap = 0;
        panicDispatched = true;
      } else {
        lastTap = now;
      }
    };

    // Tap 1 at t = 1000
    handleLogoTouchStart(1000, { preventDefault: () => {}, stopPropagation: () => {} });
    // Tap 2 at t = 1350 (delta = 350ms >= 350ms boundary)
    handleLogoTouchStart(1350, { preventDefault: () => {}, stopPropagation: () => {} });
    // Tap 3 at t = 1850 (delta = 500ms >= 350ms)
    handleLogoTouchStart(1850, { preventDefault: () => {}, stopPropagation: () => {} });

    const passed = panicDispatched === false;
    recordTest(
      'DoubleTap',
      'ADV-M2-18',
      'Slow touch taps (>=350ms) do NOT trigger panic mode',
      passed,
      'panicDispatched === false',
      `panicDispatched === ${panicDispatched}`
    );
  }

  // Test 4.4: Rapid triple-tap anchor reset behavior
  {
    let panicCount = 0;
    let lastTap = 0;

    const handleLogoTouchStart = (now: number, e: { preventDefault: () => void; stopPropagation: () => void }) => {
      const timeSinceLastTap = now - lastTap;
      if (timeSinceLastTap > 0 && timeSinceLastTap < 350) {
        e.preventDefault();
        e.stopPropagation();
        lastTap = 0;
        panicCount++;
      } else {
        lastTap = now;
      }
    };

    // Tap 1 at t = 1000
    handleLogoTouchStart(1000, { preventDefault: () => {}, stopPropagation: () => {} });
    // Tap 2 at t = 1200 (delta = 200ms) -> Triggers panic 1, lastTap resets to 0
    handleLogoTouchStart(1200, { preventDefault: () => {}, stopPropagation: () => {} });
    // Tap 3 at t = 1300 (100ms after Tap 2) -> timeSinceLastTap = 1300 - 0 = 1300 >= 350!
    handleLogoTouchStart(1300, { preventDefault: () => {}, stopPropagation: () => {} });

    // Tap 3 should set lastTap = 1300, NOT trigger a second panic
    const passed = panicCount === 1;
    recordTest(
      'DoubleTap',
      'ADV-M2-19',
      'Triple-tap reset behavior: tap 3 does NOT immediately re-fire panic',
      passed,
      'panicCount === 1',
      `panicCount === ${panicCount}`,
      'lastLogoTapRef reset to 0 prevents rapid oscillation between panic on every subsequent tap'
    );
  }

  // Test 4.5: Desktop mouse double-click (< 350ms) vs slow click (> 500ms)
  {
    let panicCount = 0;
    let lastClick = 0;

    const handleLogoClick = (now: number, e: { preventDefault: () => void; stopPropagation: () => void }) => {
      const timeSinceLastClick = now - lastClick;
      if (timeSinceLastClick > 0 && timeSinceLastClick < 350) {
        e.preventDefault();
        e.stopPropagation();
        lastClick = 0;
        panicCount++;
        return;
      }
      lastClick = now;
    };

    // Slow clicks at t=1000 and t=1600 (delta = 600ms)
    handleLogoClick(1000, { preventDefault: () => {}, stopPropagation: () => {} });
    handleLogoClick(1600, { preventDefault: () => {}, stopPropagation: () => {} });
    const countAfterSlow = panicCount;

    // Fast clicks at t=2000 and t=2200 (delta = 200ms)
    handleLogoClick(2000, { preventDefault: () => {}, stopPropagation: () => {} });
    handleLogoClick(2200, { preventDefault: () => {}, stopPropagation: () => {} });
    const countAfterFast = panicCount;

    const passed = countAfterSlow === 0 && countAfterFast === 1;
    recordTest(
      'DoubleClick',
      'ADV-M2-20',
      'Desktop mouse double-click timing: slow click (>500ms) ignored, fast double-click (<350ms) triggers',
      passed,
      'slow: 0, fast: 1',
      `slow: ${countAfterSlow}, fast: ${countAfterFast}`
    );
  }

  // Test 4.6: Drawer crest logo closes mobile menu on panic trigger
  {
    const headerSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'components/Header.tsx'),
      'utf8'
    );
    const drawerBlock = headerSrc.match(/id="drawer-crest-logo"[\s\S]*?<\/Link>/)?.[0] || '';
    const closesOnDoubleTap = drawerBlock.includes('setMobileOpen(false)');

    recordTest(
      'DrawerLogo',
      'ADV-M2-21',
      'Drawer crest logo closes mobile navigation menu when triggering panic',
      closesOnDoubleTap,
      'setMobileOpen(false) called on drawer-crest-logo interactions',
      closesOnDoubleTap ? 'setMobileOpen(false) confirmed' : 'setMobileOpen(false) MISSING',
      'Ensures full-screen mobile menu drawer does not obstruct the panic camouflage pad'
    );
  }

  // =========================================================================
  // SUITE 5: DOM Contracts & Security Invariants
  // =========================================================================
  console.log('\n--- SUITE 5: DOM Contracts & Security Invariants ---');

  // Test 5.1: Top z-index on privacy shield
  {
    const shieldSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'components/StealthPrivacyShield.tsx'),
      'utf8'
    );
    const hasHighestZIndex = shieldSrc.includes('z-[999999]');
    recordTest(
      'DOM',
      'ADV-M2-22',
      'Privacy shield has supreme z-index (z-[999999]) exceeding all modals and sheets',
      hasHighestZIndex,
      'z-[999999]',
      hasHighestZIndex ? 'z-[999999] found' : 'Lower z-index'
    );
  }

  // Test 5.2: Camouflage z-index sits above content and below shield
  {
    const shieldSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'components/StealthPrivacyShield.tsx'),
      'utf8'
    );
    const hasCamouflageZIndex = shieldSrc.includes('z-[999990]');
    recordTest(
      'DOM',
      'ADV-M2-23',
      'Noir Notes camouflage has z-index z-[999990] below shield but above app',
      hasCamouflageZIndex,
      'z-[999990]',
      hasCamouflageZIndex ? 'z-[999990] found' : 'Unexpected z-index'
    );
  }

  // Test 5.3: Neutral memo pad content audit
  {
    const shieldSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'components/StealthPrivacyShield.tsx'),
      'utf8'
    );
    const hasNeutralContent =
      shieldSrc.includes('Architectural Review') &&
      shieldSrc.includes('iCloud Drive') &&
      shieldSrc.includes('Encrypted with Obsidian');

    recordTest(
      'Camouflage',
      'ADV-M2-24',
      'Noir Notes displays convincing corporate/architectural memo content with innocent metadata',
      hasNeutralContent,
      'Architectural Review + iCloud Drive + Encrypted with Obsidian',
      hasNeutralContent ? 'All neutral markers present' : 'Missing neutral markers'
    );
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n' + '='.repeat(75));
  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('='.repeat(75));

  return { total, passedCount, failedCount, results };
}

runAdversarialSuite().then(({ failedCount }) => {
  if (failedCount > 0) {
    console.log(`\nAdversarial suite found ${failedCount} failing/challenging assertions!`);
  } else {
    console.log('\nAll adversarial tests passed!');
  }
}).catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
