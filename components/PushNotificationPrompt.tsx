'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Sparkles, Check, X, Shield } from 'lucide-react';
import { toast } from 'sonner';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationPrompt() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDismissed = localStorage.getItem('sanctuary_push_dismissed') === 'true';
      const isSavedSubscribed = localStorage.getItem('sanctuary_push_subscribed') === 'true';

      if (isDismissed) setDismissed(true);

      if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
        setIsSupported(true);
        if (Notification.permission === 'granted' || isSavedSubscribed) {
          setIsSubscribed(true);
        }

        navigator.serviceWorker.ready.then((registration) => {
          registration.pushManager.getSubscription().then((sub) => {
            if (sub || Notification.permission === 'granted') {
              setIsSubscribed(true);
              localStorage.setItem('sanctuary_push_subscribed', 'true');
            }
          }).catch(() => {});
        }).catch(() => {});
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sanctuary_push_dismissed', 'true');
    }
  };

  const subscribeUser = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Notification permission was declined.', {
          description: 'You can enable it in your browser / device settings.'
        });
        setLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_FIREBASE_WEBPUSH_CERTIFICATE || process.env.FIREBASE_WEBPUSH_CERTIFICATE;

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription && vapidPublicKey) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      if (subscription) {
        const subJson = subscription.toJSON();
        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: subJson.keys,
            userAgent: navigator.userAgent,
          }),
        });

        if (res.ok) {
          setIsSubscribed(true);
          if (typeof window !== 'undefined') {
            localStorage.setItem('sanctuary_push_subscribed', 'true');
          }
          toast.success('Discreet Alerts Enabled', {
            description: 'You will receive secret coordinates, waitlist calls, and door access on your screen.'
          });
        }
      } else {
        setIsSubscribed(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('sanctuary_push_subscribed', 'true');
        }
      }
    } catch (err: any) {
      console.error('Push subscription failed:', err);
      toast.error('Failed to enable push notifications', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported || isSubscribed || dismissed) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/30 border border-amber-500/20 p-4 sm:p-5 shadow-2xl mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Stealth Lockscreen Push
              </span>
              <span className="text-[9px] bg-white/5 border border-white/10 text-white/60 px-1.5 py-0.5 rounded">
                Zero WhatsApp
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mt-0.5">
              Enable Discreet Sanctuary &amp; Gathering Alerts
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5 max-w-xl leading-relaxed">
              Receive confidential event coordinates (T-3h), door QR access, and dynamic waitlist slot calls directly on your device.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          <button
            onClick={handleDismiss}
            className="p-2 text-zinc-500 hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={subscribeUser}
            disabled={loading}
            className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            {loading ? (
              <span className="animate-pulse">Activating...</span>
            ) : (
              <>
                <Shield className="w-3.5 h-3.5" />
                <span>Enable Alerts</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
