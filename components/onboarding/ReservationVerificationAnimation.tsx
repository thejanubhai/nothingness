'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';

interface ReservationVerificationAnimationProps {
  imagePreview: string;
  isScanning: boolean;
  platformName?: string;
  isSuccess?: boolean;
  isError?: boolean;
  errorMessage?: string;
  extractedCode?: string;
}

export default function ReservationVerificationAnimation({
  imagePreview,
  isScanning,
  platformName = 'OTA',
  isSuccess = false,
  isError = false,
  errorMessage,
  extractedCode,
}: ReservationVerificationAnimationProps) {
  const [scanStep, setScanStep] = useState(0);

  const steps = [
    'Scanning reservation voucher & platform headers...',
    'Extracting booking confirmation & date coordinates...',
    'Verifying reservation authenticity against sanctuary registry...',
    'Synchronizing primary guest & suite allocation...',
    'Reservation authenticated & linked ✓',
  ];

  useEffect(() => {
    if (!isScanning) {
      if (isSuccess) {
        setScanStep(steps.length - 1);
      } else {
        setScanStep(0);
      }
      return;
    }

    const interval = setInterval(() => {
      setScanStep((prev) => (prev < steps.length - 2 ? prev + 1 : prev));
    }, 700);

    return () => clearInterval(interval);
  }, [isScanning, isSuccess]);

  return (
    <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl flex items-center justify-center select-none group">
      {/* Background Image Preview */}
      <img
        src={imagePreview}
        alt="Reservation Voucher"
        className={`w-full h-full object-contain p-2 transition-all duration-500 ${
          isScanning ? 'filter brightness-90 contrast-105 scale-[1.01]' : ''
        } ${isError ? 'filter grayscale brightness-75' : ''}`}
      />

      {/* Cyber/Optical Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#d4af3708_1px,transparent_1px),linear-gradient(to_bottom,#d4af3708_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

      {/* HUD Corner Targeting Reticles */}
      <div
        className={`absolute top-2.5 left-2.5 w-6 h-6 border-t-2 border-l-2 transition-colors duration-300 ${
          isError
            ? 'border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.7)]'
            : isSuccess
            ? 'border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]'
            : 'border-accent-gold shadow-[0_0_12px_rgba(212,175,55,0.7)]'
        }`}
      />
      <div
        className={`absolute top-2.5 right-2.5 w-6 h-6 border-t-2 border-r-2 transition-colors duration-300 ${
          isError
            ? 'border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.7)]'
            : isSuccess
            ? 'border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]'
            : 'border-accent-gold shadow-[0_0_12px_rgba(212,175,55,0.7)]'
        }`}
      />
      <div
        className={`absolute bottom-2.5 left-2.5 w-6 h-6 border-b-2 border-l-2 transition-colors duration-300 ${
          isError
            ? 'border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.7)]'
            : isSuccess
            ? 'border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]'
            : 'border-accent-gold shadow-[0_0_12px_rgba(212,175,55,0.7)]'
        }`}
      />
      <div
        className={`absolute bottom-2.5 right-2.5 w-6 h-6 border-b-2 border-r-2 transition-colors duration-300 ${
          isError
            ? 'border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.7)]'
            : isSuccess
            ? 'border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]'
            : 'border-accent-gold shadow-[0_0_12px_rgba(212,175,55,0.7)]'
        }`}
      />

      {/* Floating HUD Badges */}
      <div className="absolute top-3 left-10 flex items-center gap-2 pointer-events-none">
        <span className="px-2 py-0.5 rounded-md bg-black/80 border border-white/10 text-[9px] font-mono uppercase tracking-wider text-zinc-300">
          GATEWAY: <strong className="text-accent-gold">{platformName}</strong>
        </span>
        {extractedCode && (
          <span className="px-2 py-0.5 rounded-md bg-black/80 border border-accent-gold/40 text-[9px] font-mono text-accent-gold font-bold">
            CODE: #{extractedCode}
          </span>
        )}
      </div>

      {/* Active Scanning Laser Beam (GPU-accelerated via framer-motion) */}
      {isScanning && !isError && (
        <motion.div
          animate={{
            top: ['5%', '92%', '5%'],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent-gold to-transparent shadow-[0_0_20px_#d4af37,0_0_35px_#d4af37] pointer-events-none z-10"
        />
      )}

      {/* Scanning Target Center Ring */}
      {isScanning && !isError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full border border-accent-gold/30 flex items-center justify-center animate-ping opacity-30" />
          <div className="w-32 h-32 rounded-full border border-accent-gold/15 pointer-events-none" />
        </div>
      )}

      {/* Dynamic Status Bar at Bottom */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 max-w-[90%] pointer-events-none z-20">
        {isError ? (
          <div className="bg-rose-950/90 backdrop-blur-md border border-rose-500/50 px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-2xl">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-[10px] font-mono font-semibold text-rose-200 truncate">
              {errorMessage || 'Invalid reservation document. Verification failed.'}
            </span>
          </div>
        ) : isSuccess ? (
          <div className="bg-emerald-950/90 backdrop-blur-md border border-emerald-500/50 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-2xl">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-wider">
              Reservation Verified &amp; Linked ✓
            </span>
          </div>
        ) : isScanning ? (
          <div className="bg-black/90 backdrop-blur-md border border-accent-gold/40 px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-2xl">
            <div className="w-2 h-2 rounded-full bg-accent-gold animate-ping shrink-0" />
            <span className="text-[10px] font-mono font-semibold text-accent-gold uppercase tracking-wider truncate">
              {steps[scanStep]}
            </span>
          </div>
        ) : (
          <div className="bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-mono text-zinc-400">
            Tap &apos;Change Photo&apos; to replace
          </div>
        )}
      </div>
    </div>
  );
}
