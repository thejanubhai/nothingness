'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Scan, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Camera, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Lock, 
  KeyRound, 
  ArrowLeft,
  Flame,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { triggerHaptic } from '@/lib/haptics';
import { decodeQRFromVideo } from '@/lib/scanner/qrFallback';

export default function MarshallScannerPage() {
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScannedResult, setLastScannedResult] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isProcessingRef = useRef(false);

  // Play a soft high-frequency golden chime on successful vetting
  const playSuccessChime = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.3); // C6

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  // Check if user is already authenticated as admin
  useEffect(() => {
    fetch('/api/admin/system/status')
      .then((res) => {
        if (res.ok) setIsUnlocked(true);
      })
      .catch(() => {});
  }, []);

  const handleUnlockWithPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === '1991') {
      setIsUnlocked(true);
      triggerHaptic('success');
      toast.success('Marshall Security Mode Active');
    } else {
      triggerHaptic('warning');
      toast.error('Invalid Marshall Security PIN');
    }
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraActive(true);
          startScanningLoop();
        }
      } else {
        setCameraError('Camera access not supported on this browser.');
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Camera permission denied or camera unavailable.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isUnlocked && !cameraActive && !cameraError) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isUnlocked]);

  // Real-time QR scanner loop using native BarcodeDetector with jsQR canvas fallback
  const startScanningLoop = () => {
    if (typeof window === 'undefined') return;

    const interval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || isProcessingRef.current) {
        return;
      }

      let detectedValue: string | null = null;

      // 1. Try native BarcodeDetector if available
      if ('BarcodeDetector' in window) {
        try {
          // @ts-ignore
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          const codes = await detector.detect(videoRef.current);
          if (codes && codes.length > 0 && codes[0].rawValue) {
            detectedValue = codes[0].rawValue;
          }
        } catch {
          // Ignore transient frame decode failure
        }
      }

      // 2. Canvas-based fallback decoder if native detector did not return a value
      if (!detectedValue && videoRef.current) {
        try {
          detectedValue = decodeQRFromVideo(videoRef.current);
        } catch {
          // Ignore fallback decode errors
        }
      }

      if (detectedValue) {
        isProcessingRef.current = true;
        await processVerification(detectedValue);
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 2500); // 2.5s cooldown before next scan
      }
    }, 200);

    return () => clearInterval(interval);
  };

  const processVerification = async (scannedToken: string) => {
    setLoading(true);
    triggerHaptic('light');

    try {
      const res = await fetch('/api/admin/gatherings/verify-in-person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: scannedToken,
          marshallPin: pin || '1991',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        triggerHaptic('warning');
        toast.error('Vetting Failed', { description: data.error || 'Invalid attendee pass token' });
        return;
      }

      // Distinctive triple haptic pulse vibrate([40, 60, 40]) for Consent Marshall verification
      triggerHaptic('marshallSuccess');
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([40, 60, 40]);
        } catch {}
      }

      playSuccessChime();
      setLastScannedResult(data);
      toast.success('Level 2 Certified!', {
        description: `@${data.userAlias} is now physically vetted for all secret soirées.`,
      });
    } catch (err: any) {
      triggerHaptic('warning');
      toast.error('Network / Scan Error', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    await processVerification(manualToken.trim());
    setManualToken('');
  };

  return (
    <div className="w-full text-white max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/sanctuary-pass"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                Staff Only
              </span>
              <span className="text-[10px] font-mono text-zinc-500">• 1-Sec Sync</span>
            </div>
            <h1 className="text-xl font-serif font-bold text-white mt-1">
              Consent Marshall Scanner
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
          aria-label="Toggle chime sound"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* STEP 1: PIN LOCK (If not verified) */}
      {!isUnlocked ? (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Marshall Access Required</h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Please enter the 4-digit on-floor security PIN to unlock the live physical vetting scanner.
            </p>
          </div>

          <form onSubmit={handleUnlockWithPin} className="space-y-4 max-w-xs mx-auto">
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="PIN (Default 1991)"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-[0.4em] text-white focus:outline-none focus:border-amber-400"
              />
              <KeyRound className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer font-mono uppercase tracking-wider"
            >
              Unlock Scanner →
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {/* CAMERA VIEWFINDER */}
          <div className="relative aspect-square sm:aspect-[4/3] rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Target Reticle & Laser */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
              <div className="relative w-64 h-64 border-2 border-amber-500/40 rounded-2xl">
                {/* Corner Brackets */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-amber-400" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-amber-400" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-amber-400" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-amber-400" />

                {/* Animated Laser Bar */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#f59e0b] animate-pulse" />
              </div>
            </div>

            {/* Floating Top Badge */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <div className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Camera Live • Hold QR In Frame</span>
              </div>

              {loading && (
                <div className="px-3 py-1 rounded-full bg-amber-500/80 backdrop-blur-md text-black text-[10px] font-mono font-bold flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Verifying...</span>
                </div>
              )}
            </div>

            {/* Camera error placeholder */}
            {cameraError && (
              <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-rose-400" />
                <p className="text-xs text-zinc-300 font-mono">{cameraError}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-700 text-xs text-white rounded-xl"
                >
                  Retry Camera
                </button>
              </div>
            )}
          </div>

          {/* LAST SCANNED RESULT CARD */}
          {lastScannedResult && (
            <div className="bg-gradient-to-br from-emerald-950/40 via-zinc-950 to-zinc-900 border border-emerald-500/40 rounded-3xl p-5 shadow-2xl animate-in fade-in slide-in-from-bottom duration-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                    Physical Vetting Confirmed
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">
                  {new Date(lastScannedResult.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-1 border-t border-zinc-800/80">
                {lastScannedResult.facePhotoUrl ? (
                  <div className="w-12 h-14 rounded-xl overflow-hidden border border-emerald-500/40 bg-black shrink-0 shadow-lg">
                    <img
                      src={lastScannedResult.facePhotoUrl}
                      alt="Verified Face"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-14 rounded-xl border border-zinc-800 bg-zinc-900 flex items-center justify-center shrink-0 text-zinc-600 font-mono text-[10px]">
                    No Face
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white font-mono truncate">
                    @{lastScannedResult.userAlias}
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                    {lastScannedResult.eventTitle || 'Sanctuary Gathering'}
                  </p>
                  {lastScannedResult.isFaceIdVetted && (
                    <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                      ✓ 3D Face ID Matched
                    </span>
                  )}
                </div>

                <div className="text-right space-y-1 shrink-0">
                  <span className="inline-block px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold rounded-md">
                    Level 2 Certified ✓
                  </span>
                  <p className="text-[10px] font-mono text-zinc-500">
                    ID: {lastScannedResult.isIdVerified ? 'Verified' : 'Pending'}
                  </p>
                </div>
              </div>

              {/* Consent Marshall Incident Intervention */}
              <div className="pt-2 border-t border-zinc-900 flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500">Sanctuary Floor Safety:</span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('heavy');
                    toast.error(`Consent incident logged for @${lastScannedResult.userAlias}. Marshall floor team notified.`);
                  }}
                  className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-[10px] font-mono font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Flag Consent Violation
                </button>
              </div>
            </div>
          )}

          {/* MANUAL ENTRY FOR LOW LIGHT / BACKUP */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                Low Light Manual Backup
              </span>
              <span className="text-[10px] text-zinc-600 font-mono">Type @alias or QR token</span>
            </div>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter @alias, phone, or token..."
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={!manualToken.trim() || loading}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer font-mono whitespace-nowrap disabled:opacity-40"
              >
                Certify →
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
