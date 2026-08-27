'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  ShieldCheck,
  X,
  Camera,
  RefreshCw,
  AlertCircle,
  Image as ImageIcon,
  Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';
import IDScanningAnimation from '@/components/IDScanningAnimation';
import { createClient } from '@/lib/supabase/client';

interface IDUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestId?: string;
  token?: string;
  phone?: string;
  bookingId?: string;
  onSuccess: (name: string) => void;
}

export default function IDUploadModal({
  isOpen,
  onClose,
  guestId,
  token,
  phone: initialPhone,
  bookingId,
  onSuccess,
}: IDUploadModalProps) {
  const frontCameraRef = useRef<HTMLInputElement>(null);
  const frontGalleryRef = useRef<HTMLInputElement>(null);
  const backCameraRef = useRef<HTMLInputElement>(null);
  const backGalleryRef = useRef<HTMLInputElement>(null);

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);

  const [backFile, setBackFile] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  const [inputPhone, setInputPhone] = useState(initialPhone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fetch logged in user's phone if not passed as prop
  useEffect(() => {
    if (isOpen) {
      if (initialPhone) {
        setInputPhone(initialPhone);
      } else {
        const fetchUserPhone = async () => {
          try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.phone) {
              setInputPhone(user.phone);
            }
          } catch (e) {
            // ignore
          }
        };
        fetchUserPhone();
      }
    }
  }, [isOpen, initialPhone]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (side === 'front') {
          setFrontFile(selected);
          setFrontPreview(ev.target?.result as string);
        } else {
          setBackFile(selected);
          setBackPreview(ev.target?.result as string);
        }
      };
      reader.readAsDataURL(selected);
      setError(null);
    }
  };

  const submitVerification = async () => {
    if (!frontPreview || !backPreview) {
      setError('Both Front and Back photos of your ID are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const frontBase64 = frontPreview.split(',')[1];
      const backBase64 = backPreview.split(',')[1];

      const payload: any = {
        frontImage: frontBase64,
        backImage: backBase64,
        mimeType: frontFile?.type || 'image/jpeg',
      };

      if (token) payload.token = token;
      else if (bookingId && guestId) {
        payload.bookingId = bookingId;
        payload.guestId = guestId;
      }
      if (inputPhone) payload.phone = inputPhone;

      const res = await fetch('/api/verify-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || data.reason || 'Verification failed');

      if (data.requiresPayment) {
        toast.info(`Connecting to PayU for ₹${data.fee?.toLocaleString('en-IN')} Statutory Verification Fee...`);
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.paymentUrl;

        Object.entries(data.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
          }
        });

        document.body.appendChild(form);
        form.submit();
        return;
      }

      if (data.verified) {
        toast.success('Identity Authenticated for 180 Days!', {
          description: `Welcome, ${data.name || 'Guest'}.`,
        });
        onSuccess(data.name);
      } else {
        throw new Error(data.reason || 'ID verification could not be validated.');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error('Verification Failed', { description: err.message });
      setFrontFile(null);
      setFrontPreview(null);
      setBackFile(null);
      setBackPreview(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full transition-colors z-10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-5 sm:p-8">
              <div className="sheet-drag-pill sm:hidden" />
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-md bg-accent-gold/10 text-accent-gold border border-accent-gold/20 text-[10px] uppercase font-mono tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Digital Security Scan
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] uppercase font-mono tracking-wider">
                  Delhi Police Compliant
                </span>
              </div>

              <h2 className="font-serif text-xl sm:text-2xl mb-1.5 text-white">Digital Guest ID Verification</h2>
              <p className="text-xs sm:text-sm text-zinc-400 mb-4 leading-relaxed">
                Upload clear front &amp; back photos of your <span className="text-white font-medium">Aadhaar Card</span> or{' '}
                <span className="text-white font-medium">Passport</span>.
                <br />
                <span className="text-[10px] sm:text-[11px] text-amber-400/90 mt-1 inline-block font-mono">
                  ⚠️ Driving License &amp; Voter ID are not accepted per hospitality regulations.
                </span>
              </p>

              {/* Hidden file inputs for direct camera and gallery */}
              <input
                type="file"
                ref={frontCameraRef}
                onChange={(e) => handleFileChange(e, 'front')}
                accept="image/*"
                capture="environment"
                className="hidden"
              />
              <input
                type="file"
                ref={frontGalleryRef}
                onChange={(e) => handleFileChange(e, 'front')}
                accept="image/*"
                className="hidden"
              />
              <input
                type="file"
                ref={backCameraRef}
                onChange={(e) => handleFileChange(e, 'back')}
                accept="image/*"
                capture="environment"
                className="hidden"
              />
              <input
                type="file"
                ref={backGalleryRef}
                onChange={(e) => handleFileChange(e, 'back')}
                accept="image/*"
                className="hidden"
              />

              <div className="space-y-4">
                {/* Optional Phone Input if not in booking flow or prop */}
                {!token && !bookingId && (
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1.5 font-mono">
                      Mobile Number (For 180-Day Vetted Pass)
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={inputPhone}
                        onChange={(e) => setInputPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-accent-gold/60 font-mono"
                      />
                      <Smartphone className="w-4 h-4 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Front ID */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] sm:text-xs uppercase tracking-wider text-zinc-400 font-mono">
                      Front of ID Document
                    </p>
                    {frontPreview && <span className="text-[10px] text-green-400 font-mono font-bold">✓ Front Captured</span>}
                  </div>

                  {!frontPreview ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => frontCameraRef.current?.click()}
                        className="border border-dashed border-zinc-800 hover:border-accent-gold/50 rounded-xl p-4 transition-all flex flex-col items-center justify-center gap-1.5 bg-white/[0.02] hover:bg-accent-gold/[0.03] group cursor-pointer"
                      >
                        <Camera className="w-5 h-5 text-accent-gold group-hover:scale-110 transition-transform" />
                        <span className="text-xs text-white/80 font-medium">Take Photo</span>
                        <span className="text-[9px] text-white/40 font-mono">Direct Camera</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => frontGalleryRef.current?.click()}
                        className="border border-dashed border-zinc-800 hover:border-accent-gold/50 rounded-xl p-4 transition-all flex flex-col items-center justify-center gap-1.5 bg-white/[0.02] hover:bg-accent-gold/[0.03] group cursor-pointer"
                      >
                        <ImageIcon className="w-5 h-5 text-white/50 group-hover:text-accent-gold group-hover:scale-110 transition-transform" />
                        <span className="text-xs text-white/80 font-medium">Upload File</span>
                        <span className="text-[9px] text-white/40 font-mono">From Gallery</span>
                      </button>
                    </div>
                  ) : (
                    <div className="relative group">
                      <IDScanningAnimation imagePreview={frontPreview} isScanning={loading} />
                      <div className="absolute top-2 right-2 flex gap-1 z-10">
                        <button
                          type="button"
                          onClick={() => frontCameraRef.current?.click()}
                          className="px-2.5 py-1 bg-black/80 hover:bg-accent-gold hover:text-black border border-white/20 text-white rounded-lg text-[10px] font-mono transition-colors cursor-pointer"
                        >
                          Retake
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Back ID */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] sm:text-xs uppercase tracking-wider text-zinc-400 font-mono">
                      Back of ID Document (Address)
                    </p>
                    {backPreview && <span className="text-[10px] text-green-400 font-mono font-bold">✓ Back Captured</span>}
                  </div>

                  {!backPreview ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => backCameraRef.current?.click()}
                        className="border border-dashed border-zinc-800 hover:border-accent-gold/50 rounded-xl p-4 transition-all flex flex-col items-center justify-center gap-1.5 bg-white/[0.02] hover:bg-accent-gold/[0.03] group cursor-pointer"
                      >
                        <Camera className="w-5 h-5 text-accent-gold group-hover:scale-110 transition-transform" />
                        <span className="text-xs text-white/80 font-medium">Take Photo</span>
                        <span className="text-[9px] text-white/40 font-mono">Direct Camera</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => backGalleryRef.current?.click()}
                        className="border border-dashed border-zinc-800 hover:border-accent-gold/50 rounded-xl p-4 transition-all flex flex-col items-center justify-center gap-1.5 bg-white/[0.02] hover:bg-accent-gold/[0.03] group cursor-pointer"
                      >
                        <ImageIcon className="w-5 h-5 text-white/50 group-hover:text-accent-gold group-hover:scale-110 transition-transform" />
                        <span className="text-xs text-white/80 font-medium">Upload File</span>
                        <span className="text-[9px] text-white/40 font-mono">From Gallery</span>
                      </button>
                    </div>
                  ) : (
                    <div className="relative group">
                      <IDScanningAnimation imagePreview={backPreview} isScanning={loading} />
                      <div className="absolute top-2 right-2 flex gap-1 z-10">
                        <button
                          type="button"
                          onClick={() => backCameraRef.current?.click()}
                          className="px-2.5 py-1 bg-black/80 hover:bg-accent-gold hover:text-black border border-white/20 text-white rounded-lg text-[10px] font-mono transition-colors cursor-pointer"
                        >
                          Retake
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2 mt-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={submitVerification}
                disabled={loading || !frontPreview || !backPreview}
                className="w-full mt-6 bg-accent-gold hover:bg-white text-black py-4 rounded-xl text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {loading ? 'Authenticating Security Hologram...' : 'Submit & Verify ID'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
