/**
 * Native Haptic Feedback Engine
 * Provides subtle tactile feedback for PWA touch interactions on iOS & Android.
 */

export type HapticPattern = 
  | 'light'           // vibrate(10)
  | 'medium'          // vibrate(25)
  | 'heavy'           // vibrate(50)
  | 'resonance'       // vibrate([10, 30, 10])
  | 'mutualMatch'     // vibrate([30, 60, 30])
  | 'marshallSuccess' // vibrate([40, 60, 40])
  | 'panicTrigger'    // vibrate([80, 50, 80])
  | 'burnWarning'     // vibrate([50, 50, 50, 50])
  | 'success'         // vibrate([25, 40, 30])
  | 'warning';        // vibrate([40, 30, 40])

export const hapticPatterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  resonance: [10, 30, 10],
  mutualMatch: [30, 60, 30],
  marshallSuccess: [40, 60, 40],
  panicTrigger: [80, 50, 80],
  burnWarning: [50, 50, 50, 50],
  success: [25, 40, 30],
  warning: [40, 30, 40],
};

export function triggerHaptic(type: HapticPattern = 'light') {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'heavy':
        navigator.vibrate(50);
        break;
      case 'marshallSuccess':
        // Distinctive triple pulse for Consent Marshall verification
        navigator.vibrate([40, 60, 40]);
        break;
      case 'mutualMatch':
        // Heavy double rumble on mutual desire resonance match
        navigator.vibrate([30, 60, 30]);
        break;
      case 'panicTrigger':
        navigator.vibrate([80, 50, 80]);
        break;
      case 'burnWarning':
        navigator.vibrate([50, 50, 50, 50]);
        break;
      case 'success':
        navigator.vibrate([25, 40, 30]);
        break;
      case 'warning':
        navigator.vibrate([40, 30, 40]);
        break;
      case 'resonance':
        navigator.vibrate([10, 30, 10]);
        break;
    }
  } catch {
    // Ignore unsupported browser errors
  }
}
