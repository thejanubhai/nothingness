'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Building2, 
  Flame, 
  ArrowRight, 
  Calendar as CalendarIcon, 
  User, 
  Mail, 
  Smartphone, 
  CheckCircle2, 
  Sparkles, 
  Scan, 
  Camera,
  QrCode,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Compass,
  KeyRound,
  X,
  Eye,
  MessageCircle,
  Ticket
} from 'lucide-react';
import IDUploadModal from '@/components/IDUploadModal';
import FaceIdScanModal from '@/components/FaceIdScanModal';
import CancelBookingButton from '@/components/CancelBookingButton';
import CloudinaryImage from '@/components/CloudinaryImage';
import { toast } from 'sonner';
import QRCode from 'qrcode';

interface UserDashboardClientProps {
  user: {
    id: string;
    phone?: string;
    email?: string;
    email_confirmed_at?: string;
  };
  profile: {
    id?: string;
    full_name?: string;
    id_document_type?: string;
    id_document_number?: string;
    is_verified?: boolean;
    verification_expires_at?: string;
    created_at?: string;
    face_id_vetted?: boolean;
    live_face_url?: string;
    face_id_vetted_at?: string;
    police_register_status?: string;
  } | null;
  kinksterProfile: any | null;
  sanctuaryPass?: any | null;
  upcomingBookings: any[];
  pastBookings?: any[];
  totalStays?: number;
  sovereignTier?: string;
}

