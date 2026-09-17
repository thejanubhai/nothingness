'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Sparkles,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Copy,
  ArrowRight,
  RefreshCw,
  Share2,
  Calendar,
  Building2,
  Flame,
  Users,
  KeyRound,
  ExternalLink,
  ChevronRight,
  UploadCloud,
  Check,
  Phone,
  Ticket,
} from 'lucide-react';
import { toast } from 'sonner';
import { PLATFORMS, type SupportedPlatform } from '@/components/icons/BookingPlatformLogos';
import ReservationVerificationAnimation from '@/components/onboarding/ReservationVerificationAnimation';
import IDScanningAnimation from '@/components/IDScanningAnimation';
import IDUploadModal from '@/components/IDUploadModal';

async function compressImage(file: File, maxDim = 1280, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

interface DualTrackOnboardingProps {
  initialUser?: {
    id: string;
    phone?: string;
    email?: string;
  } | null;
  onComplete?: () => void;
  compactMode?: boolean;
}

export default function DualTrackOnboarding({
  initialUser,
  onComplete,
  compactMode = false,
}: DualTrackOnboardingProps) {
  const [selectedTrack, setSelectedTrack] = useState<'stay' | 'lifestyle' | null>(null);

  // Track 1: Stay Flow State
  const [selectedPlatform, setSelectedPlatform] = useState<SupportedPlatform>('airbnb');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);
  const [verifiedBooking, setVerifiedBooking] = useState<any>(null);
  const [showManualConfirmation, setShowManualConfirmation] = useState(false);
  const [availableSpaces, setAvailableSpaces] = useState<any[]>([]);

  // Manual Confirmation Fields
  const [manualCode, setManualCode] = useState('');
  const [manualCheckIn, setManualCheckIn] = useState('');
  const [manualCheckOut, setManualCheckOut] = useState('');
  const [manualSpaceId, setManualSpaceId] = useState('');
  const [manualPrimaryName, setManualPrimaryName] = useState('');

  // ID Upload Modal State
  const [idModalOpen, setIdModalOpen] = useState(false);
  const [verifyingGuestType, setVerifyingGuestType] = useState<'primary' | 'co-guest'>('primary');
  const [primaryVerified, setPrimaryVerified] = useState(false);
  const [coGuestVerified, setCoGuestVerified] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScreenshotSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image screenshot.');
      return;
    }

    setScanError(null);
    setScanSuccess(false);

    try {
      const b64 = await compressImage(file);
      if (!b64) return;
      setScreenshots([b64]);
      analyzeScreenshot([b64]);
    } catch (compressErr) {
      console.warn('Compression fallback:', compressErr);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const raw = ev.target?.result as string;
        setScreenshots([raw]);
        analyzeScreenshot([raw]);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeScreenshot = async (imgs: string[]) => {
    setAnalyzing(true);
    setScanError(null);
    setScanSuccess(false);
    setScanStep(1);
    toast.loading('Authenticating reservation voucher & coordinates...');

    const stepTimer = setTimeout(() => setScanStep(2), 1200);

    try {
      const res = await fetch('/api/bookings/verify-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenshots: imgs,
          platform: selectedPlatform,
        }),
      });

      clearTimeout(stepTimer);
      toast.dismiss();
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.is_invalid_document) {
          // Reject Government IDs, human portraits, selfies, or non-booking photos
          setScanError(data.error || 'The uploaded photo is not a valid booking confirmation.');
          setShowManualConfirmation(false);
          toast.error(data.is_government_id ? 'Government ID Detected (Not a Voucher)' : 'Verification Failed: Invalid Document', {
            description: data.error || 'Please upload an official booking voucher screenshot.',
          });
          return;
        }

        if (data.requires_manual_confirmation) {
          setShowManualConfirmation(true);
          setManualCode(data.extracted?.reservation_code || '');
          setManualCheckIn(data.extracted?.check_in || '');
          setManualCheckOut(data.extracted?.check_out || '');
          setManualSpaceId(data.extracted?.space_id || '');
          setAvailableSpaces(data.available_spaces || []);
          toast.info('Please confirm reservation code & dates to complete linking.');
          return;
        }

        throw new Error(data.error || 'Failed to parse reservation.');
      }

      setScanSuccess(true);
      setVerifiedBooking(data);
      if (data.primary_guest?.is_verified) {
        setPrimaryVerified(true);
      }
      toast.success('Reservation verified & linked!', {
        description: `Confirmation #${data.reservation_code} connected to your profile.`,
      });
    } catch (err: any) {
      toast.dismiss();
      setScanError(err.message || 'Could not verify reservation.');
      toast.error(err.message || 'Failed to authenticate reservation voucher.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleManualConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      toast.error('Please enter your reservation number or confirmation code.');
      return;
    }
    if (!manualCheckIn) {
      toast.error('Please select your check-in date.');
      return;
    }

    setAnalyzing(true);
    toast.loading('Linking reservation to your profile...');

    try {
      const res = await fetch('/api/bookings/verify-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmedCode: manualCode.trim(),
          confirmedCheckIn: manualCheckIn,
          confirmedCheckOut: manualCheckOut || undefined,
          confirmedSpaceId: manualSpaceId || undefined,
          platform: selectedPlatform,
          primaryName: manualPrimaryName || undefined,
        }),
      });

      toast.dismiss();
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to link booking.');
      }

      setVerifiedBooking(data);
      setShowManualConfirmation(false);
      if (data.primary_guest?.is_verified) {
        setPrimaryVerified(true);
      }
      toast.success('Reservation linked to profile!', {
        description: `Confirmation #${data.reservation_code} is active.`,
      });
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || 'Failed to link reservation.');
    } finally {
      setAnalyzing(false);
    }
  };

  const copyCoGuestLink = () => {
    if (!verifiedBooking?.co_guest_invite_url) return;
    navigator.clipboard.writeText(verifiedBooking.co_guest_invite_url);
    toast.success('Invite link copied!', {
      description: 'Send this link to your accompanying guest for 30-second digital check-in.',
    });
  };

  const openWhatsApp = () => {
    if (!verifiedBooking?.whatsapp_share_url) return;
    window.open(verifiedBooking.whatsapp_share_url, '_blank');
  };

  return (
    <section className="w-full relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-72 bg-accent-gold/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full bg-zinc-950/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-xl">
        {/* Onboarding Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-zinc-400 mb-3 uppercase tracking-widest">
            <Sparkles className="w-3 h-3 text-accent-gold" />
            Personalize Your Experience
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-white font-bold tracking-tight mb-2">
            Welcome to Nothingness
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
            Select what brings you here today to unlock immediate access and custom privileges.
          </p>
        </div>

        {/* Dual Track Choice Selector */}
        {!selectedTrack && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
              {/* Track 1: Sanctuary Stay Booking */}
              <motion.div
                whileHover={{ scale: 1.015, y: -2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedTrack('stay')}
                className="cursor-pointer bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800 hover:border-accent-gold/60 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 shadow-xl group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/10 rounded-full blur-2xl pointer-events-none group-hover:bg-accent-gold/20 transition-all" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center text-accent-gold group-hover:scale-110 transition-transform">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-accent-gold bg-accent-gold/10 px-2.5 py-1 rounded-full border border-accent-gold/20">
                      Stay Guests
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-serif font-bold text-white mb-2 group-hover:text-accent-gold transition-colors">
                    I have a Sanctuary Stay Booking
                  </h3>
                  <p className="text-zinc-400 text-xs leading-relaxed mb-5">
                    Booked on <strong className="text-zinc-200">Airbnb, MakeMyTrip, Agoda, Booking.com</strong> or Direct? Complete your digital Police ID check-in, generate digital key passcodes, and invite your co-guest.
                  </p>

                  {/* Compact Logo Strip */}
                  <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800/80 mb-4 flex items-center justify-between gap-2">
                    {PLATFORMS.map((p) => {
                      const Logo = p.Logo;
                      return (
                        <div
                          key={p.id}
                          className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg bg-white/[0.02]"
                          title={p.name}
                        >
                          <Logo size={20} className="mb-0.5" />
                          <span className="text-[8px] font-mono text-zinc-500 truncate max-w-[48px]">
                            {p.name.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-accent-gold group-hover:translate-x-1 transition-transform pt-2 border-t border-zinc-800/60">
                  <span>Verify Stay &amp; Add Guests</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>

              {/* Track 2: Lifestyle, Events & Membership */}
              <motion.div
                whileHover={{ scale: 1.015, y: -2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedTrack('lifestyle')}
                className="cursor-pointer bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800 hover:border-rose-500/60 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 shadow-xl group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-500/20 transition-all" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                      <Flame className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                      Community &amp; Pass
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-serif font-bold text-white mb-2 group-hover:text-rose-400 transition-colors">
                    Lifestyle, Events &amp; Membership
                  </h3>
                  <p className="text-zinc-400 text-xs leading-relaxed mb-5">
                    Looking for vetted adult community connections, private blind date nights, 6-month sanctuary lounge passes, or listing luxury properties as a host partner.
                  </p>

                  {/* Badges preview */}
                  <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-xl bg-black/40 border border-zinc-800/80 mb-4 text-[10px] font-mono text-zinc-400">
                    <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-white/[0.02]">
                      <Flame className="w-3.5 h-3.5 text-rose-400 mb-0.5" />
                      <span>Kinkster</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-white/[0.02]">
                      <Ticket className="w-3.5 h-3.5 text-accent-gold mb-0.5" />
                      <span>Events</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-white/[0.02]">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
                      <span>Partner</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-rose-400 group-hover:translate-x-1 transition-transform pt-2 border-t border-zinc-800/60">
                  <span>Explore Memberships</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            </div>

            <div className="text-center mt-6">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <span>Skip onboarding and proceed directly to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* TRACK 1 ACTIVE VIEW: SANCTUARY STAY & OTA CHECK-IN                         */}
        {/* ========================================================================= */}
        {selectedTrack === 'stay' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Back to track selector */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedTrack(null);
                  setVerifiedBooking(null);
                  setShowManualConfirmation(false);
                }}
                className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                ← Change Pathway
              </button>
              <span className="text-[10px] font-mono text-accent-gold uppercase tracking-wider">
                Sanctuary Check-In &amp; Guest Vetting
              </span>
            </div>

            {/* If booking not verified yet: Step 1 Upload & Select Platform */}
            {!verifiedBooking && (
              <div className="space-y-6">
                {/* Platform Selector */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2">
                    Where did you make this booking?
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {PLATFORMS.map((p) => {
                      const Logo = p.Logo;
                      const isSelected = selectedPlatform === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPlatform(p.id)}
                          className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-zinc-800 border-accent-gold text-white shadow-lg'
                              : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <Logo size={22} />
                          <span className="text-[9px] font-mono truncate w-full text-center">
                            {p.name.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Screenshot Upload Dropzone */}
                {!showManualConfirmation && (
                  <div className="space-y-3">
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                      Upload Booking Reservation Screenshot
                    </label>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Upload a clear screenshot of your confirmation screen from your{' '}
                      <strong className="text-white capitalize">{selectedPlatform}</strong> app or email. Make sure the{' '}
                      <span className="text-accent-gold font-semibold">Reservation Number</span> and{' '}
                      <span className="text-accent-gold font-semibold">Dates</span> are visible.
                    </p>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleScreenshotSelect}
                      accept="image/*"
                      className="hidden"
                    />

                    {screenshots.length === 0 ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-zinc-800 hover:border-accent-gold/60 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-zinc-900/30 hover:bg-zinc-900/60 transition-all cursor-pointer group"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center text-accent-gold group-hover:scale-110 transition-transform">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-semibold text-white">Click or Tap to Upload Screenshot</p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            Camera photo or Screenshot (PNG, JPG, HEIC up to 10MB)
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative rounded-2xl overflow-hidden border border-zinc-800">
                        <ReservationVerificationAnimation
                          imagePreview={screenshots[0]}
                          isScanning={analyzing}
                          platformName={selectedPlatform?.toUpperCase()}
                          isSuccess={scanSuccess}
                          isError={Boolean(scanError)}
                          errorMessage={scanError || undefined}
                          extractedCode={verifiedBooking?.reservation_code}
                        />
                        <div className="absolute top-2.5 right-2.5 flex gap-2 z-30">
                          <button
                            type="button"
                            onClick={() => {
                              setScreenshots([]);
                              setScanError(null);
                              setScanSuccess(false);
                              fileInputRef.current?.click();
                            }}
                            disabled={analyzing}
                            className="px-3 py-1 bg-black/85 hover:bg-accent-gold hover:text-black border border-white/20 text-white rounded-lg text-[10px] font-mono transition-colors cursor-pointer shadow-md"
                          >
                            Change Photo
                          </button>
                        </div>
                      </div>
                    )}

                    {scanError && (
                      <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex flex-col gap-2 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 font-bold text-rose-300">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>
                            {scanError.toLowerCase().includes('government id') || scanError.toLowerCase().includes('aadhaar')
                              ? 'Government ID Detected (Voucher Required)'
                              : 'Non-Reservation Document Detected'}
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-200/90 leading-relaxed font-mono">
                          {scanError}
                        </p>
                        <div className="flex items-center gap-3 pt-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setScreenshots([]);
                              setScanError(null);
                              fileInputRef.current?.click();
                            }}
                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-mono font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Upload Official Booking Voucher
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTrack('lifestyle');
                              setScanError(null);
                              setScreenshots([]);
                            }}
                            className="text-[11px] font-mono text-zinc-400 hover:text-white underline cursor-pointer"
                          >
                            New Guest / Lifestyle Member? Onboard here →
                          </button>
                        </div>
                      </div>
                    )}

                    {analyzing && (
                      <div className="p-4 rounded-xl bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-xs flex items-center gap-3 font-mono">
                        <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                        <span>Verifying booking confirmation and synchronizing guest ledger...</span>
                      </div>
                    )}

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => setShowManualConfirmation(true)}
                        className="text-[11px] font-mono text-zinc-500 hover:text-accent-gold underline cursor-pointer"
                      >
                        Can&apos;t upload screenshot? Enter reservation number manually →
                      </button>
                    </div>
                  </div>
                )}

                {/* Manual Confirmation Fallback Form */}
                {showManualConfirmation && (
                  <form onSubmit={handleManualConfirm} className="space-y-4 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                        Confirm Reservation Details
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowManualConfirmation(false)}
                        className="text-[10px] font-mono text-zinc-400 hover:text-white"
                      >
                        Upload Screenshot Instead
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                        Reservation Confirmation Code *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. HM8X7Y9Z or MMT123456"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-accent-gold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                          Check-In Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={manualCheckIn}
                          onChange={(e) => setManualCheckIn(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-accent-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                          Check-Out Date
                        </label>
                        <input
                          type="date"
                          value={manualCheckOut}
                          onChange={(e) => setManualCheckOut(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-accent-gold"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={analyzing || !manualCode.trim() || !manualCheckIn}
                      className="w-full py-3.5 bg-accent-gold hover:bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>Link Reservation &amp; Continue</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* If booking IS verified & linked: Step 2 ID & Add Guest */}
            {verifiedBooking && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Linked Booking Header Card */}
                <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                        Reservation Verified • {verifiedBooking.platform?.toUpperCase()}
                      </span>
                      <h4 className="text-base font-bold text-white font-serif mt-0.5">
                        {verifiedBooking.space?.title || 'Nothingness Sanctuary'}
                      </h4>
                      <p className="text-xs text-zinc-400 font-mono mt-1">
                        Code: <span className="text-white font-bold">{verifiedBooking.reservation_code}</span> • Dates:{' '}
                        {verifiedBooking.check_in} → {verifiedBooking.check_out}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section Header */}
                <div className="border-b border-zinc-800 pb-2 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white font-serif">
                    Statutory ID Verification (Police Compliance)
                  </h4>
                  <span className="text-[10px] font-mono text-zinc-400">2 Guests Maximum</span>
                </div>

                {/* Guest 1: Primary Guest */}
                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-accent-gold bg-accent-gold/10 px-2 py-0.5 rounded border border-accent-gold/20">
                        Primary Guest
                      </span>
                      {primaryVerified && (
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                          ✓ 180-Day Vetted
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-white mt-1">
                      {verifiedBooking.primary_guest?.name || initialUser?.phone || 'You (Primary Booker)'}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {primaryVerified
                        ? 'Government ID verified and stored on digital police register.'
                        : 'Aadhaar Card or Passport (Front & Back) required.'}
                    </p>
                  </div>

                  {!primaryVerified ? (
                    <button
                      type="button"
                      onClick={() => {
                        setVerifyingGuestType('primary');
                        setIdModalOpen(true);
                      }}
                      className="px-5 py-2.5 bg-accent-gold hover:bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Upload My ID</span>
                    </button>
                  ) : (
                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>

                {/* Guest 2: Add Co-Guest */}
                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                          Accompanying Guest
                        </span>
                        {coGuestVerified && (
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-white mt-1">
                        Co-Guest / Partner Verification
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Upload ID on their behalf or send them a WhatsApp link to verify directly.
                      </p>
                    </div>

                    {coGuestVerified && (
                      <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>

                  {!coGuestVerified && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80">
                      {/* Action A: Direct Upload */}
                      <button
                        type="button"
                        onClick={() => {
                          setVerifyingGuestType('co-guest');
                          setIdModalOpen(true);
                        }}
                        className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-xl text-xs font-bold uppercase font-mono tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <ShieldCheck className="w-4 h-4 text-accent-gold" />
                        <span>Upload Co-Guest ID</span>
                      </button>

                      {/* Action B: 1-Click WhatsApp Invite */}
                      <button
                        type="button"
                        onClick={openWhatsApp}
                        className="py-3 px-4 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 rounded-xl text-xs font-bold uppercase font-mono tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Send WhatsApp Invite</span>
                      </button>
                    </div>
                  )}

                  {/* Copy Link fallback */}
                  {!coGuestVerified && (
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-1">
                      <span>Co-guest direct link:</span>
                      <button
                        type="button"
                        onClick={copyCoGuestLink}
                        className="text-accent-gold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" /> Copy Invite Link
                      </button>
                    </div>
                  )}
                </div>

                {/* Next Step / Complete */}
                <div className="pt-4 flex justify-end">
                  <Link
                    href="/dashboard"
                    className="px-6 py-3 bg-white text-black hover:bg-accent-gold font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl flex items-center gap-2"
                  >
                    <span>Enter My Sanctuary Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TRACK 2 ACTIVE VIEW: LIFESTYLE, EVENTS & PARTNER MEMBERSHIP               */}
        {/* ========================================================================= */}
        {selectedTrack === 'lifestyle' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <button
                type="button"
                onClick={() => setSelectedTrack(null)}
                className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                ← Change Pathway
              </button>
              <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider">
                Lifestyle, Events &amp; Membership Hub
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Kinkster */}
              <Link
                href="/kinksters"
                className="bg-zinc-900/70 border border-zinc-800 hover:border-rose-500/60 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 group hover:bg-zinc-900 shadow-lg"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3 group-hover:scale-110 transition-transform">
                    <Flame className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-rose-400 font-bold">
                    Adult Network
                  </span>
                  <h4 className="text-base font-bold text-white font-serif mt-1 mb-2 group-hover:text-rose-400 transition-colors">
                    Vetted Kinkster
                  </h4>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Anonymous aliases, blind resonance matchmaking, clean health vetting, and verified adult sanctuary network.
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-rose-400 pt-4 mt-4 border-t border-zinc-800/80 group-hover:translate-x-1 transition-transform">
                  <span>Explore Network</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              {/* Card 2: Events & Sanctuary Pass */}
              <Link
                href="/sanctuary-pass"
                className="bg-zinc-900/70 border border-zinc-800 hover:border-accent-gold/60 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 group hover:bg-zinc-900 shadow-lg"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center text-accent-gold mb-3 group-hover:scale-110 transition-transform">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-accent-gold font-bold">
                    Exclusive Pass
                  </span>
                  <h4 className="text-base font-bold text-white font-serif mt-1 mb-2 group-hover:text-accent-gold transition-colors">
                    Events &amp; Pass
                  </h4>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    6-Month Sanctuary Pass for private lounge access, blind date nights, and RSVP access to curated invite-only gatherings.
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-accent-gold pt-4 mt-4 border-t border-zinc-800/80 group-hover:translate-x-1 transition-transform">
                  <span>View Passes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              {/* Card 3: Host Partner & Franchise */}
              <Link
                href="/partner"
                className="bg-zinc-900/70 border border-zinc-800 hover:border-amber-500/60 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 group hover:bg-zinc-900 shadow-lg"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                    Host Partner
                  </span>
                  <h4 className="text-base font-bold text-white font-serif mt-1 mb-2 group-hover:text-amber-400 transition-colors">
                    Property Franchise
                  </h4>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Convert luxury real estate into high-yield sensual sanctuaries. 100% passive yield, digital lockbox, police automation.
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-amber-400 pt-4 mt-4 border-t border-zinc-800/80 group-hover:translate-x-1 transition-transform">
                  <span>Host Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Embedded ID Upload Modal */}
      {idModalOpen && (
        <IDUploadModal
          isOpen={idModalOpen}
          onClose={() => setIdModalOpen(false)}
          bookingId={verifiedBooking?.booking_id}
          guestId={
            verifyingGuestType === 'primary'
              ? verifiedBooking?.primary_guest?.id
              : verifiedBooking?.co_guest?.id
          }
          token={
            verifyingGuestType === 'primary'
              ? verifiedBooking?.primary_guest?.token
              : verifiedBooking?.co_guest?.token
          }
          phone={
            verifyingGuestType === 'primary'
              ? initialUser?.phone || verifiedBooking?.primary_guest?.phone
              : undefined
          }
          onSuccess={(name) => {
            setIdModalOpen(false);
            if (verifyingGuestType === 'primary') {
              setPrimaryVerified(true);
              toast.success(`Primary Guest (${name}) ID verified!`);
            } else {
              setCoGuestVerified(true);
              toast.success(`Co-Guest (${name}) ID verified!`);
            }
          }}
        />
      )}
    </section>
  );
}
