'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const hasTriggeredHapticRef = useRef(false);

  const THRESHOLD = 70; // 70px pull threshold

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 0 && !isRefreshing) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
      hasTriggeredHapticRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current || isRefreshing || window.scrollY > 0) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    if (diff > 0) {
      // Apply elastic damping: log resistance
      const elasticDistance = Math.min(diff * 0.45, 110);
      setPullDistance(elasticDistance);

      if (elasticDistance >= THRESHOLD && !hasTriggeredHapticRef.current) {
        triggerHaptic('light');
        hasTriggeredHapticRef.current = true;
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isPullingRef.current || isRefreshing) return;
    isPullingRef.current = false;

    if (pullDistance >= THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(50); // Hold at indicator height
      triggerHaptic('medium');

      try {
        await onRefresh();
      } catch {}

      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 400);
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full"
    >
      {/* PULL INDICATOR */}
      <div
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 10 ? Math.min(pullDistance / 50, 1) : 0,
        }}
        className="w-full flex items-center justify-center overflow-hidden transition-[height,opacity] duration-150 ease-out pointer-events-none"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950 border border-amber-500/30 text-amber-400 text-xs font-mono shadow-lg">
          {isRefreshing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span className="text-[11px]">Updating Vault Feed...</span>
            </>
          ) : (
            <>
              <Sparkles
                className={`w-3.5 h-3.5 transition-transform ${
                  pullDistance >= THRESHOLD ? 'scale-125 text-amber-300' : 'text-zinc-400'
                }`}
              />
              <span className="text-[11px]">
                {pullDistance >= THRESHOLD ? 'Release to Refresh' : 'Pull Down'}
              </span>
            </>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
