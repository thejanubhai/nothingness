'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Lock,
  ArrowRight,
  Plus,
  Trash2,
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

interface UploadedImageItem {
  id: string;
  preview: string;
  file?: File;
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
  const router = useRouter();

  // Hidden inputs for primary camera and gallery
  const primaryCameraRef = useRef<HTMLInputElement>(null);
  const primaryGalleryRef = useRef<HTMLInputElement>(null);
  const addCameraRef = useRef<HTMLInputElement>(null);
  const addGalleryRef = useRef<HTMLInputElement>(null);

  const [uploadedImages, setUploadedImages] = useState<UploadedImageItem[]>([]);
  const [inputPhone, setInputPhone] = useState(initialPhone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(!token && !bookingId);

  // Auto-fetch logged in user's phone if not passed as prop
  useEffect(() => {
    if (isOpen) {
      const checkUserSession = async () => {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          setCurrentUser(user);
          if (user?.phone) {
            setInputPhone(user.phone);
          } else if (initialPhone) {
            setInputPhone(initialPhone);
          }
        } catch (e) {
          // ignore
        } finally {
          setCheckingAuth(false);
        }
      };
      checkUserSession();
    }
  }, [isOpen, initialPhone]);

  // Reset images when modal opens
  useEffect(() => {
    if (isOpen) {
      setUploadedImages([]);
      setError(null);
    }
  }, [isOpen]);

  const handleAddFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const newItems: UploadedImageItem[] = [];
    const maxAllowed = 2;
    const currentCount = uploadedImages.length;
    const availableSlots = maxAllowed - currentCount;

    const filesToProcess = Array.from(files).slice(0, availableSlots);

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const preview = ev.target?.result as string;
        if (preview) {
          setUploadedImages((prev) => {
            if (prev.length >= maxAllowed) return prev;
            return [
              ...prev,
              {
                id: Math.random().toString(36).substring(2, 9),
                preview,
                file,
              },
            ];
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setError(null);
  };

  const submitVerification = async () => {
    if (uploadedImages.length === 0) {
      setError('Please capture or upload at least one clear photo of your ID.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const base64List = uploadedImages.map((img) => {
        return img.preview.includes('base64,') ? img.preview.split('base64,')[1] : img.preview;
      });

      const payload: any = {
        images: base64List,
        mimeType: uploadedImages[0]?.file?.type || 'image/jpeg',
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

              {!token && !bookingId && !currentUser && !checkingAuth ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 bg-accent-gold/10 border border-accent-gold/20 rounded-full flex items-center justify-center mx-auto text-accent-gold">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl text-white mb-2">Sign In Required</h2>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                      To securely link your 180-Day Vetted ID Pass and membership permissions to your profile, please sign in with Mobile OTP first.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      const returnPath = typeof window !== 'undefined' ? window.location.pathname : '/dashboard';
                      router.push(`/auth?redirect=${encodeURIComponent(returnPath)}`);
                    }}
                    className="w-full mt-4 bg-accent-gold hover:bg-white text-black py-4 rounded-xl text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Sign In with Mobile OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-accent-gold/10 text-accent-gold border border-accent-gold/20 text-[10px] uppercase font-mono tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Digital Security Scan
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] uppercase font-mono tracking-wider">
                      Police Compliant
                    </span>
                  </div>

                  <h2 className="font-serif text-xl sm:text-2xl mb-1.5 text-white">Digital Guest ID Verification</h2>
                  <p className="text-xs sm:text-sm text-zinc-400 mb-4 leading-relaxed">
                    Upload your <span className="text-white font-medium">Aadhaar Card</span> or{' '}
                    <span className="text-white font-medium">Passport</span>. You can upload front &amp; back together in 1 photo or add both sides separately.
                    <br />
                    <span className="text-[10px] sm:text-[11px] text-amber-400/90 mt-1 inline-block font-mono">
                      ⚠️ Driving License &amp; Voter ID are not accepted per hospitality regulations.
                    </span>
                  </p>

                  {/* Hidden file inputs for direct camera and gallery */}
                  <input
                    type="file"
                    ref={primaryCameraRef}
                    onChange={(e) => handleAddFiles(e.target.files)}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={primaryGalleryRef}
                    onChange={(e) => handleAddFiles(e.target.files)}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={addCameraRef}
                    onChange={(e) => handleAddFiles(e.target.files)}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={addGalleryRef}
                    onChange={(e) => handleAddFiles(e.target.files)}
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

                    {/* Step 1: No images uploaded yet -> Big 1-Click Dual Action Zone */}
                    {uploadedImages.length === 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[10px] sm:text-xs uppercase tracking-wider text-zinc-400 font-mono">
                            Capture or Upload ID Document
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => primaryCameraRef.current?.click()}
                            className="border border-dashed border-zinc-800 hover:border-accent-gold/50 rounded-2xl p-5 transition-all flex flex-col items-center justify-center gap-2 bg-white/[0.02] hover:bg-accent-gold/[0.03] group cursor-pointer"
                          >
                            <Camera className="w-6 h-6 text-accent-gold group-hover:scale-110 transition-transform" />
                            <span className="text-xs text-white/90 font-medium">Take Photo</span>
                            <span className="text-[9px] text-white/40 font-mono">Direct Camera</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => primaryGalleryRef.current?.click()}
                            className="border border-dashed border-zinc-800 hover:border-accent-gold/50 rounded-2xl p-5 transition-all flex flex-col items-center justify-center gap-2 bg-white/[0.02] hover:bg-accent-gold/[0.03] group cursor-pointer"
                          >
                            <ImageIcon className="w-6 h-6 text-white/60 group-hover:text-accent-gold group-hover:scale-110 transition-transform" />
                            <span className="text-xs text-white/90 font-medium">Upload File(s)</span>
                            <span className="text-[9px] text-white/40 font-mono">Select 1 or 2 Photos</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Uploaded Previews (1 or 2 images) */}
                    {uploadedImages.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] sm:text-xs uppercase tracking-wider text-zinc-400 font-mono">
                            Uploaded Document ({uploadedImages.length}/2)
                          </p>
                          <span className="text-[10px] text-green-400 font-mono font-bold">
                            ✓ {uploadedImages.length === 1 ? '1 Photo Ready' : 'Both Photos Ready'}
                          </span>
                        </div>

