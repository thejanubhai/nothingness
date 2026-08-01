'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.error('PWA SW registration failed:', err);
      });
    }

    // 2. Check iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
      const hasDismissed = localStorage.getItem('pwa_ios_dismissed');
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    }

    // 3. Android Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const hasDismissed = localStorage.getItem('pwa_android_dismissed');
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success('Nothingness app installed to your Home Screen!');
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else if (isIOS) {
      toast.info('Tap Share icon below in Safari & select "Add to Home Screen" 📲');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isIOS) {
      localStorage.setItem('pwa_ios_dismissed', 'true');
    } else {
      localStorage.setItem('pwa_android_dismissed', 'true');
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-50 sm:max-w-sm bg-zinc-950/95 border border-rose-500/30 p-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-slideUp flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-purple-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white flex items-center gap-1">
            Install Nothingness App <Sparkles className="w-3 h-3 text-rose-400" />
          </h4>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            {isIOS ? 'Tap Share → "Add to Home Screen"' : 'Add to Home Screen for fast native access.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-[11px] rounded-lg shadow-md transition-all flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5" />
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-zinc-500 hover:text-white rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
