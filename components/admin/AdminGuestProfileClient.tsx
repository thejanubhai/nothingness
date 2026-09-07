'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  ArrowLeft, Mail, Phone, MapPin, ShieldCheck, 
  FileText, Printer, Download, Edit3, Trash2, X, 
  Check, User, Calendar, ExternalLink, Camera, Upload, AlertCircle,
  Sparkles, Ticket, Flame, ShieldAlert, Power, CheckCircle2,
  Plus, Settings, Lock, Unlock, BadgeCheck, Sliders, RefreshCw, KeyRound
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface GuestProfile {
  id: string;
  full_name: string;
  user_id?: string;
  phone_number?: string;
  phone?: string;
  email?: string;
  id_document_type?: string;
  document_number?: string;
  is_verified?: boolean;
  created_at: string;
  permanent_address?: string;
  is_foreign_national?: boolean;
  visa_number?: string;
  nationality?: string;
  dob?: string;
  police_register_status?: string;
  verification_timestamp?: string;
  verification_expires_at?: string;
  id_front_url?: string;
  id_back_url?: string;
  id_document_url?: string;
  photo_url?: string;
  face_id_vetted?: boolean;
  live_face_url?: string;
  face_id_vetted_at?: string;
  in_person_vetted?: boolean;
  in_person_vetted_at?: string;
  booking_guests?: any[];
}

interface AdminGuestProfileClientProps {
  initialGuest: GuestProfile;
  initialSanctuaryPass?: any;
  initialKinksterProfile?: any;
}

