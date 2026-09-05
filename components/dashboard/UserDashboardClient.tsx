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
  KeyRound,
  ExternalLink,
  Scan,
  Camera
} from 'lucide-react';
import IDUploadModal from '@/components/IDUploadModal';
import FaceIdScanModal from '@/components/FaceIdScanModal';
import CancelBookingButton from '@/components/CancelBookingButton';
import CloudinaryImage from '@/components/CloudinaryImage';
import { toast } from 'sonner';

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
    is_verified?: boolean;
    verification_expires_at?: string;
    created_at?: string;
    face_id_vetted?: boolean;
    live_face_url?: string;
    face_id_vetted_at?: string;
  } | null;
  kinksterProfile: any | null;
  sanctuaryPass?: any | null;
  upcomingBookings: any[];
}

export default function UserDashboardClient({
  user,
  profile,
  kinksterProfile,
  sanctuaryPass,
  upcomingBookings,
}: UserDashboardClientProps) {
  const [showIdModal, setShowIdModal] = useState(false);
  const [showFaceIdModal, setShowFaceIdModal] = useState(false);
  const [isVerified, setIsVerified] = useState(profile?.is_verified ?? false);
  const [verifiedName, setVerifiedName] = useState(profile?.full_name || '');
  const [docType, setDocType] = useState(profile?.id_document_type || '');
  const [isFaceIdVetted, setIsFaceIdVetted] = useState(Boolean(profile?.face_id_vetted));
  const [liveFaceUrl, setLiveFaceUrl] = useState(profile?.live_face_url || '');
  const [bookings, setBookings] = useState<any[]>(upcomingBookings || []);
  const [currentPass, setCurrentPass] = useState(sanctuaryPass);
  const [currentKinkster, setCurrentKinkster] = useState(kinksterProfile);

  useEffect(() => {
    setBookings(upcomingBookings || []);
  }, [upcomingBookings]);

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

  const activeBookings = bookings.filter((b: any) => b.status !== 'cancelled');

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

  return (
    <div className="space-y-10">
      
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-accent-gold text-xs font-mono uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Master Guest &amp; Partner Profile</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-white font-bold">
            {verifiedName ? `Welcome, ${verifiedName}` : user.phone || 'Welcome Back'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/spaces"
            className="px-5 py-2.5 bg-accent-gold hover:bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
          >
            Browse Sanctuaries
          </Link>
        </div>
      </div>

      {/* LEVEL 1: IDENTITY & VETTING COMMON PROFILE */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent-gold/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                isVerified 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}>
                {isVerified ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white font-serif">Level 1: ID Vetting Profile</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isVerified 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {isVerified ? 'Verified & Eligible' : 'Action Required'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Required by Police Compliance to book any sanctuary space.
                </p>
              </div>
            </div>

            {!isVerified && (
              <button
                onClick={() => setShowIdModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-accent-gold hover:from-amber-400 hover:to-white text-black font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Upload ID to Complete Level 1
              </button>
            )}
          </div>

          {/* Profile Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-1">
              <span className="text-[10px] uppercase font-mono text-zinc-500 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-zinc-400" /> Primary Phone
              </span>
              <p className="text-sm font-mono text-white font-semibold">{user.phone || 'Not Linked'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-1">
              <span className="text-[10px] uppercase font-mono text-zinc-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400" /> Full Name (on ID)
              </span>
              <p className="text-sm text-white font-semibold">{verifiedName || 'Pending Verification'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-1">
              <span className="text-[10px] uppercase font-mono text-zinc-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-zinc-400" /> Communication Email
              </span>
              <p className="text-sm text-white font-semibold truncate">{user.email || 'None'}</p>
            </div>
          </div>

          {/* Verification Status Banner */}
          {isVerified ? (
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-300">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold">Level 1 Complete ({docType || 'Aadhaar / Passport'})</span>: You are fully approved for discreet secret key check-in.
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-accent-gold" />
                  <span>Valid for next {daysLeft} days</span>
                </div>
                <button
                  onClick={() => setShowIdModal(true)}
                  className="text-[11px] font-mono text-emerald-400 hover:text-white underline cursor-pointer"
                >
                  Update ID
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40 flex items-center gap-3 text-xs text-amber-300">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold">Level 1 Required</span>: Upload clear front &amp; back photos of your Aadhaar Card or Passport. Verified once, valid across all stays for 180 days.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3D FACE ID BIOMETRIC VETTING (INTERNAL GATEKEEPER PASS) */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
              isFaceIdVetted 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-accent-gold/10 border-accent-gold/30 text-accent-gold'
            }`}>
              <Scan className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white font-serif">3D Face ID Biometric Vetting</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isFaceIdVetted 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-accent-gold/20 text-accent-gold border border-accent-gold/30'
                }`}>
                  {isFaceIdVetted ? 'Face ID Vetted ✓' : 'Higher Event Priority'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Internal Gatekeeper protocol. Outdated ID photos cause delays; your 3D Face ID verifies your real-life presence at event gates.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowFaceIdModal(true)}
            className={`px-6 py-3 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isFaceIdVetted
                ? 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700'
                : 'bg-gradient-to-r from-amber-500 to-accent-gold hover:from-amber-400 hover:to-white text-black'
            }`}
          >
            <Camera className="w-4 h-4" />
            {isFaceIdVetted ? 'Update 3D Face Scan' : 'Complete 3D Face Scan'}
          </button>
        </div>

        {isFaceIdVetted && liveFaceUrl && (
          <div className="mt-6 pt-6 border-t border-zinc-900 flex items-center gap-4">
            <div className="w-16 h-20 rounded-2xl overflow-hidden border border-emerald-500/40 bg-black shrink-0 shadow-md">
              <img src={liveFaceUrl} alt="Live Face ID" className="w-full h-full object-cover" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Physical Appearance Match Archived
              </p>
              <p className="text-[11px] text-zinc-400 font-mono">
                Gatekeepers will match this 3D scan at door entry. Confidential — strictly for internal physical verification.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* LEVEL 2: CHOOSE YOUR JOURNEY PATHWAY */}
      <div>
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-accent-gold" />
            <span>Level 2 Choice Pathway</span>
          </div>
          <h2 className="text-2xl font-bold font-serif text-white">Choose Your Ecosystem Experience</h2>
          <p className="text-xs text-zinc-400">
            Expand your access with either a Partner Host account to monetize luxury real estate, or enter the private Alternate Lifestyle community.
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
                Monetize your premium apartment, villa, or penthouse. Nothingness handles autonomous check-in, strict ID vetting, and automated housekeeping.
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

          {/* OPTION B: SANCTUARY PASS & SECRET GATHERINGS */}
          <div className={`border rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-500 shadow-xl relative overflow-hidden ${
            currentPass?.status === 'active' 
              ? 'bg-gradient-to-b from-amber-950/25 via-zinc-950 to-zinc-950 border-amber-500/40 shadow-amber-500/5' 
              : 'bg-zinc-950 border-zinc-800 hover:border-amber-400/40'
          }`}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-600/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-serif text-lg sm:text-xl text-white font-bold">Sanctuary Pass</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  currentPass?.status === 'active' 
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                }`}>
                  {currentPass?.status === 'active' ? `✓ ${currentPass.pass_tier || 'Noir Luminary'}` : 'Secret Gatherings'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                {currentPass?.status === 'active'
                  ? 'Your VIP Sanctuary Pass is active. You have full clearance to secret munches, noir masquerades, and intimate salon soirées.'
                  : 'Unlock confidential munches, noir masquerades, and intimate soirées. Protected by tamper-proof camera bans and on-ground floor consent marshalls.'}
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
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Exclusive community for vetted adults. Create an encrypted alias to explore private media feeds, mutual matching, and audio stories.
              </p>
              
              {currentKinkster?.is_activated && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {currentKinkster.stay_verified && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono font-bold">
                      Stay Verified ✓
                    </span>
                  )}
                  {currentKinkster.face_id_vetted && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono font-bold">
                      3D Face ID ✓
                    </span>
                  )}
                  {currentKinkster.is_trusted_host && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[9px] font-mono font-bold">
                      Trusted Host 👑
                    </span>
                  )}
                </div>
              )}
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

      {/* UPCOMING SANCTUARY RESERVATIONS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold font-serif text-white">Upcoming Sanctuary Bookings</h2>
            <p className="text-xs text-zinc-400">Access codes and check-in instructions for your confirmed stays.</p>
          </div>
          <Link href="/dashboard/bookings" className="text-xs font-mono text-accent-gold hover:underline">
            View All Stays →
          </Link>
        </div>

        {activeBookings && activeBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeBookings.map((booking: any) => (
              <div key={booking.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden group shadow-lg transition-all">
                <div className="h-40 relative overflow-hidden bg-zinc-900">
                  <CloudinaryImage 
                    src={booking.spaces?.featured_image || ''} 
                    alt={booking.spaces?.title || 'Sanctuary'}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    transformOptions={{ width: 600, height: 400, crop: 'fill', quality: 'auto' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                    <div>
                      <h3 className="font-serif text-base text-white font-bold">{booking.spaces?.title}</h3>
                      <p className="text-[10px] uppercase font-mono text-zinc-400">{booking.spaces?.city}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                      booking.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
                    <div>
                      <span className="text-zinc-500 text-[10px] block">CHECK-IN</span>
                      <span className="text-white font-medium">{new Date(booking.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block">CHECK-OUT</span>
                      <span className="text-white font-medium">{new Date(booking.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {booking.status === 'confirmed' ? (
                      <Link 
                        href={`/booking/${booking.id}/success`}
                        className="flex-1 text-center text-xs font-bold uppercase tracking-wider text-black bg-accent-gold hover:bg-white py-2.5 rounded-xl transition-colors shadow-md"
                      >
                        Arrival &amp; Secret Key
                      </Link>
                    ) : (
                      <Link 
                        href={`/booking/${booking.id}/verify`}
                        className="flex-1 text-center text-xs font-bold uppercase tracking-wider text-black bg-amber-400 hover:bg-white py-2.5 rounded-xl transition-colors"
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
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-zinc-800/80 rounded-2xl bg-zinc-950 p-6">
            <CalendarIcon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-400 text-xs mb-3">You have no upcoming stays booked.</p>
            <Link 
              href="/spaces" 
              className="inline-block px-5 py-2.5 bg-accent-gold text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-colors"
            >
              Explore Sanctuaries
            </Link>
          </div>
        )}
      </div>

      {/* ID UPLOAD MODAL */}
      <IDUploadModal
        isOpen={showIdModal}
        onClose={() => setShowIdModal(false)}
        phone={user.phone}
        onSuccess={(name) => {
          setShowIdModal(false);
          setIsVerified(true);
          setVerifiedName(name);
          toast.success('Level 1 Vetting Complete', {
            description: `Welcome, ${name}. You can now book any Nothingness sanctuary.`
          });
          if (!isFaceIdVetted) {
            setShowFaceIdModal(true);
          }
        }}
      />

      {/* 3D FACE ID BIOMETRIC SCAN MODAL */}
      <FaceIdScanModal
        isOpen={showFaceIdModal}
        onClose={() => setShowFaceIdModal(false)}
        onSuccess={(url) => {
          setIsFaceIdVetted(true);
          setLiveFaceUrl(url);
          toast.success('3D Face ID Registered!', {
            description: 'Your real-life identity is verified for Gatekeeper door entry.',
          });
        }}
      />

    </div>
  );
}
