'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  UploadCloud,
  FileImage,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Building2,
  Calendar,
  CreditCard,
  Users,
  RefreshCw,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface StayProofUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (bookingData: any) => void;
}

export default function StayProofUploadModal({
  isOpen,
  onClose,
  onSuccess
}: StayProofUploadModalProps) {
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<number>(0);
  const [extractedResult, setExtractedResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (screenshots.length + files.length > 10) {
      toast.error('You can upload up to 10 screenshots total.');
      return;
    }

    const readers: Promise<string>[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image.`);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit.`);
        return;
      }

      const reader = new Promise<string>((resolve) => {
        const fileReader = new FileReader();
        fileReader.onload = () => resolve(fileReader.result as string);
        fileReader.readAsDataURL(file);
      });

      readers.push(reader);
    });

    Promise.all(readers).then((newBase64Images) => {
      setScreenshots((prev) => [...prev, ...newBase64Images]);
      setError(null);
    });
  };

  const handleRemoveScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVerifyStay = async () => {
    if (screenshots.length === 0) {
      toast.error('Please upload at least 1 screenshot of your booking or chat.');
      return;
    }

    setLoading(true);
    setError(null);
    setScanStep(1);

    // Simulate multi-phase optical analysis steps
    const stepTimer1 = setTimeout(() => setScanStep(2), 1200);
    const stepTimer2 = setTimeout(() => setScanStep(3), 2400);
    const stepTimer3 = setTimeout(() => setScanStep(4), 3600);

    try {
      const res = await fetch('/api/kinkster/verify-stay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenshots })
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Optical stay verification failed.');
      }

      setExtractedResult(data.extracted_data);
      toast.success('Previous Stay Verified!', {
        description: `Recognized reservation for ${data.extracted_data.space_name} (${data.extracted_data.check_in_date})`
      });

      setTimeout(() => {
        onSuccess(data);
      }, 2500);
    } catch (err: any) {
      console.error('Stay verification error:', err);
      setError(err.message || 'Verification failed. Please ensure screenshots clearly show booking dates or chat details.');
      toast.error('Verification Failed', { description: err.message });
    } finally {
      setLoading(false);
      setScanStep(0);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative my-auto max-h-[92vh] flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Content */}
          <div className="p-6 sm:p-8 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] uppercase font-mono tracking-wider flex items-center gap-1">
                <Building2 className="w-3 h-3 text-rose-400" />
                Nothingness Guest Verification
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] uppercase font-mono tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                Autonomous Optical Verification
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5 tracking-tight">
              Previous Stay Verification
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mb-5 leading-relaxed">
              Kinkster accounts require at least one previous stay with Nothingness. Upload screenshot(s) of your <span className="text-rose-300 font-medium">Airbnb / MMT / Booking.com</span> reservation or your <span className="text-rose-300 font-medium">WhatsApp booking chat</span>.
            </p>

            {/* Main Form State */}
            {!extractedResult ? (
              <div className="space-y-4">
                {/* Upload Drag/Click Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-800 hover:border-rose-500/50 bg-zinc-900/40 hover:bg-zinc-900/60 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    Upload Booking Screenshot(s) or WhatsApp Chat
                  </h4>
                  <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                    Select 1 to 10 screenshots (Airbnb, MakeMyTrip, Booking.com, Instagram/WhatsApp chat receipt).
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-rose-400/80 font-mono">
                    <Sparkles className="w-3 h-3" />
                    Autonomous Optical Document Parsing
                  </div>
                </div>

                {/* Thumbnails Grid */}
                {screenshots.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                      <span>Selected Screenshots ({screenshots.length}/10)</span>
                      <button
                        onClick={() => setScreenshots([])}
                        className="text-rose-400 hover:text-rose-300 transition-colors"
                      >
                        Clear all
                      </button>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-48 overflow-y-auto p-1 bg-zinc-900/40 rounded-xl border border-zinc-800/80">
                      {screenshots.map((src, index) => (
                        <div key={index} className="relative aspect-video sm:aspect-square bg-zinc-900 rounded-lg overflow-hidden group border border-zinc-800">
                          <img src={src} alt={`Screenshot ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveScreenshot(index);
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Scanning Step Indicators */}
                {loading && (
                  <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-2.5 animate-fadeIn">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Optical Ledger Verification in Progress...
                    </div>
                    <div className="space-y-1.5 text-[11px] text-zinc-400">
                      <div className={`flex items-center gap-2 ${scanStep >= 1 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                        {scanStep >= 1 ? '✓' : '•'} 1. Reading optical image metadata &amp; platform markers
                      </div>
                      <div className={`flex items-center gap-2 ${scanStep >= 2 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                        {scanStep >= 2 ? '✓' : '•'} 2. Correlating Nothingness sanctuary timestamps &amp; dates
                      </div>
                      <div className={`flex items-center gap-2 ${scanStep >= 3 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                        {scanStep >= 3 ? '✓' : '•'} 3. Resolving co-guest identities &amp; Govt ID matching
                      </div>
                      <div className={`flex items-center gap-2 ${scanStep >= 4 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                        {scanStep >= 4 ? '✓' : '•'} 4. Recording confirmed ledger &amp; updating Kinkster privileges
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Verification Button */}
                <button
                  onClick={handleVerifyStay}
                  disabled={loading || screenshots.length === 0}
                  className="w-full mt-3 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Authenticating Reservation Proof...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Authenticate Previous Stay
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Verification Success & Extracted Data Confirmation Screen */
              <div className="space-y-4 animate-fadeIn">
                <div className="p-5 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    Stay Authenticated &amp; Recorded in Database!
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">Sanctuary Space</span>
                      <span className="font-bold text-white text-sm">{extractedResult.space_name}</span>
                    </div>

                    <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">Platform</span>
                      <span className="font-bold text-rose-300 uppercase font-mono">{extractedResult.platform}</span>
                    </div>

                    <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">Check-In Date</span>
                      <span className="font-mono text-zinc-200">{extractedResult.check_in_date || 'Verified'}</span>
                    </div>

                    <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">Check-Out Date</span>
                      <span className="font-mono text-zinc-200">{extractedResult.check_out_date || 'Verified'}</span>
                    </div>
                  </div>

                  {extractedResult.reservation_code && (
                    <div className="p-2.5 bg-zinc-900/60 rounded-lg text-xs font-mono text-zinc-400 flex items-center justify-between">
                      <span>Confirmation Ref:</span>
                      <span className="text-emerald-400 font-bold">{extractedResult.reservation_code}</span>
                    </div>
                  )}

                  {extractedResult.co_guests && extractedResult.co_guests.length > 0 && (
                    <div className="pt-2 text-xs text-zinc-400">
                      <span className="text-zinc-500 font-mono block mb-1">
                        🔒 Confidential Co-Guest Identities Shadow-Linked:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {extractedResult.co_guests.map((cg: any, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[11px] font-mono text-zinc-300">
                            {cg.full_name || 'Guest'} {cg.document_number ? `(ID: ${cg.document_number.slice(-4)})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center text-xs font-mono text-zinc-500 animate-pulse">
                  Updating your Kinkster Status...
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
