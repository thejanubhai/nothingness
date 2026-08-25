'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, Lock, Sparkles, Scan, Eye } from 'lucide-react';

interface IDScanningAnimationProps {
  imagePreview: string;
  isScanning: boolean;
  onScanComplete?: () => void;
  documentType?: string;
}

export default function IDScanningAnimation({
  imagePreview,
  isScanning,
  documentType = 'Government ID'
}: IDScanningAnimationProps) {
  const [scanStep, setScanStep] = useState(0);

  const steps = [
    'Scanning Optical Security Hologram...',
    'Extracting Govt Identity Coordinates...',
    'Validating Residential Address...',
    'Authenticating 180-Day Vetting Protocol...',
    'Identity Verified & Secured ✓'
  ];

  useEffect(() => {
    if (!isScanning) {
      setScanStep(0);
      return;
    }

    const interval = setInterval(() => {
      setScanStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 450);

    return () => clearInterval(interval);
  }, [isScanning]);

  return (
    <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-accent-gold/40 bg-black/90 shadow-2xl flex items-center justify-center select-none">
      
      {/* Background ID Image */}
      <img
        src={imagePreview}
        alt="Government ID"
        className={`w-full h-full object-contain p-2 transition-all duration-700 ${
          isScanning ? 'filter brightness-90 contrast-110' : ''
        }`}
      />

      {/* Optical HUD Scanner Overlay (Active when scanning) */}
      {isScanning && (
        <div className="absolute inset-0 pointer-events-none">
          
          {/* Subtle Cyber/Optical Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#d4af3710_1px,transparent_1px),linear-gradient(to_bottom,#d4af3710_1px,transparent_1px)] bg-[size:16px_16px] opacity-40" />

          {/* 4 Corner Targeting HUD Brackets */}
          <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-accent-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
          <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-accent-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-accent-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-accent-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]" />

          {/* Laser Scanning Beam (Vertical sweep) */}
          <div 
            className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-accent-gold to-transparent shadow-[0_0_20px_#d4af37,0_0_35px_#d4af37] animate-laser-sweep"
            style={{
              animation: 'laserSweep 1.8s ease-in-out infinite alternate'
            }}
          />

          {/* Glowing Target Center Node */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border border-accent-gold/40 flex items-center justify-center animate-ping opacity-25" />
          </div>

          {/* Optical Targeting Points */}
          <div className="absolute top-6 left-8 flex items-center gap-1.5 bg-black/70 border border-accent-gold/30 px-2 py-0.5 rounded-full text-[9px] font-mono text-accent-gold animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
            <span>NAME_MATCH</span>
          </div>

          <div className="absolute bottom-8 right-6 flex items-center gap-1.5 bg-black/70 border border-green-500/30 px-2 py-0.5 rounded-full text-[9px] font-mono text-green-400 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span>180_DAY_VALID</span>
          </div>

          {/* Live Step Status Pill at Bottom */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-black/85 backdrop-blur-md border border-accent-gold/40 px-3.5 py-1 rounded-full flex items-center gap-2 shadow-2xl whitespace-nowrap">
            <div className="w-2 h-2 rounded-full bg-accent-gold animate-ping" />
            <span className="text-[10px] font-mono font-bold text-accent-gold uppercase tracking-wider">
              {steps[scanStep]}
            </span>
          </div>
        </div>
      )}

      {/* Embedded CSS for smooth Laser Sweep Animation */}
      <style jsx>{`
        @keyframes laserSweep {
          0% {
            top: 5%;
            opacity: 0.7;
          }
          50% {
            top: 92%;
            opacity: 1;
          }
          100% {
            top: 5%;
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}
