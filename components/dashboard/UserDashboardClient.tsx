'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  ExternalLink
} from 'lucide-react';
import IDUploadModal from '@/components/IDUploadModal';
import CancelBookingButton from '@/components/CancelBookingButton';
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
  } | null;
  kinksterProfile: {
    alias?: string;
    is_activated?: boolean;
  } | null;
  upcomingBookings: any[];
}

export default function UserDashboardClient({
  user,
  profile,
  kinksterProfile,
  upcomingBookings,
}: UserDashboardClientProps) {
  const [showIdModal, setShowIdModal] = useState(false);
  const [isVerified, setIsVerified] = useState(profile?.is_verified ?? false);
  const [verifiedName, setVerifiedName] = useState(profile?.full_name || '');
  const [docType, setDocType] = useState(profile?.id_document_type || '');

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
                  Required by Delhi Police compliance to book any sanctuary space.
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
                  <span className="font-bold">Level 1 Complete ({docType || 'Aadhaar / Passport'})</span>: You are fully approved for keyless lockbox check-ins.
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[11px] shrink-0">
                <Clock className="w-3.5 h-3.5 text-accent-gold" />
                <span>Valid for next {daysLeft} days</span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* OPTION A: BECOME A SANCTUARY PARTNER & HOST */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between group hover:border-amber-500/40 transition-all duration-300 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-serif text-xl sm:text-2xl text-white font-bold">Sanctuary Partner &amp; Host</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold">
                  200%+ Yields
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Monetize your premium apartment, villa, or penthouse. Nothingness handles autonomous check-in, strict ID vetting, automated turnover reviews, and channel manager sync.
              </p>

              <div className="space-y-2 text-xs text-zinc-300 font-mono mb-8">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Turnkey hardware &amp; ambient lighting guidelines</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>AirCover &amp; strict ₹10,000 security deposit protection</span>
                </div>
              </div>
            </div>

            <Link
              href="/franchise"
              className="w-full inline-flex items-center justify-between px-5 py-4 bg-zinc-900 group-hover:bg-amber-400 group-hover:text-black text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-lg"
            >
              <span>Explore Host Prospectus &amp; Apply</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* OPTION B: LIFESTYLE & KINKSTER CIRCLE */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between group hover:border-rose-500/40 transition-all duration-300 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-5">
                <Flame className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-serif text-xl sm:text-2xl text-white font-bold">Alternate Lifestyle Circle</h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold">
                  {kinksterProfile?.is_activated ? `@${kinksterProfile.alias}` : 'Private & Anonymous'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Exclusive community for vetted adults. Create an encrypted alias to explore private media feeds, curated sensory parties, mutual matching &amp; dating, and audio stories.
              </p>

              <div className="space-y-2 text-xs text-zinc-300 font-mono mb-8">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>100% Discretion Agreement with zero identity leaks</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Private events, parties, and mutual match discovery</span>
                </div>
              </div>
            </div>

            <Link
              href="/kinksters"
              className="w-full inline-flex items-center justify-between px-5 py-4 bg-zinc-900 group-hover:bg-gradient-to-r group-hover:from-rose-600 group-hover:to-purple-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-lg"
            >
              <span>{kinksterProfile?.is_activated ? 'Enter Lifestyle Circle' : 'Activate Anonymous @Alias'}</span>
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

        {upcomingBookings && upcomingBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingBookings.map((booking: any) => (
              <div key={booking.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden group shadow-lg">
                <div className="h-40 relative overflow-hidden">
                  <img 
                    src={booking.spaces?.featured_image || ''} 
                    alt={booking.spaces?.title || 'Sanctuary'}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
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
                        Smart Lockbox PIN
                      </Link>
                    ) : (
                      <Link 
                        href={`/booking/${booking.id}/verify`}
                        className="flex-1 text-center text-xs font-bold uppercase tracking-wider text-black bg-amber-400 hover:bg-white py-2.5 rounded-xl transition-colors"
                      >
                        Complete Verification
                      </Link>
                    )}
                    <CancelBookingButton bookingId={booking.id} />
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
        }}
      />

    </div>
  );
}