export default function UserDashboardClient({
  user,
  profile,
  kinksterProfile,
  sanctuaryPass,
  upcomingBookings,
  pastBookings = [],
  totalStays = 0,
  sovereignTier = 'Tier I: Member in Onboarding',
}: UserDashboardClientProps) {
  const [showIdModal, setShowIdModal] = useState(false);
  const [showFaceIdModal, setShowFaceIdModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [activePersona, setActivePersona] = useState<'civilian' | 'lifestyle'>('civilian');
  const [copiedGuestId, setCopiedGuestId] = useState<string | null>(null);

  const [isVerified, setIsVerified] = useState(profile?.is_verified ?? false);
  const [verifiedName, setVerifiedName] = useState(profile?.full_name || '');
  const [docType, setDocType] = useState(profile?.id_document_type || '');
  const [isFaceIdVetted, setIsFaceIdVetted] = useState(Boolean(profile?.face_id_vetted));
  const [liveFaceUrl, setLiveFaceUrl] = useState(profile?.live_face_url || '');
  const [bookings, setBookings] = useState<any[]>(upcomingBookings || []);
  const [pastStays, setPastStays] = useState<any[]>(pastBookings || []);
  const [currentPass, setCurrentPass] = useState(sanctuaryPass);
  const [currentKinkster, setCurrentKinkster] = useState(kinksterProfile);

  useEffect(() => {
    setIsVerified(profile?.is_verified ?? false);
    setVerifiedName(profile?.full_name || '');
    setDocType(profile?.id_document_type || '');
    setIsFaceIdVetted(Boolean(profile?.face_id_vetted));
    setLiveFaceUrl(profile?.live_face_url || '');
  }, [profile]);

  useEffect(() => {
    setBookings(upcomingBookings || []);
  }, [upcomingBookings]);

  useEffect(() => {
    setPastStays(pastBookings || []);
  }, [pastBookings]);

  useEffect(() => {
    setCurrentPass(sanctuaryPass);
  }, [sanctuaryPass]);

  useEffect(() => {
    setCurrentKinkster(kinksterProfile);
  }, [kinksterProfile]);

  // Real-time synchronization with Supabase
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`realtime-user-dashboard-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sanctuary_passes' },
        (payload) => {
          if (payload.new && ((payload.new as any).user_id === user.id || (payload.new as any).guest_profile_id === profile?.id)) {
            setCurrentPass(payload.new);
          } else if (payload.eventType === 'DELETE') {
            setCurrentPass(null);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kinkster_profiles' },
        (payload) => {
          if (payload.new && ((payload.new as any).id === user.id || (payload.new as any).guest_profile_id === profile?.id)) {
            setCurrentKinkster(payload.new);
          } else if (payload.eventType === 'DELETE') {
            setCurrentKinkster(null);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'guest_profiles' },
        (payload) => {
          if (payload.new && (payload.new as any).id === profile?.id) {
            setIsVerified((payload.new as any).is_verified);
            setIsFaceIdVetted((payload.new as any).face_id_vetted);
            if ((payload.new as any).live_face_url) setLiveFaceUrl((payload.new as any).live_face_url);
            if ((payload.new as any).full_name) setVerifiedName((payload.new as any).full_name);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, profile?.id]);

  // Generate Digital Sanctuary Pass QR Code
  useEffect(() => {
    const generateQr = async () => {
      try {
        const payload = JSON.stringify({
          entity: 'nothingness_sovereign_pass',
          uid: user.id,
          pid: profile?.id || null,
          v: isVerified,
          fid: isFaceIdVetted,
          alias: currentKinkster?.alias || null,
          tier: sovereignTier,
          issued: new Date().toISOString(),
        });
        const url = await QRCode.toDataURL(payload, {
          width: 320,
          margin: 2,
          color: {
            dark: '#D4AF37',
            light: '#000000',
          },
        });
        setQrCodeDataUrl(url);
      } catch (err) {
        console.error('QR generation error:', err);
      }
    };
    generateQr();
  }, [user.id, profile?.id, isVerified, isFaceIdVetted, currentKinkster?.alias, sovereignTier]);

  // Calculate Days Left for 180-day ID validity
  let daysLeft = 0;
  if (isVerified) {
    const expiresDate = profile?.verification_expires_at 
      ? new Date(profile.verification_expires_at)
      : profile?.created_at 
        ? new Date(new Date(profile.created_at).getTime() + 180 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

    const timeDiff = expiresDate.getTime() - Date.now();
    daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (daysLeft < 0) daysLeft = 0;
  }

  // Helper to identify booking source (Airbnb, MakeMyTrip, Agoda, Booking.com, or Direct)
  const getStaySource = (booking: any) => {
    const note = (booking.special_requests || '').toUpperCase();
    const orderId = (booking.payment_order_id || '').toUpperCase();
    if (note.includes('AIRBNB') || orderId.startsWith('HM') || orderId.startsWith('AIRBNB')) {
      return { 
        name: 'Airbnb Reservation', 
        badge: 'AIRBNB VERIFIED',
        tagColor: 'bg-rose-500/15 border-rose-500/30 text-rose-400' 
      };
    }
    if (note.includes('MAKEMYTRIP') || note.includes('MMT') || orderId.includes('MMT')) {
      return { 
        name: 'MakeMyTrip Stay', 
        badge: 'MMT LINKED',
        tagColor: 'bg-red-500/15 border-red-500/30 text-red-400' 
      };
    }
    if (note.includes('AGODA') || orderId.includes('AGODA')) {
      return { 
        name: 'Agoda Stay', 
        badge: 'AGODA LINKED',
        tagColor: 'bg-blue-500/15 border-blue-500/30 text-blue-400' 
      };
    }
    if (note.includes('BOOKING.COM') || orderId.includes('BOOKING')) {
      return { 
        name: 'Booking.com Stay', 
        badge: 'BOOKING.COM',
        tagColor: 'bg-sky-500/15 border-sky-500/30 text-sky-400' 
      };
    }
    return { 
      name: 'Direct Sanctuary', 
      badge: 'DIRECT SANCTUM',
      tagColor: 'bg-accent-gold/15 border-accent-gold/30 text-accent-gold' 
    };
  };

  // Co-Guest WhatsApp Dispatcher
  const handleWhatsAppInvite = (guest: any, spaceTitle: string) => {
    const token = guest.verification_token || guest.id;
    const link = `https://nothingness.asia/verify-guest/${token}`;
    const guestLabel = guest.name || (guest.guest_index ? `Guest ${guest.guest_index + 1}` : 'Guest');
    const message = `Namaste ${guestLabel}! ✨ Please complete your discreet 30-second digital ID check-in for our upcoming stay at Nothingness (${spaceTitle}):\n${link}`;
    
    const cleanDigits = guest.phone ? guest.phone.replace(/[^0-9]/g, '') : '';
    if (cleanDigits) {
      const cleanPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
    toast.success('WhatsApp Invite Dispatched', {
      description: 'Opening WhatsApp with pre-filled secure verification link.',
    });
  };

  const handleCopyGuestLink = (guest: any) => {
    const token = guest.verification_token || guest.id;
    const link = `https://nothingness.asia/verify-guest/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedGuestId(guest.id);
    toast.success('Co-Guest Link Copied', {
      description: 'Share this discreet link with your co-guest to complete their ID verification.',
    });
    setTimeout(() => setCopiedGuestId(null), 3000);
  };

  const activeBookings = bookings.filter((b: any) => b.status !== 'cancelled');
  const userPhone = user.phone || (user.email?.includes('@auth.nothingness') ? `+${user.email.split('@')[0]}` : user.email || 'Phone Not Linked');

  return (
    <div className="space-y-10">

      {/* 1. THE SOVEREIGN DIGITAL BLACK PASS (BESPOKE OBSIDIAN LUXURY PASSPORT) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-black border border-white/[0.12] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
        {/* Glow Spheres */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-gold/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 space-y-6">
          {/* Card Top Meta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-gold/10 border border-accent-gold/30 flex items-center justify-center text-accent-gold shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-accent-gold block font-semibold">
                  NOTHINGNESS DIGITAL SANCTUM PASSPORT
                </span>
                <span className="text-xs text-white/50 font-mono">
                  Autonomous Hospitality • Delhi Police Form C Integrated
                </span>
              </div>
            </div>

            {/* Sovereign Tier Pill & Gatekeeper QR Trigger */}
            <div className="flex items-center gap-2.5">
              <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border shadow-sm ${
                sovereignTier.includes('Tier III')
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10'
                  : sovereignTier.includes('Tier II')
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-amber-500/10'
                  : 'bg-zinc-800/80 border-zinc-700 text-zinc-300'
              }`}>
                {sovereignTier}
              </span>

              <button
                onClick={() => setShowQrModal(true)}
                title="View Gatekeeper Door QR"
                className="px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-accent-gold hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-accent-gold" />
                <span className="hidden sm:inline">Door Pass QR</span>
              </button>
            </div>
          </div>

          {/* Persona Switcher Tab */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex bg-zinc-900/90 border border-white/10 p-1 rounded-2xl backdrop-blur-md">
              <button
                onClick={() => setActivePersona('civilian')}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activePersona === 'civilian'
                    ? 'bg-accent-gold text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Civilian Identity</span>
              </button>
              <button
                onClick={() => setActivePersona('lifestyle')}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activePersona === 'lifestyle'
                    ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>Lifestyle Persona</span>
              </button>
            </div>

            {/* Quick Refresh / Update ID Link */}
            <button
              onClick={() => setShowIdModal(true)}
              className="text-xs font-mono text-accent-gold hover:text-white underline underline-offset-4 cursor-pointer hidden md:inline-block"
            >
              {isVerified ? 'Update Official ID' : '+ Verify Government ID'}
            </button>
          </div>

          {/* Persona Body Display */}
          {activePersona === 'civilian' ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left: Live Face ID / ID Avatar */}
              <div className="md:col-span-4 flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-accent-gold/40 bg-zinc-900 shadow-xl shrink-0 flex items-center justify-center">
                    {liveFaceUrl ? (
                      <img src={liveFaceUrl} alt="Verified Face ID" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-zinc-600" />
                    )}
                  </div>
                  {isFaceIdVetted && (
                    <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center text-white" title="3D Face ID Matched">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 block">
                    GOVERNMENT LEGAL RECORD
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-white leading-tight">
                    {verifiedName || 'Verification Incomplete'}
                  </h3>
                  <p className="text-xs font-mono text-zinc-400">
                    {docType ? `${docType.toUpperCase()} Record` : 'Aadhaar / Passport'}
                  </p>
                  <button
                    onClick={() => setShowFaceIdModal(true)}
                    className="text-[11px] font-mono text-accent-gold hover:text-white flex items-center gap-1 mt-1 cursor-pointer"
                  >
                    <Camera className="w-3 h-3" />
                    <span>{isFaceIdVetted ? 'Retake 3D Face ID' : 'Scan 3D Face ID'}</span>
                  </button>
                </div>
              </div>

              {/* Middle: Details Grid */}
              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-accent-gold" /> Registered Mobile
                  </span>
                  <p className="text-xs font-mono font-semibold text-white">{userPhone}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                    <Mail className="w-3 h-3 text-accent-gold" /> Sovereign Mail
                  </span>
                  <p className="text-xs font-semibold text-white truncate">{user.email || 'None'}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3 text-accent-gold" /> Statutory Validity
                  </span>
                  <p className="text-xs font-mono font-semibold text-emerald-400">
                    {isVerified ? `${daysLeft} Days Left` : 'Action Required'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Lifestyle Persona Mode */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-4 flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-rose-500/50 bg-zinc-900 shadow-xl shrink-0 flex items-center justify-center">
                    {currentKinkster?.avatar_url ? (
                      <img src={currentKinkster.avatar_url} alt="Kinkster Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Flame className="w-10 h-10 text-rose-500/50" />
                    )}
                  </div>
                  {currentKinkster?.is_activated && (
                    <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-500 border-2 border-black flex items-center justify-center text-white" title="Active Kinkster">
                      <Flame className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-rose-400 block">
                    PRIVATE LIFESTYLE ALIAS
                  </span>
                  <h3 className="text-xl sm:text-2xl font-mono font-bold text-white leading-tight">
                    {currentKinkster?.alias ? `@${currentKinkster.alias}` : 'Anonymous @Alias Pending'}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-1">
                    {currentKinkster?.bio || 'Alternate Lifestyle Circle Member'}
                  </p>
                  <Link
                    href="/kinksters"
                    className="text-[11px] font-mono text-rose-400 hover:text-white flex items-center gap-1 mt-1 cursor-pointer"
                  >
                    <span>Enter Lifestyle Feed →</span>
                  </Link>
                </div>
              </div>

              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-rose-400" /> Discretion Score
                  </span>
                  <p className="text-xs font-mono font-semibold text-white">5.0 ★ (Ultra-Discreet)</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                    <Flame className="w-3 h-3 text-rose-400" /> Verified Credentials
                  </span>
                  <p className="text-xs font-semibold text-white">
                    {currentKinkster?.stay_verified ? 'Stay Verified ✓' : 'Eligible via Stays'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                    <Ticket className="w-3 h-3 text-amber-400" /> Sanctuary Pass
                  </span>
                  <p className="text-xs font-mono font-semibold text-amber-300">
                    {currentPass?.status === 'active' ? (currentPass.pass_tier || 'Noir Luminary') : 'Events Vault Ready'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Card Bottom Verification Status Banner */}
          {isVerified ? (
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-300">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold font-mono">Government ID Compliant</span>: Your identity is approved for 100% autonomous secret key check-in across all sanctuaries.
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-zinc-400 font-mono text-[11px] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-accent-gold" /> {daysLeft} days validity
                </span>
                <button
                  onClick={() => setShowIdModal(true)}
                  className="text-[11px] font-mono text-emerald-400 hover:text-white underline cursor-pointer"
                >
                  Renew ID
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-300">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold">Statutory Police ID Required</span>: Upload clear photos of your Aadhaar Card or Passport to unlock secret door keys and complete check-in.
                </div>
              </div>
              <button
                onClick={() => setShowIdModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-accent-gold text-black font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shrink-0 cursor-pointer"
              >
                Upload ID Now →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. SANCTUM CREDIBILITY & SMART METRICS MATRIX */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Sanctuary Stays</span>
            <Building2 className="w-4 h-4 text-accent-gold" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-white">{totalStays}</p>
          <p className="text-[11px] text-zinc-400">Total verified stays across India</p>
        </div>

        <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Discretion Score</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">5.0 ★</p>
          <p className="text-[11px] text-zinc-400">Zero-noise &amp; acoustic compliance</p>
        </div>

        <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Sanctuary Pass</span>
            <Ticket className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-lg sm:text-xl font-bold font-serif text-amber-300 truncate">
            {currentPass?.status === 'active' ? (currentPass.pass_tier || 'Noir Luminary') : 'Ready'}
          </p>
          <Link href="/sanctuary-pass" className="text-[11px] text-amber-400/80 hover:text-amber-300 underline font-mono block">
            {currentPass?.status === 'active' ? 'View Secret Soirées →' : 'Unlock Pass →'}
          </Link>
        </div>

        <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Lifestyle Circle</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-lg sm:text-xl font-bold font-mono text-rose-300 truncate">
            {currentKinkster?.alias ? `@${currentKinkster.alias}` : 'Available'}
          </p>
          <Link href="/kinksters" className="text-[11px] text-rose-400/80 hover:text-rose-300 underline font-mono block">
            {currentKinkster?.is_activated ? 'Open Whispers & Feed →' : 'Activate Alias →'}
          </Link>
        </div>
      </div>

      {/* 3. MULTI-PLATFORM STAY LEDGER & CO-GUEST DISPATCH */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-accent-gold mb-1">
              <Building2 className="w-4 h-4" />
              <span>Multi-Platform Stays &amp; Autonomous Check-In</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-white">Your Sanctuary Stays</h2>
            <p className="text-xs text-zinc-400">
              Direct and OTA reservations (Airbnb, MakeMyTrip, Agoda, Booking.com) linked to your identity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/onboarding"
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-accent-gold hover:from-amber-400 hover:to-white text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Link Stay via Screenshot</span>
            </Link>
          </div>
        </div>

        {/* Active / Upcoming Stays List */}
        {activeBookings && activeBookings.length > 0 ? (
          <div className="space-y-6">
            {activeBookings.map((booking: any) => {
              const source = getStaySource(booking);
              const guestsList = booking.booking_guests || [];
              const primaryGuest = guestsList.find((g: any) => g.guest_index === 0 || g.is_primary);
              const coGuests = guestsList.filter((g: any) => g.guest_index !== 0 && !g.is_primary);

              return (
                <div 
                  key={booking.id}
                  className="bg-zinc-950 border border-zinc-800/90 rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Space Image */}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 relative shadow-md">
                        <CloudinaryImage 
                          src={booking.spaces?.featured_image || ''} 
                          alt={booking.spaces?.title || 'Sanctuary Space'}
                          fill
                          className="object-cover"
                          transformOptions={{ width: 300, height: 300, crop: 'fill', quality: 'auto' }}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border ${source.tagColor}`}>
                            {source.badge}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            Ref: {booking.payment_order_id || booking.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>

                        <h3 className="text-lg sm:text-xl font-serif font-bold text-white">
                          {booking.spaces?.title || 'Sanctuary Suite'}
                        </h3>
                        <p className="text-xs font-mono text-zinc-400">
                          {booking.spaces?.area ? `${booking.spaces.area}, ` : ''}{booking.spaces?.city || 'Delhi NCR'}
                        </p>

                        <div className="flex items-center gap-4 text-xs font-mono text-zinc-300 pt-1">
                          <span>Check-In: <strong>{new Date(booking.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
                          <span>•</span>
                          <span>Check-Out: <strong>{new Date(booking.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
                      {booking.status === 'confirmed' ? (
                        <Link 
                          href={`/booking/${booking.id}/success`}
                          className="px-5 py-2.5 bg-accent-gold hover:bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Secret Key &amp; Arrival</span>
                        </Link>
                      ) : (
                        <Link 
                          href={`/booking/${booking.id}/verify`}
                          className="px-5 py-2.5 bg-amber-500 hover:bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
                        >
                          Complete Verification
                        </Link>
                      )}

                      <CancelBookingButton 
                        bookingId={booking.id}
                        bookingTitle={booking.spaces?.title}
                        onCancelled={(bId) => {
                          setBookings(prev => prev.filter(b => b.id !== bId));
                        }}
                      />
                    </div>
                  </div>

                  {/* SMART CO-GUEST HUB & STATUTORY DISPATCH */}
                  <div className="pt-4 border-t border-zinc-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 font-semibold flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-accent-gold" />
                        Statutory Guest Verification Ledger
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        Total {guestsList.length || 1} registered guests
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Primary Guest Pill */}
                      <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Primary Guest (You)</span>
                          <p className="text-xs font-bold text-white truncate">{verifiedName || userPhone}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                          isVerified ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {isVerified ? 'Verified ✓' : 'Pending ID'}
                        </span>
                      </div>

                      {/* Co-Guests */}
                      {coGuests.length > 0 ? (
                        coGuests.map((coGuest: any, idx: number) => {
                          const isCoGuestVerified = coGuest.verification_status === 'verified';

                          return (
                            <div 
                              key={coGuest.id || idx}
                              className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-mono text-zinc-500 uppercase block">
                                  Co-Guest #{idx + 2}
                                </span>
                                <p className="text-xs font-bold text-white truncate">
                                  {coGuest.name || coGuest.phone || 'Guest Identification Pending'}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                                  isCoGuestVerified 
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                }`}>
                                  {isCoGuestVerified ? 'ID Verified ✓' : 'ID Pending'}
                                </span>

                                {!isCoGuestVerified && (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleWhatsAppInvite(coGuest, booking.spaces?.title || 'Sanctuary')}
                                      className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-400 hover:text-white transition-all cursor-pointer"
                                      title="Send WhatsApp Invite Link to Co-Guest"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleCopyGuestLink(coGuest)}
                                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer"
                                      title="Copy Verification Link"
                                    >
                                      {copiedGuestId === coGuest.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 flex items-center justify-between text-xs text-zinc-500">
                          <span className="font-mono">Single Guest Reservation</span>
                          <Link href="/onboarding" className="text-accent-gold hover:underline text-[11px] font-mono">
                            + Add Co-Guest
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 border border-zinc-800 rounded-3xl bg-zinc-950 p-6 space-y-3">
            <CalendarIcon className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-base font-serif font-bold text-white">No Active Reservations</h3>
            <p className="text-zinc-400 text-xs max-w-sm mx-auto leading-relaxed">
              You have no active stays booked directly or linked via Airbnb, MakeMyTrip, Agoda, or Booking.com.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link 
                href="/spaces" 
                className="px-5 py-2.5 bg-accent-gold text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-colors"
              >
                Browse Sanctuaries
              </Link>
              <Link 
                href="/onboarding" 
                className="px-5 py-2.5 bg-zinc-900 border border-zinc-700 text-white font-mono text-xs uppercase tracking-wider rounded-xl hover:bg-zinc-800 transition-colors"
              >
                Upload Stay Screenshot
              </Link>
            </div>
          </div>
        )}

        {/* Past Stays Vault (Collapsible/History) */}
        {pastStays && pastStays.length > 0 && (
          <div className="pt-6 border-t border-zinc-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent-gold" /> Past Sanctuary Stays
              </h3>
              <span className="text-xs font-mono text-zinc-500">{pastStays.length} completed</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastStays.map((stay: any) => (
                <div key={stay.id} className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-serif">{stay.spaces?.title || 'Sanctuary Stay'}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Completed ✓
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    {new Date(stay.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. LEVEL 2: EXPAND YOUR ECOSYSTEM EXPERIENCE */}
      <div className="space-y-4">
        <div className="border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-accent-gold mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Multi-Tier Access</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-white">Ecosystem Pathways</h2>
          <p className="text-xs text-zinc-400">
            Expand your access across Alternate Lifestyle networks, Secret Soirées, and Luxury Real Estate Partnerships.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* OPTION A: BECOME A SANCTUARY PARTNER & HOST */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 flex flex-col justify-between group hover:border-amber-500/40 transition-all duration-300 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-serif text-lg sm:text-xl text-white font-bold">Partner &amp; Host</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold">
                  200%+ Yield
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Monetize your luxury property. Nothingness manages autonomous check-in, strict government vetting, and automated turnover.
              </p>
            </div>

            <Link
              href="/franchise"
              className="w-full inline-flex items-center justify-between px-4 py-3.5 bg-zinc-900 group-hover:bg-amber-400 group-hover:text-black text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-lg"
            >
              <span>Explore Host Prospectus</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* OPTION B: SANCTUARY PASS & SECRET SOIRÉES */}
          <div className={`border rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-500 shadow-xl relative overflow-hidden ${
            currentPass?.status === 'active' 
              ? 'bg-gradient-to-b from-amber-950/25 via-zinc-950 to-zinc-950 border-amber-500/40 shadow-amber-500/5' 
              : 'bg-zinc-950 border-zinc-800 hover:border-amber-400/40'
          }`}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-600/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5">
                <Ticket className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-serif text-lg sm:text-xl text-white font-bold">Sanctuary Pass</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  currentPass?.status === 'active' 
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                }`}>
                  {currentPass?.status === 'active' ? `✓ ${currentPass.pass_tier || 'Noir Luminary'}` : 'Secret Soirées'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                {currentPass?.status === 'active'
                  ? 'Your VIP Sanctuary Pass is active. You have full clearance to secret munches, noir masquerades, and intimate salon soirées.'
                  : 'Unlock confidential munches, noir masquerades, and intimate soirées. Protected by tamper-proof camera bans and on-ground floor marshalls.'}
              </p>
            </div>

            <Link
              href="/sanctuary-pass"
              className={`w-full inline-flex items-center justify-between px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-lg ${
                currentPass?.status === 'active'
                  ? 'bg-gradient-to-r from-amber-500 to-accent-gold text-black hover:from-amber-400 hover:to-white'
                  : 'bg-zinc-900 group-hover:bg-gradient-to-r group-hover:from-amber-600 group-hover:to-rose-600 text-white'
              }`}
            >
              <span>{currentPass?.status === 'active' ? 'Enter Sanctuary Events Vault' : 'Sanctuary Events Vault'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* OPTION C: LIFESTYLE & KINKSTER CIRCLE */}
          <div className={`border rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-500 shadow-xl relative overflow-hidden ${
            currentKinkster?.is_activated 
              ? 'bg-gradient-to-b from-rose-950/25 via-zinc-950 to-zinc-950 border-rose-500/40 shadow-rose-500/5' 
              : 'bg-zinc-950 border-zinc-800 hover:border-rose-500/40'
          }`}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-5">
                <Flame className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-serif text-lg sm:text-xl text-white font-bold">Lifestyle Circle</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  currentKinkster?.is_activated 
                    ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                    : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                }`}>
                  {currentKinkster?.is_activated ? `@${currentKinkster.alias}` : 'Anonymous @Alias'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Exclusive community for vetted adults. Create an encrypted alias to explore private media feeds, mutual matching, and audio stories.
              </p>
            </div>

            <Link
              href="/kinksters"
              className={`w-full inline-flex items-center justify-between px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-lg ${
                currentKinkster?.is_activated
                  ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white hover:from-rose-500 hover:to-purple-500'
                  : 'bg-zinc-900 group-hover:bg-gradient-to-r group-hover:from-rose-600 group-hover:to-purple-600 text-white'
              }`}
            >
              <span>{currentKinkster?.is_activated ? 'Enter Lifestyle Feed' : 'Activate Anonymous @Alias'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 5. GATEKEEPER PASS QR CODE MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
          <div className="bg-zinc-950 border border-accent-gold/40 rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-5 text-center relative shadow-2xl">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-accent-gold">
                GATEKEEPER ENTRY PASS
              </span>
              <h3 className="text-xl font-serif font-bold text-white">
                {verifiedName || userPhone}
              </h3>
              <p className="text-xs font-mono text-zinc-400">
                Scan at sanctuary door or secret gathering
              </p>
            </div>

            <div className="p-4 bg-black border border-accent-gold/30 rounded-2xl flex items-center justify-center shadow-inner">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="Sanctuary Pass QR" className="w-56 h-56 rounded-xl object-contain" />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-zinc-600 font-mono text-xs">
                  Generating Pass...
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isVerified ? 'Police ID Compliant' : 'Unverified Pass'}</span>
              <span>•</span>
              <span>{isFaceIdVetted ? 'Face ID Vetted' : 'Face ID Pending'}</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. ID UPLOAD MODAL */}
      <IDUploadModal
        isOpen={showIdModal}
        onClose={() => setShowIdModal(false)}
        phone={user.phone}
        onSuccess={(name) => {
          setShowIdModal(false);
          setIsVerified(true);
          setVerifiedName(name);
          toast.success('Level 1 Vetting Complete', {
            description: `Welcome, ${name}. You are fully approved for secret key check-in across all sanctuaries.`
          });
          if (!isFaceIdVetted) {
            setShowFaceIdModal(true);
          }
        }}
      />

      {/* 7. 3D FACE ID BIOMETRIC SCAN MODAL */}
      <FaceIdScanModal
        isOpen={showFaceIdModal}
        onClose={() => setShowFaceIdModal(false)}
        onSuccess={(url) => {
          setIsFaceIdVetted(true);
          setLiveFaceUrl(url);
          toast.success('3D Face ID Registered!', {
            description: 'Your real-life biometric profile is securely archived for door entry.',
          });
        }}
      />

    </div>
  );
}
