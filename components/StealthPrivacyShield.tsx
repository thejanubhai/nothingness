'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FileText, ChevronLeft, Search } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';

export default function StealthPrivacyShield() {
  const [isAppHidden, setIsAppHidden] = useState(false);
  const [isPanicMode, setIsPanicMode] = useState(false);
  const [notesDraft, setNotesDraft] = useState(
    '# Q3 Brand Guidelines & Architectural Review\n- Maintain minimalist spatial layout across suite penthouses.\n- Focus on natural materials: black slate, charcoal timber, raw brass.\n- Ensure acoustic isolation in private master corridors.\n- Client feedback scheduled for Thursday 4:00 PM.'
  );

  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. OS App-Switcher Privacy Shield (visibilitychange, pagehide, blur & focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsAppHidden(true);
      } else if (document.visibilityState === 'visible') {
        setIsAppHidden(false);
      }
    };

    const handlePageHide = () => {
      setIsAppHidden(true);
    };

    const handlePageShow = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        setIsAppHidden(false);
      }
    };

    const handleBlur = () => {
      // Only blur-blank on touch/mobile devices where window blur indicates OS app switcher
      const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
      if (isTouch) {
        setIsAppHidden(true);
      }
    };

    const handleFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      setIsAppHidden(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // 2. Shake-to-Panic Detection & Double-Tap Trigger
  useEffect(() => {
    let lastX: number | null = null;
    let lastY: number | null = null;
    let lastZ: number | null = null;
    let lastTime = 0;

    const handleDeviceMotion = (e: DeviceMotionEvent) => {
      const current = e.accelerationIncludingGravity;
      if (!current || current.x === null || current.y === null || current.z === null) return;

      const currentTime = Date.now();
      if (currentTime - lastTime > 100) {
        const diffTime = currentTime - lastTime;
        lastTime = currentTime;

        if (lastX !== null && lastY !== null && lastZ !== null) {
          const deltaX = Math.abs(current.x - lastX);
          const deltaY = Math.abs(current.y - lastY);
          const deltaZ = Math.abs(current.z - lastZ);

          const speed = Math.round(((deltaX + deltaY + deltaZ) / diffTime) * 10000);

          // Rapid device shake threshold
          if (speed > 2800) {
            triggerHaptic('warning');
            setIsPanicMode(true);
          }
        }

        lastX = current.x;
        lastY = current.y;
        lastZ = current.z;
      }
    };

    // Global custom event for panic trigger (e.g. from logo double click)
    const handleTriggerPanic = () => {
      triggerHaptic('warning');
      setIsPanicMode(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('devicemotion', handleDeviceMotion as any);
      window.addEventListener('trigger-panic-mode', handleTriggerPanic);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('devicemotion', handleDeviceMotion as any);
        window.removeEventListener('trigger-panic-mode', handleTriggerPanic);
      }
    };
  }, []);

  const handleExitPressStart = () => {
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
    }
    exitTimerRef.current = setTimeout(() => {
      triggerHaptic('success');
      setIsPanicMode(false);
      exitTimerRef.current = null;
    }, 700);
  };

  const handleExitPressEnd = () => {
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  };

  // Clean up exit timer on unmount
  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
  }, []);

  return (
    <>
      {/* OS MULTI-TASKING APP-SWITCHER BLANKING SHIELD */}
      {isAppHidden && (
        <div 
          id="os-app-switcher-shield" 
          data-testid="os-app-switcher-shield"
          className="fixed inset-0 z-[999999] bg-black flex flex-col items-center justify-center pointer-events-none select-none"
        >
          <div className="w-16 h-16 rounded-3xl bg-zinc-950 border border-amber-500/30 flex items-center justify-center shadow-2xl mb-4">
            <span className="font-serif text-2xl font-bold text-amber-400">N</span>
          </div>
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-zinc-600">
            Nothingness • Confidential
          </p>
        </div>
      )}

      {/* PANIC CAMOUFLAGE OVERLAY: MINIMALIST NOIR NOTES APP */}
      {isPanicMode && (
        <div 
          id="noir-notes-camouflage"
          data-testid="noir-notes-camouflage"
          className="fixed inset-0 z-[999990] bg-zinc-950 text-zinc-200 flex flex-col font-sans select-text animate-in fade-in duration-150"
        >
          {/* Notes Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/50">
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-semibold text-amber-500 font-sans">Folders</span>
            </div>
            <span className="text-xs text-zinc-500 font-mono">Synced</span>
            <Search className="w-4 h-4 text-zinc-400" />
          </div>

          {/* Notes Content Editor */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 max-w-2xl mx-auto w-full">
            <div className="text-[11px] text-zinc-500 font-mono">
              August 29, 2026 at 11:42 AM
            </div>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              className="w-full h-96 bg-transparent resize-none focus:outline-none text-sm text-zinc-200 leading-relaxed font-sans"
              spellCheck={false}
              placeholder="Start writing..."
            />
          </div>

          {/* Discreet Footer Note with Secret Long-Press Exit Trigger */}
          <div className="px-4 py-3 border-t border-zinc-900 bg-zinc-950/80 flex items-center justify-between text-[10px] font-mono text-zinc-600">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3 h-3 text-zinc-600" />
              <span>4 notes • iCloud Drive</span>
            </div>

            {/* Hold 700ms on this text to exit camouflage mode */}
            <div
              id="noir-notes-restore-trigger"
              data-testid="noir-notes-restore-trigger"
              onTouchStart={handleExitPressStart}
              onTouchEnd={handleExitPressEnd}
              onTouchMove={handleExitPressEnd}
              onTouchCancel={handleExitPressEnd}
              onMouseDown={handleExitPressStart}
              onMouseUp={handleExitPressEnd}
              onMouseLeave={handleExitPressEnd}
              className="cursor-pointer active:text-zinc-400 select-none py-1 px-2 transition-colors"
              title="Hold to restore"
              role="button"
              tabIndex={0}
            >
              <span>Encrypted with Obsidian</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
