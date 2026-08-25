'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, Sparkles, Camera, UploadCloud, ShieldCheck, 
  CheckCircle2, ScanLine, Search, UserCheck, RefreshCw, FileText, 
  Globe, AlertCircle, X, Eye, Check, UserPlus, Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import IDScanningAnimation from '@/components/IDScanningAnimation';

export default function AddGuestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    id_document_type: 'Aadhaar',
    document_number: '',
    dob: '',
    permanent_address: '',
    is_foreign_national: false,
    nationality: 'Indian',
    visa_number: '',
    is_verified: true,
  });

  // Phone Lookup State
  const [searchingPhone, setSearchingPhone] = useState(false);
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [autoFilledFromPhone, setAutoFilledFromPhone] = useState(false);

  // Optical ID Scan State
  const frontCameraRef = useRef<HTMLInputElement>(null);
  const frontGalleryRef = useRef<HTMLInputElement>(null);
  const backCameraRef = useRef<HTMLInputElement>(null);
  const backGalleryRef = useRef<HTMLInputElement>(null);

  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanConfidence, setScanConfidence] = useState<number | null>(null);
  const [autoFilledFromScan, setAutoFilledFromScan] = useState(false);

  // Debounced Phone Search
  useEffect(() => {
    const raw = formData.phone_number.trim();
    const cleanDigits = raw.replace(/[^0-9]/g, '');

    if (cleanDigits.length < 10) {
      setLookupResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingPhone(true);
      try {
        const res = await fetch(`/api/admin/guests/lookup?phone=${encodeURIComponent(cleanDigits)}`);
        const data = await res.json();
        if (data.success && data.found && data.guest) {
          setLookupResult(data.guest);
        } else {
          setLookupResult(null);
        }
      } catch (err) {
        console.error('Phone lookup error:', err);
      } finally {
        setSearchingPhone(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.phone_number]);

  // Apply Phone Lookup Data
  const applyLookupGuest = (guest: any) => {
    setFormData(prev => ({
      ...prev,
      full_name: guest.full_name || prev.full_name,
      id_document_type: guest.id_document_type || prev.id_document_type,
      document_number: guest.document_number || prev.document_number,
      dob: guest.dob || prev.dob,
      permanent_address: guest.permanent_address || prev.permanent_address,
      is_foreign_national: !!guest.is_foreign_national,
      nationality: guest.nationality || prev.nationality,
      visa_number: guest.visa_number || prev.visa_number,
      is_verified: true,
    }));
    setAutoFilledFromPhone(true);
    toast.success(`Auto-filled profile for ${guest.full_name}!`, {
      description: guest.is_180_day_valid ? '180-Day Vetted Guest Profile linked.' : 'Past stay record pre-populated.'
    });
  };

  // Handle Image Upload for Scanning
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (side === 'front') {
          setFrontImage(result);
          scanIdDocument(result, backImage);
        } else {
          setBackImage(result);
          scanIdDocument(frontImage, result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Optical Security Scanning Trigger
  const scanIdDocument = async (front: string | null, back: string | null) => {
    if (!front && !back) return;
    setScanning(true);
    setError(null);
    toast.loading('Analyzing document security features & extracting details...');

    try {
      const res = await fetch('/api/admin/guests/scan-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frontImage: front,
          backImage: back,
          mimeType: 'image/jpeg'
        })
      });

      const data = await res.json();
      toast.dismiss();

      if (data.success && data.extracted) {
        const ext = data.extracted;
        setFormData(prev => ({
          ...prev,
          full_name: ext.full_name || prev.full_name,
          id_document_type: ext.id_document_type || prev.id_document_type,
          document_number: ext.document_number || prev.document_number,
          dob: ext.dob || prev.dob,
          permanent_address: ext.permanent_address || prev.permanent_address,
          is_foreign_national: !!ext.is_foreign_national,
          nationality: ext.nationality || prev.nationality,
          is_verified: true,
        }));
        setScanConfidence(ext.confidence_score || 98);
        setAutoFilledFromScan(true);
        toast.success('Document Authenticated & Details Captured!', {
          description: `Name: ${ext.full_name || 'Detected'} | ${ext.id_document_type || 'ID'}: ${ext.document_number || 'OK'}`
        });
      } else if (data.fallback) {
        toast.info('Security Notice', { description: data.error });
      } else {
        toast.error(data.error || 'Could not parse document. You can enter details manually.');
      }
    } catch (err: any) {
      toast.dismiss();
      console.error('Scan error:', err);
      toast.error('Scanning network error');
    } finally {
      setScanning(false);
    }
  };

  // Save / Register Guest
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.full_name.trim()) {
      setError('Please provide the guest full name.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
      const cleanPhone = formData.phone_number ? formData.phone_number.replace(/[^0-9+]/g, '') : null;

      const { data: inserted, error: insertError } = await supabase
        .from('guest_profiles')
        .upsert(
          {
            full_name: formData.full_name.trim(),
            phone_number: cleanPhone,
            phone: cleanPhone,
            id_document_type: formData.id_document_type,
            document_number: formData.document_number?.trim() || null,
            dob: formData.dob?.trim() || null,
            permanent_address: formData.permanent_address?.trim() || null,
            is_foreign_national: formData.is_foreign_national,
            nationality: formData.nationality?.trim() || 'Indian',
            visa_number: formData.visa_number?.trim() || null,
            is_verified: formData.is_verified,
            verification_timestamp: formData.is_verified ? now.toISOString() : null,
            verification_expires_at: formData.is_verified ? expiresAt.toISOString() : null,
            police_register_status: formData.is_verified
              ? (formData.is_foreign_national ? 'form_c_required' : 'verified_compliant')
              : 'action_required',
          },
          { onConflict: 'document_number' }
        )
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('Guest Profile Registered & Verified for 180 Days!', {
        description: `${formData.full_name} is now active in Delhi Police Digital Register.`
      });

      router.push('/admin/guests');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to register guest');
      toast.error('Failed to register guest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/guests" className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-white/50 hover:text-white border border-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-accent-gold/10 text-accent-gold border border-accent-gold/20 text-[10px] uppercase font-mono tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Digital Security Verification
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] uppercase font-mono tracking-wider">
                180-Day Vetted
              </span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl text-white">Add &amp; Verify Guest</h1>
            <p className="text-white/50 text-xs md:text-sm tracking-wide mt-0.5">
              Enter phone number for instant auto-lookup, or snap/upload ID document for automatic validation.
            </p>
          </div>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={loading || !formData.full_name}
          className="flex items-center justify-center gap-2 bg-accent-gold text-black px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white transition-all shadow-xl disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? 'Registering...' : 'Save & Verify Guest'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. DOCUMENT SCANNER DROPZONE */}
      <div className="bg-gradient-to-br from-white/[0.04] to-black border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-accent-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center text-accent-gold">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-white">Government ID Security Scanner</h2>
              <p className="text-[11px] text-white/40">Snap or upload Aadhaar Card / Passport for automatic detail extraction.</p>
            </div>
          </div>

          {autoFilledFromScan && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-400 rounded-full text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" /> Details Authenticated ({scanConfidence}% confidence)
            </span>
          )}
        </div>

        {/* Hidden File Inputs */}
        <input type="file" ref={frontCameraRef} onChange={(e) => handleImageFile(e, 'front')} accept="image/*" capture="environment" className="hidden" />
        <input type="file" ref={frontGalleryRef} onChange={(e) => handleImageFile(e, 'front')} accept="image/*" className="hidden" />
        <input type="file" ref={backCameraRef} onChange={(e) => handleImageFile(e, 'back')} accept="image/*" capture="environment" className="hidden" />
        <input type="file" ref={backGalleryRef} onChange={(e) => handleImageFile(e, 'back')} accept="image/*" className="hidden" />

        {/* Dual ID Upload Zones with Optical Scanning Animation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Front ID */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-white/50 flex items-center justify-between">
              <span>Front of ID (Aadhaar / Passport)</span>
              {frontImage && <span className="text-green-400 font-bold">✓ Loaded</span>}
            </label>
            
            {!frontImage ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => frontCameraRef.current?.click()}
                  className="border border-dashed border-white/10 hover:border-accent-gold/50 rounded-2xl p-5 flex flex-col items-center justify-center gap-1.5 bg-white/[0.01] hover:bg-accent-gold/[0.02] transition-colors group"
                >
                  <Camera className="w-5 h-5 text-accent-gold group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-white/80 font-medium">Camera</span>
                  <span className="text-[9px] text-white/40 font-mono">Direct Snap</span>
                </button>

                <button
                  type="button"
                  onClick={() => frontGalleryRef.current?.click()}
                  className="border border-dashed border-white/10 hover:border-accent-gold/50 rounded-2xl p-5 flex flex-col items-center justify-center gap-1.5 bg-white/[0.01] hover:bg-accent-gold/[0.02] transition-colors group"
                >
                  <ImageIcon className="w-5 h-5 text-white/50 group-hover:text-accent-gold group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-white/80 font-medium">Gallery</span>
                  <span className="text-[9px] text-white/40 font-mono">Upload File</span>
                </button>
              </div>
            ) : (
              <div className="relative group">
                <IDScanningAnimation imagePreview={frontImage} isScanning={scanning} />
                <div className="absolute top-2 right-2 flex gap-1 z-10">
                  <button type="button" onClick={() => frontCameraRef.current?.click()} className="px-2.5 py-1 bg-black/80 hover:bg-accent-gold hover:text-black border border-white/20 text-white rounded-lg text-[10px] font-mono transition-colors">Retake</button>
                </div>
              </div>
            )}
          </div>

          {/* Back ID */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-white/50 flex items-center justify-between">
              <span>Back of ID (Address Side)</span>
              {backImage && <span className="text-green-400 font-bold">✓ Loaded</span>}
            </label>
            
            {!backImage ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => backCameraRef.current?.click()}
                  className="border border-dashed border-white/10 hover:border-accent-gold/50 rounded-2xl p-5 flex flex-col items-center justify-center gap-1.5 bg-white/[0.01] hover:bg-accent-gold/[0.02] transition-colors group"
                >
                  <Camera className="w-5 h-5 text-accent-gold group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-white/80 font-medium">Camera</span>
                  <span className="text-[9px] text-white/40 font-mono">Direct Snap</span>
                </button>

                <button
                  type="button"
                  onClick={() => backGalleryRef.current?.click()}
                  className="border border-dashed border-white/10 hover:border-accent-gold/50 rounded-2xl p-5 flex flex-col items-center justify-center gap-1.5 bg-white/[0.01] hover:bg-accent-gold/[0.02] transition-colors group"
                >
                  <ImageIcon className="w-5 h-5 text-white/50 group-hover:text-accent-gold group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-white/80 font-medium">Gallery</span>
                  <span className="text-[9px] text-white/40 font-mono">Upload File</span>
                </button>
              </div>
            ) : (
              <div className="relative group">
                <IDScanningAnimation imagePreview={backImage} isScanning={scanning} />
                <div className="absolute top-2 right-2 flex gap-1 z-10">
                  <button type="button" onClick={() => backCameraRef.current?.click()} className="px-2.5 py-1 bg-black/80 hover:bg-accent-gold hover:text-black border border-white/20 text-white rounded-lg text-[10px] font-mono transition-colors">Retake</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. GUEST VERIFICATION FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
          
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-accent-gold" />
              <h2 className="font-serif text-xl text-white">Guest Identification Details</h2>
            </div>
            {autoFilledFromPhone && (
              <span className="text-[10px] text-accent-gold font-mono px-2.5 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 flex items-center gap-1">
                <Check className="w-3 h-3" /> Returning Guest Linked
              </span>
            )}
          </div>

          {/* PHONE NUMBER FIELD WITH INSTANT AUTO-LOOKUP */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">
                Phone Number (Instant Auto-Lookup)
              </label>
              {searchingPhone && (
                <span className="text-[10px] text-accent-gold font-mono flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Searching Guest Registry...
                </span>
              )}
            </div>
            
            <div className="relative">
              <input 
                type="tel" 
                value={formData.phone_number}
                onChange={(e) => {
                  setFormData({...formData, phone_number: e.target.value});
                  setAutoFilledFromPhone(false);
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 pl-11 text-sm text-white focus:outline-none focus:border-accent-gold font-mono placeholder:text-white/20 transition-all"
                placeholder="+91 98765 43210 (Type to auto-fill)"
              />
              <Search className="w-4 h-4 text-accent-gold/60 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>

            {/* Returning Guest Banner */}
            {lookupResult && (
              <div className="bg-gradient-to-r from-accent-gold/15 to-accent-gold/5 border border-accent-gold/30 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white font-semibold text-sm">{lookupResult.full_name}</span>
                      {lookupResult.is_180_day_valid ? (
                        <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-mono font-bold">
                          ✓ 180-Day Verified
                        </span>
                      ) : (
                        <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-accent-gold/20 text-accent-gold border border-accent-gold/30 font-mono">
                          Past Guest ({lookupResult.stays_count || 1} stays)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/60 font-mono">
                      {lookupResult.id_document_type}: {lookupResult.document_number || 'Recorded'} • {lookupResult.permanent_address || 'Address on file'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => applyLookupGuest(lookupResult)}
                    className="px-3.5 py-1.5 bg-accent-gold hover:bg-white text-black text-xs font-bold rounded-lg transition-colors uppercase tracking-wider shadow-md whitespace-nowrap"
                  >
                    ⚡ Auto-Fill Profile
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* FULL NAME */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono flex items-center justify-between">
              <span>Full Name (As on Govt ID)</span>
              {autoFilledFromScan && <span className="text-accent-gold text-[9px] font-mono">✓ Authenticated from ID</span>}
            </label>
            <input 
              required
              type="text" 
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-accent-gold placeholder:text-white/20 transition-all font-medium"
              placeholder="e.g., Jane Doe"
            />
          </div>

          {/* ID TYPE & DOCUMENT NUMBER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">ID Document Type</label>
              <select 
                value={formData.id_document_type}
                onChange={(e) => setFormData({...formData, id_document_type: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-accent-gold"
              >
                <option value="Aadhaar" className="bg-black text-white">Aadhaar Card (India)</option>
                <option value="Passport" className="bg-black text-white">International Passport</option>
                <option value="Driving License" className="bg-black text-white">Driving License</option>
                <option value="Voter ID" className="bg-black text-white">Voter ID</option>
                <option value="Other" className="bg-black text-white">Other Government ID</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">Document / ID Number</label>
              <input 
                type="text" 
                value={formData.document_number}
                onChange={(e) => setFormData({...formData, document_number: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-accent-gold font-mono placeholder:text-white/20"
                placeholder="e.g., 1234 5678 9012 or Passport No"
              />
            </div>
          </div>

          {/* GUEST CITIZENSHIP & POLICE CATEGORY */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">
              Guest Citizenship &amp; Police Compliance Category
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    is_foreign_national: false,
                    nationality: 'Indian',
                    id_document_type: prev.id_document_type === 'Passport' ? 'Aadhaar' : prev.id_document_type
                  }));
                }}
                className={`py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all border ${
                  !formData.is_foreign_national
                    ? 'bg-green-500/15 border-green-500/40 text-green-300 shadow-md font-bold'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>🇮🇳 Indian Resident</span>
                <span className="text-[10px] opacity-70 font-mono">(Delhi Police Check-in)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    is_foreign_national: true,
                    nationality: prev.nationality === 'Indian' ? '' : prev.nationality,
                    id_document_type: 'Passport'
                  }));
                }}
                className={`py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all border ${
                  formData.is_foreign_national
                    ? 'bg-accent-gold/20 border-accent-gold/50 text-accent-gold shadow-md font-bold'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>🌐 Foreign National</span>
                <span className="text-[10px] opacity-70 font-mono">(Form C Required)</span>
              </button>
            </div>
          </div>

          {/* DOB & NATIONALITY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">Date of Birth (DOB)</label>
              <input 
                type="text" 
                value={formData.dob}
                onChange={(e) => setFormData({...formData, dob: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-accent-gold font-mono placeholder:text-white/20"
                placeholder="DD/MM/YYYY"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">
                {formData.is_foreign_national ? 'Passport Country / Nationality' : 'Nationality'}
              </label>
              <input 
                type="text" 
                value={formData.nationality}
                onChange={(e) => setFormData({
                  ...formData, 
                  nationality: e.target.value
                })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-accent-gold placeholder:text-white/20"
                placeholder={formData.is_foreign_national ? "e.g., United Kingdom, USA, Germany" : "Indian"}
              />
            </div>
          </div>

          {/* PERMANENT ADDRESS */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">
              Permanent Residential Address (For Delhi Police Compliance)
            </label>
            <textarea 
              rows={2}
              value={formData.permanent_address}
              onChange={(e) => setFormData({...formData, permanent_address: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-accent-gold placeholder:text-white/20 leading-relaxed"
              placeholder="Residential address as printed on ID back..."
            />
          </div>

          {/* FOREIGN NATIONAL FORM C */}
          {formData.is_foreign_national && (
            <div className="bg-accent-gold/5 border border-accent-gold/20 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-accent-gold/20 pb-3">
                <div className="flex items-center gap-2 text-accent-gold text-xs font-bold uppercase tracking-wider">
                  <Globe className="w-4 h-4" /> Form C Foreign National Compliance
                </div>
                <span className="text-[10px] text-accent-gold font-mono px-2 py-0.5 rounded bg-accent-gold/10 border border-accent-gold/30">
                  Mandatory for Foreigners
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">Indian Visa / e-Visa Number</label>
                  <input 
                    type="text" 
                    value={formData.visa_number}
                    onChange={(e) => setFormData({...formData, visa_number: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-accent-gold font-mono"
                    placeholder="e.g., V123456789"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/50 font-mono">Passport Issuing Country</label>
                  <input 
                    type="text" 
                    value={formData.nationality}
                    onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-accent-gold"
                    placeholder="e.g., United States"
                  />
                </div>
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed">
                ℹ️ Per Bureau of Immigration (BOI) India regulations, foreign national check-ins must be recorded under Form C with Visa and Passport information.
              </p>
            </div>
          )}

          {/* VERIFICATION & POLICE COMPLIANCE TOGGLE */}
          <div className="pt-2 border-t border-white/10">
            <label className="flex items-start gap-3.5 cursor-pointer bg-white/[0.02] p-4 rounded-2xl border border-white/5 hover:border-accent-gold/30 transition-colors">
              <input 
                type="checkbox" 
                checked={formData.is_verified}
                onChange={(e) => setFormData({...formData, is_verified: e.target.checked})}
                className="w-5 h-5 rounded border-white/20 text-accent-gold focus:ring-accent-gold bg-transparent mt-0.5"
              />
              <div>
                <span className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                  Guest is Verified (180-Day Vetted Protocol)
                </span>
                <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
                  Confirms government ID authenticity. Sets compliance status to <code className="text-accent-gold">verified_compliant</code> for Delhi Police Digital Guest Register with 180 days reusable validity.
                </p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button 
              type="submit"
              disabled={loading || !formData.full_name}
              className="flex-1 py-4 bg-accent-gold hover:bg-white text-black font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? 'Registering Guest...' : 'Save & Verify Guest Profile'}
            </button>

            <Link
              href="/admin/guests"
              className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-xs font-semibold uppercase tracking-wider text-center transition-colors border border-white/10"
            >
              Cancel
            </Link>
          </div>

        </div>
      </form>
    </div>
  );
}