                        <div className={`grid ${uploadedImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                          {uploadedImages.map((img, idx) => (
                            <div key={img.id} className="relative group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                              <IDScanningAnimation imagePreview={img.preview} isScanning={loading} />
                              <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(idx)}
                                  disabled={loading}
                                  className="p-1.5 bg-black/80 hover:bg-red-500 hover:text-white border border-white/20 text-white rounded-lg text-[10px] transition-colors cursor-pointer"
                                  title="Remove Photo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/75 rounded text-[9px] text-zinc-300 font-mono">
                                {idx === 0 ? 'Document Photo 1' : 'Back / Photo 2'}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Optional 2nd image addition when 1 image is already added */}
                        {uploadedImages.length === 1 && (
                          <div className="border border-dashed border-zinc-800/80 rounded-xl p-3 bg-white/[0.01] flex items-center justify-between">
                            <div className="text-left">
                              <p className="text-[11px] text-zinc-300 font-medium">Add Back Side Photo?</p>
                              <p className="text-[9px] text-zinc-500 font-mono">Optional if your document is in 1 photo</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => addCameraRef.current?.click()}
                                className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white rounded-lg text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Camera className="w-3 h-3 text-accent-gold" />
                                <span>Camera</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => addGalleryRef.current?.click()}
                                className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white rounded-lg text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <ImageIcon className="w-3 h-3 text-accent-gold" />
                                <span>Gallery</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2 mt-4">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    onClick={submitVerification}
                    disabled={loading || uploadedImages.length === 0}
                    className="w-full mt-6 bg-accent-gold hover:bg-white text-black py-4 rounded-xl text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl cursor-pointer"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {loading
                      ? 'Authenticating Security Hologram...'
                      : uploadedImages.length > 1
                      ? 'Submit & Verify Both Photos'
                      : 'Submit & Verify ID'}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
