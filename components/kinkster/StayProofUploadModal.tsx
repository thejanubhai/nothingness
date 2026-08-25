'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  ShieldCheck,
  Users,
  MessageSquare,
  Ticket,
  FileCheck,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface StayProofUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (extractedData: any) => void;
}

interface ExtractedData {
  platform: string;
  space_name: string;
  check_in: string;
  check_out: string;
  reservation_code?: string;
  primary_guest_name?: string;
  co_guests?: Array<{ name: string; status: string }>;
}

export default function StayProofUploadModal({ isOpen, onClose, onSuccess }: StayProofUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanStep, setScanStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [extractedResult, setExtractedResult] = useState<ExtractedData | null>(null);
  const [identityStats, setIdentityStats] = useState<{ total_co_guests: number; matched_existing: number; prestored_new: number } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            setScreenshots(prev => [...prev, ev.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
      setError(null);
    }
  };

  const handleRemoveScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const handleVerifyStay = async () => {
    if (screenshots.length === 0) {
      setError('Please upload at least one screenshot of your reservation or booking chat.');
      return;
    }

    setLoading(true);
    setError(null);
    setScanStep(1);

    // Simulate animated scanning steps for engaging UX
    const stepInterval = setInterval(() => {
      setScanStep(prev => (prev < 4 ? prev + 1 : prev));
    }, 900);

    try {
      const res = await fetch('/api/kinkster/verify-stay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenshots })
      });

      clearInterval(stepInterval);
      const data = await res.json();

      if (!res.ok || !data.verified) {
        throw new Error(data.error || 'Verification failed. Please check the screenshots and try again.');
      }

      setScanStep(4);
      setExtractedResult(data.extracted);
      setIdentityStats(data.identity_resolution);
      toast.success('Previous Stay Verified with Nothingness! 🔥', {
        description: `Confirmed reservation at ${data.extracted.space_name || 'Nothingness Space'} recorded.`
      });

    } catch (err: any) {
      clearInterval(stepInterval);
      setError(err.message || 'Error parsing reservation screenshots.');
      toast.error('Stay Verification Failed', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAndProceed = () => {
    if (extractedResult) {
      onSuccess(extractedResult);
      onClose();
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
                Gemini 2.5 Flash Vision AI
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5 tracking-tight">
              Previous Stay Verification
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mb-5 leading-relaxed">
              Kinkster accounts require at least one previous stay with Nothingness. Upload screenshot(s) of your <span className="text-rose-300 font-medium">Airbnb / MMT / Booking.com</span> reservation or your <span className="text-rose-300 font-medium">WhatsApp booking chat</span>.
            </p>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
            />

            {/* Accepted Platforms Presets Bar */}
            <div className="flex flex-wrap items-center gap-1.5 mb-5 p-2.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl text-[11px] text-zinc-400">
              <span className="font-semibold text-zinc-300 mr-1">Accepted Proofs:</span>
              <span className="px-2 py-0.5 bg-zinc-800 rounded-md text-zinc-200">Airbnb</span>
              <span className="px-2 py-0.5 bg-zinc-800 rounded-md text-zinc-200">MakeMyTrip (MMT)</span>
              <span className="px-2 py-0.5 bg-zinc-800 rounded-md text-zinc-200">Booking.com</span>
              <span className="px-2 py-0.5 bg-zinc-800 rounded-md text-zinc-200">WhatsApp Chat</span>
              <span className="px-2 py-0.5 bg-zinc-800 rounded-md text-zinc-200">Instagram DM</span>
            </div>

            {!extractedResult ? (
              <div className="space-y-4">
                {/* Upload Drag & Drop Area */}
                {screenshots.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-800 hover:border-rose-500/50 rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3 bg-zinc-900/30 hover:bg-rose-500/[0.02] cursor-pointer group text-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white mb-0.5">
                        Click to Upload Reservation or Chat Screenshots
                      </p>
                      <p className="text-xs text-zinc-400">
                        Supports multiple images (JPEG, PNG, WebP)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-zinc-300">
                        Uploaded Screenshots ({screenshots.length})
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add More Screenshots
                      </button>
                    </div>

                    {/* Screenshot Thumbnails Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-48 overflow-y-auto p-1 bg-zinc-900/40 rounded-xl border border-zinc-800/80">
                      {screenshots.map((src, index) => (
                        <div key={index} className="relative aspect-video sm:aspect-square bg-zinc-900 rounded-lg overflow-hidden group border border-zinc-800">
                          <img src={src} alt={`Screenshot ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveScreenshot(index);
                            }}
                            className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-rose-600 text-white rounded-md transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live AI Scanning Step Indicators */}
                {loading && (
                  <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-2.5 animate-fadeIn">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Gemini Vision Optical Reservation Analysis in Progress...
                    </div>
                    <div className="space-y-1.5 text-[11px] text-zinc-400">
                      <div className={`flex items-center gap-2 ${scanStep >= 1 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                        {scanStep >= 1 ? '✓' : '•'} 1. Reading optical image metadata & platform markers
                      </div>
                      <div className={`flex items-center gap-2 ${scanStep >= 2 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                        {scanStep >= 2 ? '✓' : '•'} 2. Correlating Nothingness sanctuary timestamps & dates
                      </div>
                      <div className={`flex items-center gap-2 ${scanStep >= 3 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                        {scanStep >= 3 ? '✓' : '•'} 3. Resolving co-guest identities & Govt ID matching
                      </div>
                      <div className={`flex items-center gap-2 ${scanStep >= 4 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                        {scanStep >= 4 ? '✓' : '•'} 4. Recording confirmed ledger & updating Kinkster privileges
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
                      Analyzing Proof with Gemini AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Verify Previous Stay via AI
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
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">Platform Source</span>
                      <span className="font-bold text-rose-300 capitalize">{extractedResult.platform}</span>
                    </div>

                    <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">Check-In Date</span>
                      <span className="font-mono text-zinc-200">{extractedResult.check_in}</span>
                    </div>

                    <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">Check-Out Date</span>
                      <span className="font-mono text-zinc-200">{extractedResult.check_out}</span>
                    </div>
                  </div>

                  {/* Co-Guests Identification & Pre-storing Status */}
                  {extractedResult.co_guests && extractedResult.co_guests.length > 0 && (
                    <div className="mt-3 p-3 bg-zinc-900/90 rounded-xl border border-zinc-800">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-purple-400" />
                          Co-Guests Identified ({extractedResult.co_guests.length})
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded">
                          Discreet Linking Enabled
                        </span>
                      </div>
                      <div className="space-y-1">
                        {extractedResult.co_guests.map((cg, idx) => (
                          <div key={idx} className="text-[11px] text-zinc-300 flex items-center justify-between">
                            <span>• {cg.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">{cg.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-zinc-400 leading-relaxed font-mono">
                    🔒 <span className="text-zinc-300">Confidentiality Guarantee:</span> All reservation details and co-guest records are strictly isolated. No alerts or notifications are sent to any co-guests.
                  </p>
                </div>

                <button
                  onClick={handleConfirmAndProceed}
                  className="w-full bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Continue Kinkster Profile Setup
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
