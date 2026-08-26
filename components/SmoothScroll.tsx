"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Disable smooth scroll on admin routes or mobile touch devices
    // Touch devices (iOS / Android) natively excel with hardware-accelerated 120Hz ProMotion touch momentum
    const isTouchDevice = typeof window !== 'undefined' && (
      window.matchMedia('(pointer: coarse)').matches || 
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0
    );

    if (pathname?.startsWith('/admin') || isTouchDevice) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      syncTouch: false,
      autoResize: true,
    });

    lenisRef.current = lenis;
    (window as any).__lenis = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    // Dynamic ResizeObserver so Lenis adapts whenever async components (like spaces catalog) render
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && document.body) {
      resizeObserver = new ResizeObserver(() => {
        lenis.resize();
      });
      resizeObserver.observe(document.body);
    }

    const onWindowResize = () => {
      lenis.resize();
    };

    window.addEventListener('resize', onWindowResize, { passive: true });
    window.addEventListener('orientationchange', onWindowResize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('orientationchange', onWindowResize);
      lenis.destroy();
      lenisRef.current = null;
      delete (window as any).__lenis;
    };
  }, [pathname]);

  return <>{children}</>;
}