export default function AdminGuestProfileClient({ 
  initialGuest,
  initialSanctuaryPass,
  initialKinksterProfile,
}: AdminGuestProfileClientProps) {
  const router = useRouter();
  const [guest, setGuest] = useState<GuestProfile>(initialGuest);
  const [sanctuaryPass, setSanctuaryPass] = useState<any | null>(initialSanctuaryPass || null);
  const [kinksterProfile, setKinksterProfile] = useState<any | null>(initialKinksterProfile || null);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isKinksterModalOpen, setIsKinksterModalOpen] = useState(false);

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPass, setIsSavingPass] = useState(false);
  const [isSavingKinkster, setIsSavingKinkster] = useState(false);
  const [isTogglingPass, setIsTogglingPass] = useState(false);
  const [togglingKinksterKey, setTogglingKinksterKey] = useState<string | null>(null);

  // Guest Edit form state
  const [editFormData, setEditFormData] = useState({
    full_name: guest.full_name || '',
    document_number: guest.document_number || '',
    id_document_type: guest.id_document_type || 'Aadhaar',
    dob: guest.dob || '',
    phone: guest.phone || guest.phone_number || '',
    permanent_address: guest.permanent_address || '',
    photo_url: guest.photo_url || '',
    live_face_url: guest.live_face_url || '',
    face_id_vetted: Boolean(guest.face_id_vetted),
    in_person_vetted: Boolean(guest.in_person_vetted),
    id_front_url: guest.id_front_url || guest.id_document_url || '',
    id_back_url: guest.id_back_url || '',
  });

  // Sanctuary Pass Form state
  const [passFormData, setPassFormData] = useState({
    status: sanctuaryPass?.status || 'active',
    pass_tier: sanctuaryPass?.pass_tier || 'Noir Luminary',
    amount_paid: sanctuaryPass?.amount_paid !== undefined ? sanctuaryPass.amount_paid : 1499,
    order_id: sanctuaryPass?.order_id || `admin_comp_${Date.now().toString().slice(-6)}`,
    expires_at: sanctuaryPass?.expires_at ? sanctuaryPass.expires_at.slice(0, 10) : '',
    admin_notes: sanctuaryPass?.admin_notes || '',
  });

  // Kinkster Profile Form state
  const [kinksterFormData, setKinksterFormData] = useState({
    alias: kinksterProfile?.alias || '',
    bio: kinksterProfile?.bio || '',
    interests: Array.isArray(kinksterProfile?.interests) ? kinksterProfile.interests.join(', ') : 'Masquerade, Sanctuary Lounge',
    is_activated: kinksterProfile?.is_activated ?? true,
    is_trusted_host: Boolean(kinksterProfile?.is_trusted_host),
    stay_verified: Boolean(kinksterProfile?.stay_verified),
    face_id_vetted: Boolean(kinksterProfile?.face_id_vetted || guest.face_id_vetted),
    in_person_vetted: Boolean(kinksterProfile?.in_person_vetted || guest.in_person_vetted),
    confidentiality_agreed: kinksterProfile?.confidentiality_agreed ?? true,
    admin_notes: kinksterProfile?.admin_notes || '',
  });

  // Keep form data in sync when pass/kinkster changes
  useEffect(() => {
    if (sanctuaryPass) {
      setPassFormData({
        status: sanctuaryPass.status || 'active',
        pass_tier: sanctuaryPass.pass_tier || 'Noir Luminary',
        amount_paid: sanctuaryPass.amount_paid !== undefined ? sanctuaryPass.amount_paid : 1499,
        order_id: sanctuaryPass.order_id || '',
        expires_at: sanctuaryPass.expires_at ? sanctuaryPass.expires_at.slice(0, 10) : '',
        admin_notes: sanctuaryPass.admin_notes || '',
      });
    }
  }, [sanctuaryPass]);

  useEffect(() => {
    if (kinksterProfile) {
      setKinksterFormData({
        alias: kinksterProfile.alias || '',
        bio: kinksterProfile.bio || '',
        interests: Array.isArray(kinksterProfile.interests) ? kinksterProfile.interests.join(', ') : '',
        is_activated: kinksterProfile.is_activated ?? true,
        is_trusted_host: Boolean(kinksterProfile.is_trusted_host),
        stay_verified: Boolean(kinksterProfile.stay_verified),
        face_id_vetted: Boolean(kinksterProfile.face_id_vetted),
        in_person_vetted: Boolean(kinksterProfile.in_person_vetted),
        confidentiality_agreed: kinksterProfile.confidentiality_agreed ?? true,
        admin_notes: kinksterProfile.admin_notes || '',
      });
    }
  }, [kinksterProfile]);

  // Real-Time Supabase Subscription
  useEffect(() => {
    const supabase = createClient();
    const effectiveUserId = guest.user_id || guest.id;

    const channel = supabase
      .channel(`admin-guest-sync-${guest.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sanctuary_passes' },
        (payload) => {
          if (payload.new && ((payload.new as any).guest_profile_id === guest.id || (payload.new as any).user_id === effectiveUserId || (payload.new as any).user_id === guest.id)) {
            setSanctuaryPass(payload.new);
          } else if (payload.eventType === 'DELETE') {
            setSanctuaryPass(null);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kinkster_profiles' },
        (payload) => {
          if (payload.new && ((payload.new as any).guest_profile_id === guest.id || (payload.new as any).id === effectiveUserId || (payload.new as any).id === guest.id)) {
            setKinksterProfile(payload.new);
          } else if (payload.eventType === 'DELETE') {
            setKinksterProfile(null);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'guest_profiles', filter: `id=eq.${guest.id}` },
        (payload) => {
          if (payload.new) {
            setGuest((prev) => ({ ...prev, ...(payload.new as any) }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [guest.id, guest.user_id]);

  const stays = guest.booking_guests || [];
  const totalSpent = stays.reduce((sum: number, stay: any) => sum + (stay.bookings?.total_price || 0), 0);
  const frontDocUrl = guest.id_front_url || guest.id_document_url;
  const backDocUrl = guest.id_back_url;

  // Print ID Card Copy & Police Dossier
  const handlePrintIdDossier = () => {
    window.print();
  };

  // Save Edit Updates for Guest Profile
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/guests/${guest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Guest details successfully updated!');
        setGuest(data.guest);
        setIsEditModalOpen(false);
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to update guest details');
      }
    } catch {
      toast.error('Network error saving updates');
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // SANCTUARY PASS ACTIONS
  // ==========================================
  const handleTogglePassStatus = async (targetStatus: string) => {
    if (!sanctuaryPass) return;
    setIsTogglingPass(true);
    const previousPass = { ...sanctuaryPass };
    
    // Optimistic UI update
    setSanctuaryPass({ ...sanctuaryPass, status: targetStatus });

    try {
      const res = await fetch(`/api/admin/guests/${guest.id}/sanctuary-pass`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pass_id: sanctuaryPass.id, status: targetStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSanctuaryPass(data.pass);
        toast.success(`Sanctuary Pass ${targetStatus === 'active' ? 'Activated' : 'Deactivated / Suspended'}`);
      } else {
        setSanctuaryPass(previousPass);
        toast.error(data.error || 'Failed to update pass status');
      }
    } catch {
      setSanctuaryPass(previousPass);
      toast.error('Network error updating pass');
    } finally {
      setIsTogglingPass(false);
    }
  };

  const handleSavePassForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPass(true);
    try {
      const isExisting = Boolean(sanctuaryPass?.id);
      const url = `/api/admin/guests/${guest.id}/sanctuary-pass`;
      const method = isExisting ? 'PATCH' : 'POST';
      const body = {
        ...(isExisting && { pass_id: sanctuaryPass.id }),
        status: passFormData.status,
        pass_tier: passFormData.pass_tier,
        amount_paid: Number(passFormData.amount_paid) || 0,
        order_id: passFormData.order_id,
        expires_at: passFormData.expires_at ? new Date(passFormData.expires_at).toISOString() : null,
        admin_notes: passFormData.admin_notes,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSanctuaryPass(data.pass);
        setIsPassModalOpen(false);
        toast.success(isExisting ? 'Sanctuary Pass updated!' : 'Sanctuary Pass issued successfully!');
      } else {
        toast.error(data.error || 'Failed to save Sanctuary Pass');
      }
    } catch {
      toast.error('Network error saving pass');
    } finally {
      setIsSavingPass(false);
    }
  };

  const handleRevokePass = async () => {
    if (!confirm('Are you sure you want to completely revoke and delete this Sanctuary Pass? The member will lose immediate VIP access.')) {
      return;
    }
    try {
      toast.loading('Revoking Sanctuary Pass...');
      const res = await fetch(`/api/admin/guests/${guest.id}/sanctuary-pass?pass_id=${sanctuaryPass?.id || ''}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      toast.dismiss();
      if (res.ok && data.success) {
        setSanctuaryPass(null);
        toast.success('Sanctuary Pass revoked.');
      } else {
        toast.error(data.error || 'Failed to revoke pass');
      }
    } catch {
      toast.dismiss();
      toast.error('Network error revoking pass');
    }
  };

  // ==========================================
  // KINKSTER PROFILE ACTIONS
  // ==========================================
  const handleToggleKinksterFeature = async (featureKey: string, newValue: boolean) => {
    if (!kinksterProfile) return;
    setTogglingKinksterKey(featureKey);
    const prevKinkster = { ...kinksterProfile };

    // Optimistic UI update
    setKinksterProfile({ ...kinksterProfile, [featureKey]: newValue });
    if (featureKey === 'face_id_vetted') {
      setGuest(prev => ({ ...prev, face_id_vetted: newValue }));
    }
    if (featureKey === 'in_person_vetted') {
      setGuest(prev => ({ ...prev, in_person_vetted: newValue }));
    }

    try {
      const res = await fetch(`/api/admin/guests/${guest.id}/kinkster-profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [featureKey]: newValue }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setKinksterProfile(data.profile);
        toast.success(`${featureKey.replace(/_/g, ' ')} set to ${newValue ? 'ACTIVE' : 'INACTIVE'}`);
      } else {
        setKinksterProfile(prevKinkster);
        toast.error(data.error || 'Failed to update feature');
      }
    } catch {
      setKinksterProfile(prevKinkster);
      toast.error('Network error updating feature');
    } finally {
      setTogglingKinksterKey(null);
    }
  };

  const handleSaveKinksterForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingKinkster(true);
    try {
      const isExisting = Boolean(kinksterProfile?.id);
      const url = `/api/admin/guests/${guest.id}/kinkster-profile`;
      const method = isExisting ? 'PATCH' : 'POST';
      const interestsArray = kinksterFormData.interests
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);

      const body = {
        alias: kinksterFormData.alias,
        bio: kinksterFormData.bio,
        interests: interestsArray,
        is_activated: kinksterFormData.is_activated,
        is_trusted_host: kinksterFormData.is_trusted_host,
        stay_verified: kinksterFormData.stay_verified,
        face_id_vetted: kinksterFormData.face_id_vetted,
        in_person_vetted: kinksterFormData.in_person_vetted,
        confidentiality_agreed: kinksterFormData.confidentiality_agreed,
        admin_notes: kinksterFormData.admin_notes,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setKinksterProfile(data.profile);
        setIsKinksterModalOpen(false);
        toast.success(isExisting ? 'Kinkster profile updated!' : 'Kinkster profile activated successfully!');
      } else {
        toast.error(data.error || 'Failed to save Kinkster profile');
      }
    } catch {
      toast.error('Network error saving Kinkster profile');
    } finally {
      setIsSavingKinkster(false);
    }
  };

  const handleDeleteKinkster = async (hard: boolean = false) => {
    const confirmMsg = hard
      ? 'Delete this Kinkster profile permanently? All alias tags and matches will be removed.'
      : 'Deactivate this Kinkster profile? The user will be unable to access member feeds until reactivated.';

    if (!confirm(confirmMsg)) return;

    try {
      toast.loading(hard ? 'Deleting profile...' : 'Deactivating profile...');
      const res = await fetch(`/api/admin/guests/${guest.id}/kinkster-profile?hard=${hard}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      toast.dismiss();
      if (res.ok && data.success) {
        if (hard) {
          setKinksterProfile(null);
        } else {
          setKinksterProfile((prev: any) => ({ ...prev, is_activated: false }));
        }
        toast.success(hard ? 'Profile permanently deleted' : 'Profile deactivated');
      } else {
        toast.error(data.error || 'Action failed');
      }
    } catch {
      toast.dismiss();
      toast.error('Network error');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Screen-only dashboard — hidden when printing */}
      <div className="print:hidden">

      {/* Back & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/guests" 
            className="p-2 hover:bg-zinc-900 rounded-full transition-colors text-zinc-400 hover:text-white border border-zinc-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif text-3xl md:text-4xl text-white font-bold">{guest.full_name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold flex items-center gap-1 shrink-0 whitespace-nowrap border ${
                guest.is_verified && guest.face_id_vetted
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : guest.is_verified
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}>
                <Sparkles className="w-3 h-3 text-accent-gold" />
                {guest.is_verified && guest.face_id_vetted
                  ? 'Tier III: Sovereign Luminary'
                  : guest.is_verified
                  ? 'Tier II: Statutory Compliant'
                  : 'Tier I: Onboarding Member'}
              </span>
              {guest.is_verified && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1 shrink-0 whitespace-nowrap">
                  <ShieldCheck className="w-3 h-3" /> 180-Day Verified
                </span>
              )}
            </div>
            <p className="text-zinc-500 text-xs font-mono mt-0.5 select-all">Guest ID: {guest.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 print:hidden flex-wrap">
          <button
            onClick={handlePrintIdDossier}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-mono font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4 text-accent-gold" />
            <span>Print ID Copy &amp; Dossier</span>
          </button>

          <button
            onClick={() => {
              setEditFormData({
                full_name: guest.full_name || '',
                document_number: guest.document_number || '',
                id_document_type: guest.id_document_type || 'Aadhaar',
                dob: guest.dob || '',
                phone: guest.phone || guest.phone_number || '',
                permanent_address: guest.permanent_address || '',
                photo_url: guest.photo_url || '',
                live_face_url: guest.live_face_url || '',
                face_id_vetted: Boolean(guest.face_id_vetted),
                in_person_vetted: Boolean(guest.in_person_vetted),
                id_front_url: guest.id_front_url || guest.id_document_url || '',
                id_back_url: guest.id_back_url || '',
              });
              setIsEditModalOpen(true);
            }}
            className="px-4 py-2.5 bg-accent-gold hover:bg-white text-black text-xs font-mono font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Details</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Photo & Official ID Documents */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Physical Biometric Verification Card */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold block">
                Physical Identity &amp; Biometrics
              </span>
              {guest.face_id_vetted ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  ✓ 3D Face ID Vetted
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold">
                  ⚠ Old ID Only (No Face ID)
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Real-Life 3D Face ID */}
              <div className="space-y-1.5 text-center">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-zinc-900 shadow-md flex items-center justify-center relative">
                  {guest.live_face_url ? (
                    <img src={guest.live_face_url} alt="Live 3D Face ID" className="w-full h-full object-cover" />
                  ) : (
                    <div className="p-3 text-[10px] font-mono text-zinc-500">Not scanned yet</div>
                  )}
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold block">
                  Live 3D Face ID
                </span>
                <span className="text-[9px] font-mono text-zinc-500 block">Real-life match</span>
              </div>

              {/* Official Aadhaar / Passport Photo */}
              <div className="space-y-1.5 text-center">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-md flex items-center justify-center relative">
                  {guest.photo_url ? (
                    <img src={guest.photo_url} alt={guest.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="p-3 text-[10px] font-mono text-zinc-500">No Photo</div>
                  )}
                </div>
                <span className="text-[10px] font-mono text-zinc-300 font-bold block">
                  Official ID Photo
                </span>
                <span className="text-[9px] font-mono text-zinc-500 block">{guest.id_document_type || 'Aadhaar'} copy</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">DOCUMENT:</span>
                <span className="text-white font-bold">{guest.id_document_type || 'Aadhaar'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">NUMBER:</span>
                <span className="text-accent-gold font-bold">{guest.document_number || 'Pending'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">DOB / AGE:</span>
                <span className="text-zinc-300">{guest.dob || 'Recorded'}</span>
              </div>
            </div>
          </div>

          {/* Scanned ID Cards */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold block">
                Official Document Copies
              </span>
              <FileText className="w-4 h-4 text-zinc-500" />
            </div>

            {/* Front Side */}
            <div className="space-y-2">
              <p className="text-xs text-zinc-300 font-medium">Front Document Photo</p>
              {frontDocUrl ? (
                <div className="space-y-2">
                  <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-video relative group">
                    <img src={frontDocUrl} alt="ID Front" className="w-full h-full object-contain" />
                    <a 
                      href={frontDocUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-mono"
                    >
                      <ExternalLink className="w-4 h-4" /> View Full Image
                    </a>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <a
                      href={frontDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Full View
                    </a>
                    <a
                      href={frontDocUrl}
                      download={`ID_${guest.full_name}_front.jpg`}
                      className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-6 border border-dashed border-zinc-800 rounded-2xl text-center text-zinc-500 text-xs font-mono">
                  No front ID document scan uploaded yet. Click "Edit Details" to attach.
                </div>
              )}
            </div>

            {/* Back Side */}
            {backDocUrl && (
              <div className="space-y-2 pt-2 border-t border-zinc-900">
                <p className="text-xs text-zinc-300 font-medium">Back Document Photo</p>
                <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-video relative group">
                  <img src={backDocUrl} alt="ID Back" className="w-full h-full object-contain" />
                  <a 
                    href={backDocUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-mono"
                  >
                    <ExternalLink className="w-4 h-4" /> View Full Image
                  </a>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <a
                    href={backDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Full View
                  </a>
                  <a
                    href={backDocUrl}
                    download={`ID_${guest.full_name}_back.jpg`}
                    className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Contact Details Card */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold block">
              Contact &amp; Residence
            </span>
            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center gap-3 text-zinc-300">
                <Phone className="w-4 h-4 text-zinc-500 shrink-0" />
                <span className="select-all">{guest.phone || guest.phone_number || 'No phone on file'}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                <span className="select-all break-all">{guest.email || 'No email on file'}</span>
              </div>
              <div className="flex items-start gap-3 text-zinc-300">
                <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
                <span>{guest.permanent_address || 'Address recorded on ID'}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-400 text-[11px] pt-2 border-t border-zinc-900">
                <Calendar className="w-4 h-4 text-zinc-600 shrink-0" />
                <span>Registered: {format(new Date(guest.created_at), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: KPIs, Sanctuary Pass CRUD, Kinkster CRUD & Stays */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-center shadow-lg">
              <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mb-2">Total Stays</p>
              <p className="text-3xl font-serif text-white font-bold">{stays.length}</p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-center shadow-lg">
              <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mb-2">Total Tariff Value</p>
              <p className="text-3xl font-serif text-accent-gold font-bold">₹{totalSpent.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* ======================================================== */}
          {/* MODULE 1: SANCTUARY PASS VIP ACCESS CONTROL (CRUD)       */}
          {/* ======================================================== */}
          <div className="bg-zinc-950 border border-amber-500/30 rounded-3xl p-6 md:p-7 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-serif font-bold text-white">Sanctuary Pass Access Control</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase shrink-0 whitespace-nowrap ${
                      sanctuaryPass?.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : sanctuaryPass?.status
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}>
                      {sanctuaryPass?.status ? sanctuaryPass.status.toUpperCase() : 'NOT ISSUED'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                    VIP clearance to secret gatherings, munches &amp; private noir salon soirées.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {sanctuaryPass && (
                  <button
                    disabled={isTogglingPass}
                    onClick={() => handleTogglePassStatus(sanctuaryPass.status === 'active' ? 'suspended' : 'active')}
                    className={`px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer border ${
                      sanctuaryPass.status === 'active'
                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}
                    title={sanctuaryPass.status === 'active' ? 'Suspend Pass' : 'Activate Pass'}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{sanctuaryPass.status === 'active' ? 'Suspend' : 'Activate'}</span>
                  </button>
                )}

                <button
                  onClick={() => setIsPassModalOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-accent-gold hover:from-amber-400 hover:to-white text-black text-xs font-mono font-bold uppercase rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {sanctuaryPass ? <Edit3 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{sanctuaryPass ? 'Edit Pass' : 'Issue Pass'}</span>
                </button>

                {sanctuaryPass && (
                  <button
                    onClick={handleRevokePass}
                    className="p-2 bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-zinc-800 rounded-xl transition-colors cursor-pointer"
                    title="Revoke / Delete Pass"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Pass Body Content */}
            {sanctuaryPass ? (
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider mb-1">Pass Tier</p>
                    <p className="text-accent-gold font-serif font-bold text-sm">{sanctuaryPass.pass_tier || 'Noir Luminary'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider mb-1">Tariff / Fee</p>
                    <p className="text-white font-mono font-bold text-sm">₹{sanctuaryPass.amount_paid !== undefined ? Number(sanctuaryPass.amount_paid).toLocaleString('en-IN') : '0'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider mb-1">Reference ID</p>
                    <p className="text-zinc-300 font-mono text-xs truncate" title={sanctuaryPass.order_id || 'manual'}>
                      {sanctuaryPass.order_id || 'manual_admin'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider mb-1">Validity</p>
                    <p className="text-emerald-400 font-mono text-xs font-bold">
                      {sanctuaryPass.expires_at ? format(new Date(sanctuaryPass.expires_at), 'MMM dd, yyyy') : 'Lifetime Access'}
                    </p>
                  </div>
                </div>

                {sanctuaryPass.admin_notes && (
                  <div className="p-3 rounded-xl bg-amber-950/15 border border-amber-800/30 text-xs font-mono text-amber-200/90 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-accent-gold shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-accent-gold">Admin Memo: </span>
                      <span>{sanctuaryPass.admin_notes}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-5 p-5 border border-dashed border-zinc-800/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-zinc-300 font-bold">No Sanctuary Pass is currently active for {guest.full_name}.</p>
                  <p className="text-zinc-500 text-[11px]">Grant them access to private noir gatherings, munches, and intimate soirées.</p>
                </div>
                <button
                  onClick={() => setIsPassModalOpen(true)}
                  className="px-4 py-2 bg-accent-gold/10 hover:bg-accent-gold/20 text-accent-gold border border-accent-gold/30 rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                >
                  + Issue Pass Now
                </button>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* MODULE 2: KINKSTER LIFESTYLE PROFILE CONTROL (CRUD)      */}
          {/* ======================================================== */}
          <div className="bg-zinc-950 border border-rose-500/30 rounded-3xl p-6 md:p-7 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-serif font-bold text-white">Kinkster Lifestyle Profile &amp; Vetting</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 whitespace-nowrap ${
                      kinksterProfile?.is_activated
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : kinksterProfile
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}>
                      {kinksterProfile?.is_activated 
                        ? `@${kinksterProfile.alias}` 
                        : kinksterProfile 
                          ? 'DEACTIVATED' 
                          : 'NOT INITIALIZED'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                    Encrypted community handle, mutual matching, audio stories, and gatekeeper badges.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsKinksterModalOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white text-xs font-mono font-bold uppercase rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {kinksterProfile ? <Edit3 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{kinksterProfile ? 'Edit Profile' : 'Initialize Profile'}</span>
                </button>

                {kinksterProfile && (
                  <button
                    onClick={() => handleDeleteKinkster(false)}
                    className="p-2 bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-zinc-800 rounded-xl transition-colors cursor-pointer"
                    title="Deactivate Profile"
                  >
                    <Power className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Kinkster Body Content */}
            {kinksterProfile ? (
              <div className="mt-5 space-y-5">
                
                {/* 6 Interactive Live Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  
                  {/* Toggle 1: is_activated */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white font-mono">Ecosystem Access</p>
                      <p className="text-[10px] text-zinc-400 font-mono">Profile active in feed</p>
                    </div>
                    <button
                      disabled={togglingKinksterKey === 'is_activated'}
                      onClick={() => handleToggleKinksterFeature('is_activated', !kinksterProfile.is_activated)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                        kinksterProfile.is_activated
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                      }`}
                    >
                      {kinksterProfile.is_activated ? 'ON ✓' : 'OFF'}
                    </button>
                  </div>

                  {/* Toggle 2: stay_verified */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white font-mono">Stay Verified Badge</p>
                      <p className="text-[10px] text-zinc-400 font-mono">Completed sanctuary stay</p>
                    </div>
                    <button
                      disabled={togglingKinksterKey === 'stay_verified'}
                      onClick={() => handleToggleKinksterFeature('stay_verified', !kinksterProfile.stay_verified)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                        kinksterProfile.stay_verified
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                      }`}
                    >
                      {kinksterProfile.stay_verified ? 'ON ✓' : 'OFF'}
                    </button>
                  </div>

                  {/* Toggle 3: face_id_vetted */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white font-mono">3D Face ID Vetted</p>
                      <p className="text-[10px] text-zinc-400 font-mono">Door biometric pass</p>
                    </div>
                    <button
                      disabled={togglingKinksterKey === 'face_id_vetted'}
                      onClick={() => handleToggleKinksterFeature('face_id_vetted', !kinksterProfile.face_id_vetted)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                        kinksterProfile.face_id_vetted
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                      }`}
                    >
                      {kinksterProfile.face_id_vetted ? 'ON ✓' : 'OFF'}
                    </button>
                  </div>

                  {/* Toggle 4: in_person_vetted */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white font-mono">In-Person Vetted</p>
                      <p className="text-[10px] text-zinc-400 font-mono">Host / Gatekeeper vetted</p>
                    </div>
                    <button
                      disabled={togglingKinksterKey === 'in_person_vetted'}
                      onClick={() => handleToggleKinksterFeature('in_person_vetted', !kinksterProfile.in_person_vetted)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                        kinksterProfile.in_person_vetted
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                      }`}
                    >
                      {kinksterProfile.in_person_vetted ? 'ON ✓' : 'OFF'}
                    </button>
                  </div>

                  {/* Toggle 5: is_trusted_host */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white font-mono">Trusted Host 👑</p>
                      <p className="text-[10px] text-zinc-400 font-mono">Eligible for co-stays</p>
                    </div>
                    <button
                      disabled={togglingKinksterKey === 'is_trusted_host'}
                      onClick={() => handleToggleKinksterFeature('is_trusted_host', !kinksterProfile.is_trusted_host)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                        kinksterProfile.is_trusted_host
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                      }`}
                    >
                      {kinksterProfile.is_trusted_host ? 'ON ✓' : 'OFF'}
                    </button>
                  </div>

                  {/* Toggle 6: confidentiality_agreed */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white font-mono">NDA / Consent</p>
                      <p className="text-[10px] text-zinc-400 font-mono">Confidentiality signed</p>
                    </div>
                    <button
                      disabled={togglingKinksterKey === 'confidentiality_agreed'}
                      onClick={() => handleToggleKinksterFeature('confidentiality_agreed', !kinksterProfile.confidentiality_agreed)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                        kinksterProfile.confidentiality_agreed
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                      }`}
                    >
                      {kinksterProfile.confidentiality_agreed ? 'ON ✓' : 'OFF'}
                    </button>
                  </div>

                </div>

                {/* Bio & Interests */}
                <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-500">ALIAS HANDLE:</span>
                    <span className="text-rose-400 font-bold">@{kinksterProfile.alias}</span>
                  </div>
                  {kinksterProfile.bio && (
                    <div className="text-xs font-mono text-zinc-300">
                      <span className="text-zinc-500 block mb-0.5">BIO:</span>
                      <p className="italic bg-zinc-950/60 p-2 rounded-xl border border-zinc-800/60">"{kinksterProfile.bio}"</p>
                    </div>
                  )}
                  {Array.isArray(kinksterProfile.interests) && kinksterProfile.interests.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                      <span className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider mr-1">Interests:</span>
                      {kinksterProfile.interests.map((tag: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-mono">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="mt-5 p-5 border border-dashed border-zinc-800/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-zinc-300 font-bold">No Kinkster profile created yet for {guest.full_name}.</p>
                  <p className="text-zinc-500 text-[11px]">Create an encrypted alias and grant vetted community badges.</p>
                </div>
                <button
                  onClick={() => setIsKinksterModalOpen(true)}
                  className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  + Initialize Profile
                </button>
              </div>
            )}
          </div>

          {/* Stays History */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
            <h2 className="text-xs font-mono font-bold text-white p-6 border-b border-zinc-800 uppercase tracking-widest">
              Sanctuary Stay History
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono min-w-[480px]">
                <thead className="bg-zinc-900/50 border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Space</th>
                    <th className="px-4 py-3 font-medium">Check In</th>
                    <th className="px-4 py-3 font-medium">Check Out</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {stays.map((stay: any, idx: number) => {
                    const booking = stay.bookings;
                    if (!booking) return null;
                    return (
                      <tr key={idx} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-white font-bold text-xs">{booking.spaces?.title || 'Sanctuary'}</p>
                        </td>
                        <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                          {format(new Date(booking.check_in), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                          {format(new Date(booking.check_out), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border whitespace-nowrap ${
                            booking.status === 'confirmed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                            booking.status === 'checked_in' ? 'text-blue-400 bg-blue-500/10 border-blue-500/30' :
                            'text-zinc-400 bg-zinc-900 border-zinc-700'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  
                  {stays.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                        No previous stays found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legal Compliance Register Section */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
            <h2 className="text-xs font-mono font-bold text-white p-6 border-b border-zinc-800 uppercase tracking-widest flex items-center justify-between">
              <span>Police Compliance Dossier</span>
              <span className="text-[10px] text-emerald-400 font-normal">Section 40 (Delhi Police Act)</span>
            </h2>
            <div className="p-6 space-y-3 font-mono text-xs text-zinc-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-zinc-500 text-[10px] block">POLICE REGISTER STATUS:</span>
                  <span className="text-emerald-400 font-bold">{guest.police_register_status || 'verified_compliant'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">NATIONALITY:</span>
                  <span>{guest.nationality || 'Indian'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">VERIFIED AT:</span>
                  <span>{guest.verification_timestamp ? format(new Date(guest.verification_timestamp), 'PPpp') : '—'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">VALID UNTIL (180 DAYS):</span>
                  <span>{guest.verification_expires_at ? format(new Date(guest.verification_expires_at), 'PP') : '—'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* MODAL 1: EDIT GUEST IDENTITY DETAILS                     */}
      {/* ======================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="font-serif text-lg text-white font-bold">Edit Guest Identity Records</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-zinc-400 block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Document Type</label>
                  <select
                    value={editFormData.id_document_type}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, id_document_type: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Document Number</label>
                  <input
                    type="text"
                    required
                    placeholder="XXXX XXXX XXXX"
                    value={editFormData.document_number}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, document_number: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Date of Birth / Year</label>
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={editFormData.dob}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, dob: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Residential Address</label>
                <input
                  type="text"
                  value={editFormData.permanent_address}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, permanent_address: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Extracted Photo URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={editFormData.photo_url}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, photo_url: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Front ID Document URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={editFormData.id_front_url}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, id_front_url: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Back ID Document URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={editFormData.id_back_url}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, id_back_url: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Live 3D Face ID Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={editFormData.live_face_url}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, live_face_url: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="face_id_toggle"
                  checked={editFormData.face_id_vetted}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, face_id_vetted: e.target.checked }))}
                  className="rounded border-zinc-700 bg-zinc-900 text-amber-500"
                />
                <label htmlFor="face_id_toggle" className="text-zinc-300">
                  Mark 3D Face ID Biometrically Vetted
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-accent-gold text-black font-bold uppercase rounded-xl hover:bg-white transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ISSUE / EDIT SANCTUARY PASS                     */}
      {/* ======================================================== */}
      {isPassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-amber-500/30 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-accent-gold" />
                <h3 className="font-serif text-lg text-white font-bold">
                  {sanctuaryPass ? 'Edit Sanctuary Pass' : 'Issue Sanctuary Pass'}
                </h3>
              </div>
              <button 
                onClick={() => setIsPassModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePassForm} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Pass Status</label>
                  <select
                    value={passFormData.status}
                    onChange={(e) => setPassFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="active">Active (Access Granted)</option>
                    <option value="suspended">Suspended / Deactivated</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Tier / Membership</label>
                  <select
                    value={passFormData.pass_tier}
                    onChange={(e) => setPassFormData(prev => ({ ...prev, pass_tier: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Noir Luminary">Noir Luminary (VIP)</option>
                    <option value="Standard Access">Standard Access</option>
                    <option value="Lifetime Founder">Lifetime Founder</option>
                    <option value="Complimentary Guest">Complimentary Guest</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Tariff / Amount Paid (₹)</label>
                  <input
                    type="number"
                    value={passFormData.amount_paid}
                    onChange={(e) => setPassFormData(prev => ({ ...prev, amount_paid: Number(e.target.value) }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Expires On (Empty = Lifetime)</label>
                  <input
                    type="date"
                    value={passFormData.expires_at}
                    onChange={(e) => setPassFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Order / Comp Reference ID</label>
                <input
                  type="text"
                  value={passFormData.order_id}
                  onChange={(e) => setPassFormData(prev => ({ ...prev, order_id: e.target.value }))}
                  placeholder="admin_comp_001"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Admin Memo / Notes</label>
                <textarea
                  rows={2}
                  value={passFormData.admin_notes}
                  onChange={(e) => setPassFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
                  placeholder="Granted VIP access for private event..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsPassModalOpen(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPass}
                  className="px-5 py-2 bg-accent-gold text-black font-bold uppercase rounded-xl hover:bg-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingPass ? 'Saving...' : sanctuaryPass ? 'Update Pass' : 'Issue Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: INITIALIZE / EDIT KINKSTER PROFILE               */}
      {/* ======================================================== */}
      {isKinksterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-rose-500/30 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-500" />
                <h3 className="font-serif text-lg text-white font-bold">
                  {kinksterProfile ? 'Edit Kinkster Profile' : 'Initialize Kinkster Profile'}
                </h3>
              </div>
              <button 
                onClick={() => setIsKinksterModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKinksterForm} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-zinc-400 block mb-1">Encrypted Community Alias (@handle)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-zinc-500">@</span>
                  <input
                    type="text"
                    required
                    placeholder="phantom_guest"
                    value={kinksterFormData.alias}
                    onChange={(e) => setKinksterFormData(prev => ({ ...prev, alias: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3.5 py-2.5 text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Community Bio</label>
                <textarea
                  rows={2}
                  placeholder="Discreet adult explorer..."
                  value={kinksterFormData.bio}
                  onChange={(e) => setKinksterFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Interests / Tags (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="Masquerade, Rope, BDSM, Sensory, Lounge"
                  value={kinksterFormData.interests}
                  onChange={(e) => setKinksterFormData(prev => ({ ...prev, interests: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              {/* Feature Checkboxes */}
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Feature Clearance Flags</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kinksterFormData.is_activated}
                      onChange={(e) => setKinksterFormData(prev => ({ ...prev, is_activated: e.target.checked }))}
                      className="rounded border-zinc-700 bg-zinc-900 text-rose-500"
                    />
                    <span className="text-zinc-300">Profile Activated</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kinksterFormData.stay_verified}
                      onChange={(e) => setKinksterFormData(prev => ({ ...prev, stay_verified: e.target.checked }))}
                      className="rounded border-zinc-700 bg-zinc-900 text-rose-500"
                    />
                    <span className="text-zinc-300">Stay Verified Badge</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kinksterFormData.face_id_vetted}
                      onChange={(e) => setKinksterFormData(prev => ({ ...prev, face_id_vetted: e.target.checked }))}
                      className="rounded border-zinc-700 bg-zinc-900 text-rose-500"
                    />
                    <span className="text-zinc-300">3D Face ID Vetted</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kinksterFormData.in_person_vetted}
                      onChange={(e) => setKinksterFormData(prev => ({ ...prev, in_person_vetted: e.target.checked }))}
                      className="rounded border-zinc-700 bg-zinc-900 text-rose-500"
                    />
                    <span className="text-zinc-300">In-Person Vetted</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kinksterFormData.is_trusted_host}
                      onChange={(e) => setKinksterFormData(prev => ({ ...prev, is_trusted_host: e.target.checked }))}
                      className="rounded border-zinc-700 bg-zinc-900 text-rose-500"
                    />
                    <span className="text-zinc-300">Trusted Host 👑</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kinksterFormData.confidentiality_agreed}
                      onChange={(e) => setKinksterFormData(prev => ({ ...prev, confidentiality_agreed: e.target.checked }))}
                      className="rounded border-zinc-700 bg-zinc-900 text-rose-500"
                    />
                    <span className="text-zinc-300">NDA Signed</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Admin Notes / Moderation Memo</label>
                <textarea
                  rows={2}
                  value={kinksterFormData.admin_notes}
                  onChange={(e) => setKinksterFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
                  placeholder="Pre-vetted for confidential events..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsKinksterModalOpen(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingKinkster}
                  className="px-5 py-2 bg-gradient-to-r from-rose-600 to-purple-600 text-white font-bold uppercase rounded-xl hover:from-rose-500 hover:to-purple-500 transition-colors shadow-md"
                >
                  {isSavingKinkster ? 'Saving...' : kinksterProfile ? 'Update Profile' : 'Activate Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>{/* End print:hidden wrapper */}

      {/* ======================================================== */}
      {/* PRINT-ONLY OFFICIAL POLICE COMPLIANCE DOSSIER            */}
      {/* ======================================================== */}
      <div className="hidden print:block text-black bg-white p-8 font-serif">
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider">Nothingness Sanctuaries</h1>
            <p className="font-mono text-xs text-zinc-600">Confidential Police Verification &amp; Guest Registry Dossier</p>
          </div>
          <div className="text-right font-mono text-xs">
            <p>Verification Date: {guest.verification_timestamp ? format(new Date(guest.verification_timestamp), 'dd MMM yyyy') : format(new Date(), 'dd MMM yyyy')}</p>
            <p>Status: 180-Day Police Compliant</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="col-span-1 flex gap-2">
            <div className="text-center">
              <p className="text-[9px] font-mono mb-0.5">OFFICIAL ID</p>
              {guest.photo_url ? (
                <img src={guest.photo_url} alt={guest.full_name} className="w-24 h-32 object-cover border border-black p-0.5" />
              ) : (
                <div className="w-24 h-32 border border-black flex items-center justify-center font-mono text-[9px]">ID Photo</div>
              )}
            </div>
            {guest.live_face_url && (
              <div className="text-center">
                <p className="text-[9px] font-mono mb-0.5 text-emerald-800 font-bold">3D FACE ID</p>
                <img src={guest.live_face_url} alt="Live Face ID" className="w-24 h-32 object-cover border-2 border-emerald-700 p-0.5" />
              </div>
            )}
          </div>
          <div className="col-span-2 space-y-2 font-mono text-xs">
            <p><strong>Guest Full Name:</strong> {guest.full_name}</p>
            <p><strong>Document Type:</strong> {guest.id_document_type || 'Aadhaar'}</p>
            <p><strong>Document Number:</strong> {guest.document_number}</p>
            <p><strong>Date of Birth / Year:</strong> {guest.dob || 'Recorded'}</p>
            <p><strong>Mobile Number:</strong> {guest.phone || guest.phone_number || 'Recorded'}</p>
            <p><strong>Permanent Address:</strong> {guest.permanent_address || 'Recorded on official ID'}</p>
            <p><strong>Nationality:</strong> {guest.nationality || 'Indian'}</p>
          </div>
        </div>

        <div className="border-t border-black pt-4 mb-6">
          <h2 className="font-bold text-sm mb-3 font-mono uppercase">Official ID Document Copies</h2>
          <div className="grid grid-cols-2 gap-4">
            {frontDocUrl && (
              <div className="border border-zinc-400 p-2 text-center">
                <p className="text-[10px] font-mono mb-1">FRONT ID COPY</p>
                <img src={frontDocUrl} alt="Front ID" className="max-h-48 mx-auto object-contain" />
              </div>
            )}
            {backDocUrl && (
              <div className="border border-zinc-400 p-2 text-center">
                <p className="text-[10px] font-mono mb-1">BACK ID COPY</p>
                <img src={backDocUrl} alt="Back ID" className="max-h-48 mx-auto object-contain" />
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-black pt-4 mt-8 flex justify-between font-mono text-xs">
          <div>
            <p>Guest Signature: _______________________</p>
          </div>
          <div>
            <p>Duty Concierge Signature: _______________________</p>
          </div>
        </div>
      </div>

    </div>
  );
}
