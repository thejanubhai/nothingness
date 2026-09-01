'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  ShieldCheck, CheckCircle2, Camera, UploadCloud, 
  MapPin, Calendar, Sparkles, AlertCircle, RefreshCw, 
  ArrowRight, Lock, Image as ImageIcon, Check
} from 'lucide-react';
import { toast } from 'sonner';
import IDScanningAnimation from '@/components/IDScanningAnimation';

function InviteVerificationContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking');

  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifiedName, setVerifiedName] = useState('');

  // Form State
  const [phone, setPhone] = useState('');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // File Inputs
  const frontCameraRef = useRef<HTMLInputElement>(null);
  const frontGalleryRef = useRef<HTMLInputElement>(null);
  const backCameraRef = useRef<HTMLInputElement>(null);
  const backGalleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    } else {
      setLoading(false);
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/verify-guest/invite?booking=${bookingId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch stay details');
      setBookingData(data.booking);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired invite link');
    } finally {
      setLoading(false);
    }
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (side === 'front') {
          setFrontImage(result);
        } else {
          setBackImage(result);
        }
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 10) {
      setError('Please provide your 10-digit mobile number.');
      return;
    }
    if (!frontImage || !backImage) {
      setError('Both Front and Back photos of Aadhaar Card or Passport are required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    toast.loading('Validating document security coordinates...');

    try {
      const res = await fetch('/api/verify-guest/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          phone,
          frontImage,
          backImage,
          mimeType: 'image/jpeg'
        })
      });

      const data = await res.json();
      toast.dismiss();

      if (!res.ok) throw new Error(data.error || data.message || 'Verification failed');

      setVerified(true);
      setVerifiedName(data.name || 'Guest');
      toast.success('Identity Verified for 180 Days!', {
        description: `Welcome, ${data.name}! You are registered for this stay.`
      });
    } catch (err: any) {
      toast.dismiss();
      setError(err.message || 'Failed to verify ID');
      toast.error(err.message || 'Failed to verify ID');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen pt-36 pb-24 px-5 max-w-xl mx-auto flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 border-2 border-accent-gold/20 border-t-accent-gold rounded-full animate-spin mb-4" />
        <p className="text-white/40 text-xs font-mono tracking-widest uppercase">Loading Guest Portal...</p>
      </main>
    );
  }

  if (!bookingId || !bookingData) {
    return (
      <main className="min-h-screen pt-36 pb-24 px-5 max-w-xl mx-auto flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h1 className="font-serif text-2xl text-white mb-2">Invalid Invite Link</h1>
        <p className="text-white/50 text-sm mb-6">This stay invitation link is missing or expired.</p>
      </main>
    );
  }

  const space = bookingData.space;

  return (
    <main className="min-h-screen pt-28 pb-24 px-4 sm:px-6 md:px-8 max-w-2xl mx-auto flex flex-col items-center">
      
      {/* Top Badge */}
      <div className="mb-6 text-center w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-gold/10 border border-accent-gold/20 rounded-full mb-3">
          <Sparkles className="w-3.5 h-3.5 text-accent-gold" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-accent-gold font-mono">Guest Stay Invitation</span>
        </div>
        <h1 className="font-serif text-3xl md:text-4xl text-white mb-2 leading-tight">
          Welcome to <span className="italic text-accent-gold">{space?.title || 'Nothingness'}</span>
        </h1>
        <p className="text-white/50 text-xs md:text-sm">
          {bookingData.primary_guest_name ? `Invited by ${bookingData.primary_guest_name} • ` : ''}
          Complete your 30-second digital check-in below.
        </p>
      </div>

      {/* Stay Details Summary */}
      {space && (
        <div className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-6 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-white">{space.title}</h2>
            <p className="text-xs text-white/50 flex items-center gap-1.5 font-mono">
              <MapPin className="w-3.5 h-3.5 text-accent-gold/70" />
              {space.area || 'Delhi NCR'}, {space.city || 'India'}
            </p>
          </div>
          {bookingData.check_in && (
            <div className="text-left sm:text-right font-mono text-xs text-white/70 bg-white/5 px-3 py-2 rounded-lg border border-white/5">
              <span className="text-white/40 block text-[9px] uppercase">Stay Dates</span>
              {bookingData.check_in} → {bookingData.check_out}
            </div>
          )}
        </div>
      )}

      {/* Verification Container */}
      <div className="w-full bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        
        {!verified ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-accent-gold" />
                <h3 className="text-base font-medium text-white">Govt ID Verification (Aadhaar / Passport)</h3>
              </div>
              <span className="text-[10px] text-green-400 font-mono px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20">
                180-Day Vetted
              </span>
            </div>

            <p className="text-xs text-white/50 leading-relaxed">
              Per Police Compliance hospitality check-in laws, please submit clear photos of your <strong className="text-white">Aadhaar Card</strong> or <strong className="text-white">Passport</strong> (Front &amp; Back).
            </p>

            {/* Hidden Inputs */}
            <input type="file" ref={frontCameraRef} onChange={(e) => handleImageFile(e, 'front')} accept="image/*" capture="environment" className="hidden" />
            <input type="file" ref={frontGalleryRef} onChange={(e) => handleImageFile(e, 'front')} accept="image/*" className="hidden" />
            <input type="file" ref={backCameraRef} onChange={(e) => handleImageFile(e, 'back')} accept="image/*" capture="environment" className="hidden" />
            <input type="file" ref={backGalleryRef} onChange={(e) => handleImageFile(e, 'back')} accept="image/*" className="hidden" />

            {/* Upload Boxes with Real Scanning Animation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Front */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-white/50">Front of ID Document</label>
                  {frontImage && <span className="text-[10px] text-green-400 font-bold font-mono">✓ Ready</span>}
                </div>

                {!frontImage ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => frontCameraRef.current?.click()}
                      className="border border-dashed border-white/10 hover:border-accent-gold/50 rounded-xl p-4 flex flex-col items-center justify-center gap-1 bg-white/[0.01] hover:bg-accent-gold/[0.02] transition-colors group"
                    >
                      <Camera className="w-5 h-5 text-accent-gold group-hover:scale-110 transition-transform" />
                      <span className="text-xs text-white/80 font-medium">Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => frontGalleryRef.current?.click()}
                      className="border border-dashed border-white/10 hover:border-accent-gold/50 rounded-xl p-4 flex flex-col items-center justify-center gap-1 bg-white/[0.01] hover:bg-accent-gold/[0.02] transition-colors group"
                    >
                      <ImageIcon className="w-5 h-5 text-white/50 group-hover:text-accent-gold group-hover:scale-110 transition-transform" />
                      <span className="text-xs text-white/80 font-medium">Gallery</span>
                    </button>
                  </div>
                ) : (
                  <div className="relative group">
                    <IDScanningAnimation imagePreview={frontImage} isScanning={submitting} />
                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                      <button type="button" onClick={() => frontCameraRef.current?.click()} className="px-2.5 py-1 bg-black/80 hover:bg-accent-gold hover:text-black border border-white/20 text-white rounded-lg text-[10px] font-mono transition-colors">Retake</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Back */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-white/50">Back of ID (Address)</label>
                  {backImage && <span className="text-[10px] text-green-400 font-bold font-mono">✓ Ready</span>}
                </div>

                {!backImage ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => backCameraRef.current?.click()}
                      className="border border-dashed border-white/10 hover:border-accent-gold/50 rounded-xl p-4 flex flex-col items-center justify-center gap-1 bg-white/[0.01] hover:bg-accent-gold/[0.02] transition-colors group"
                    >
                      <Camera className="w-5 h-5 text-accent-gold group-hover:scale-110 transition-transform" />
                      <span className="text-xs text-white/80 font-medium">Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => backGalleryRef.current?.click()}
                      className="border border-dashed border-white/10 hover:border-accent-gold/50 rounded-xl p-4 flex flex-col items-center justify-center gap-1 bg-white/[0.01] hover:bg-accent-gold/[0.02] transition-colors group"
                    >
                      <ImageIcon className="w-5 h-5 text-white/50 group-hover:text-accent-gold group-hover:scale-110 transition-transform" />
                      <span className="text-xs text-white/80 font-medium">Gallery</span>
                    </button>
                  </div>
                ) : (
                  <div className="relative group">
                    <IDScanningAnimation imagePreview={backImage} isScanning={submitting} />
                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                      <button type="button" onClick={() => backCameraRef.current?.click()} className="px-2.5 py-1 bg-black/80 hover:bg-accent-gold hover:text-black border border-white/20 text-white rounded-lg text-[10px] font-mono transition-colors">Retake</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Number Field */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="text-[10px] uppercase font-mono tracking-widest text-white/50">
                Your Mobile Number (For Digital Door Access)
              </label>
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-accent-gold font-mono placeholder:text-white/20"
              />
              <p className="text-[10px] text-white/40">
                Your Nothingness guest profile will be activated with 180-day reusable ID verification.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !phone || !frontImage || !backImage}
              className="w-full py-4 bg-accent-gold hover:bg-white text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {submitting ? 'Validating Security Credentials...' : 'Submit & Activate Stay Pass'}
            </button>

          </form>
        ) : (
          <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-400 shadow-xl">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="font-serif text-2xl text-white">Identity Verified &amp; Access Granted!</h2>
              <p className="text-sm text-accent-gold font-mono mt-1">
                Welcome, {verifiedName}.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left text-xs text-white/70 space-y-2 font-mono">
              <div className="flex items-center justify-between text-green-400">
                <span>✓ 180-Day Vetted Profile:</span>
                <span className="font-bold">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span>✓ Police Compliance Digital Register:</span>
                <span>Compliant</span>
              </div>
              <div className="flex items-center justify-between">
                <span>✓ Linked Sanctuary:</span>
                <span>{space.title}</span>
              </div>
            </div>

            <p className="text-xs text-white/40 leading-relaxed max-w-md mx-auto">
              You are all set for check-in. Smart lockbox PIN and sanctuary entrance directions will be active on check-in day.
            </p>
          </div>
        )}

      </div>
    </main>
  );
}

export default function InviteVerificationPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen pt-36 pb-24 px-5 max-w-xl mx-auto flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 border-2 border-accent-gold/20 border-t-accent-gold rounded-full animate-spin mb-4" />
        <p className="text-white/40 text-xs font-mono tracking-widest uppercase">Loading...</p>
      </main>
    }>
      <InviteVerificationContent />
    </Suspense>
  );
}
