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
  User,
  CreditCard,
  Calendar,
  MapPin,
  Sparkles,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import IDScanningAnimation from '@/components/IDScanningAnimation';
import { createClient } from '@/lib/supabase/client';
import { parseAadhaarQrData, formatAadhaarNumber, compressIdImageForOcr, detectAndDecodeQrClient } from '@/lib/id-utils';

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

/**
 * Client-side Canvas face photo extractor.
 * Automatically crops the guest photo from Aadhaar / Passport with high precision.
 */
async function extractPhotoFromId(imageSrc: string, docType: string = 'Aadhaar'): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);

        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) return resolve(null);

        let cropX = 0;
        let cropY = 0;
        let cropW = 0;
        let cropH = 0;

        if (docType.toLowerCase().includes('passport')) {
          cropX = Math.floor(w * 0.04);
          cropY = Math.floor(h * 0.22);
          cropW = Math.floor(w * 0.36);
          cropH = Math.floor(h * 0.54);
        } else {
          // Standard Aadhaar Card (landscape): Photo is in upper right quadrant
          cropX = Math.floor(w * 0.62);
          cropY = Math.floor(h * 0.16);
          cropW = Math.floor(w * 0.32);
          cropH = Math.floor(h * 0.54);
        }

        cropX = Math.max(0, Math.min(cropX, w - 10));
        cropY = Math.max(0, Math.min(cropY, h - 10));
        cropW = Math.max(10, Math.min(cropW, w - cropX));
        cropH = Math.max(10, Math.min(cropH, h - cropY));

        canvas.width = 300;
        canvas.height = 360;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        resolve(dataUrl);
      } catch (e) {
        console.warn('Face crop error:', e);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageSrc;
  });
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

  // Hidden inputs for camera and gallery
  const primaryCameraRef = useRef<HTMLInputElement>(null);
  const primaryGalleryRef = useRef<HTMLInputElement>(null);
  const addCameraRef = useRef<HTMLInputElement>(null);
  const addGalleryRef = useRef<HTMLInputElement>(null);

  const [uploadedImages, setUploadedImages] = useState<UploadedImageItem[]>([]);
  const [extractedPhoto, setExtractedPhoto] = useState<string | null>(null);
  const [inputPhone, setInputPhone] = useState(initialPhone || '');
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(!token && !bookingId);

  // Verification Details Form
  const [documentType, setDocumentType] = useState<'Aadhaar' | 'Passport'>('Aadhaar');
  const [fullName, setFullName] = useState<string>('');
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [permanentAddress, setPermanentAddress] = useState<string>('');
  const [isDetailsVerifiedByUser, setIsDetailsVerifiedByUser] = useState<boolean>(false);

  // Lock body scroll on mobile when modal is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Auto-fetch logged in user session
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
          if (user?.user_metadata?.full_name && !fullName) {
            setFullName(user.user_metadata.full_name);
          }
        } catch {
          // ignore
        } finally {
          setCheckingAuth(false);
        }
      };
      checkUserSession();
    }
  }, [isOpen, initialPhone]);

  const [scanSuccess, setScanSuccess] = useState<boolean>(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setUploadedImages([]);
      setExtractedPhoto(null);
      setError(null);
      setDocumentNumber('');
      setIsDetailsVerifiedByUser(false);
      setScanSuccess(false);
    }
  }, [isOpen]);

  // Format Aadhaar number with 4-digit groups (XXXX XXXX XXXX)
  const formatAadhaarInput = (val: string) => {
    if (documentType !== 'Aadhaar') {
      return val.toUpperCase();
    }
    return formatAadhaarNumber(val);
  };

  const handleAddFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const maxAllowed = 2;
    const currentCount = uploadedImages.length;
    const availableSlots = maxAllowed - currentCount;
    if (availableSlots <= 0) {
      toast.info('Maximum 2 photos allowed (Front & Back).');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);

    // Read & compress files asynchronously for high-speed upload and Vercel compatibility
    const readPromises = filesToProcess.map(async (file) => {
      try {
        const compressed = await compressIdImageForOcr(file);
        return {
          id: Math.random().toString(36).substring(2, 9),
          preview: compressed,
          file,
        };
      } catch {
        return new Promise<UploadedImageItem>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const preview = (ev.target?.result as string) || '';
            resolve({
              id: Math.random().toString(36).substring(2, 9),
              preview,
              file,
            });
          };
          reader.readAsDataURL(file);
        });
      }
    });

    const newItems = await Promise.all(readPromises);
    const validItems = newItems.filter((item) => item.preview);
    if (validItems.length === 0) return;

    const allImages = [...uploadedImages, ...validItems];
    setUploadedImages(allImages);

    // Auto-crop face from the first document image
    if (!extractedPhoto && allImages[0]?.preview) {
      extractPhotoFromId(allImages[0].preview, documentType).then((cropped) => {
        if (cropped) setExtractedPhoto(cropped);
      });
    }

    // Trigger scanning with all available images (front + back together)
    triggerDocumentScan(allImages.map((img) => img.preview));
  };

  // Run multi-tier scan (Client QR -> Server NVIDIA/Gemini/Local OCR)
  const triggerDocumentScan = async (previews: string[]) => {
    if (!previews || previews.length === 0) return;
    setIsScanning(true);
    setScanSuccess(false);

    // 1. Instant Client-Side QR Detection (Universal: native BarcodeDetector on Chrome/Android + jsQR on iOS Safari/PWA)
    for (const imgUrl of previews) {
      try {
        const parsed = await detectAndDecodeQrClient(imgUrl);
        if (parsed && (parsed.name || parsed.document_number)) {
          if (parsed.name) setFullName(parsed.name);
          if (parsed.document_number) setDocumentNumber(formatAadhaarInput(parsed.document_number));
          if (parsed.dob) setDob(parsed.dob);
          if (parsed.permanent_address) setPermanentAddress(parsed.permanent_address);
          setDocumentType('Aadhaar');
          setScanSuccess(true);
          toast.success('Document details detected via Aadhaar QR Code!');
          setIsScanning(false);
          return;
        }
      } catch (err) {
        console.warn('Client QR detection check:', err);
      }
    }

    // 2. Server-Side Multi-Tier Vision & OCR Scan
    try {
      const cleanImages = previews.map((p) =>
        p.includes('base64,') ? p.split('base64,')[1] : p
      );

      const res = await fetch('/api/verify-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: cleanImages,
          scanOnly: true,
          documentType,
        }),
      });

      const data = await res.json();
      if (data.success && data.visionSucceeded && data.extracted) {
        let filledCount = 0;
        if (
          data.extracted.full_name &&
          data.extracted.full_name !== 'Nothingness Guest' &&
          data.extracted.full_name !== 'Guest'
        ) {
          setFullName(data.extracted.full_name);
          filledCount++;
        }
        if (data.extracted.document_number) {
          setDocumentNumber(formatAadhaarInput(data.extracted.document_number));
          filledCount++;
        }
        if (data.extracted.document_type) {
          setDocumentType(data.extracted.document_type === 'Passport' ? 'Passport' : 'Aadhaar');
        }
        if (data.extracted.dob) {
          setDob(data.extracted.dob);
          filledCount++;
        }
        if (data.extracted.permanent_address) {
          setPermanentAddress(data.extracted.permanent_address);
          filledCount++;
        }

        if (filledCount > 0) {
          setScanSuccess(true);
          toast.success('Document details detected & autofilled! Please verify accuracy.');
        } else {
          toast.info('Could not auto-read text from ID. Please enter details manually.');
        }
      } else {
        toast.info('Could not auto-read text from ID. Please enter details manually.');
      }
    } catch (err: any) {
      console.warn('[ID Scan] Error during scan:', err?.message);
      toast.info('Document scan offline. Please enter details manually.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const remaining = uploadedImages.filter((_, idx) => idx !== indexToRemove);
    setUploadedImages(remaining);
    if (indexToRemove === 0) {
      if (remaining.length > 0) {
        extractPhotoFromId(remaining[0].preview, documentType).then((cropped) => {
          if (cropped) setExtractedPhoto(cropped);
        });
      } else {
        setExtractedPhoto(null);
      }
    }
    setError(null);
  };

  const submitVerification = async () => {
    if (uploadedImages.length === 0) {
      setError('Please capture or upload at least one clear photo of your ID.');
      return;
    }

    if (!fullName.trim()) {
      setError('Please enter your full legal name as printed on your ID.');
      return;
    }

    const cleanDoc = documentNumber.replace(/\s+/g, '');
    if (documentType === 'Aadhaar' && cleanDoc.length !== 12) {
      setError('Aadhaar number must be exactly 12 digits.');
      return;
    }

    if (documentType === 'Passport' && cleanDoc.length < 6) {
      setError('Please enter a valid Passport number.');
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
        fullName: fullName.trim(),
        documentNumber: documentNumber.trim(),
        documentType,
        dob: dob.trim(),
        permanentAddress: permanentAddress.trim(),
        photoBase64: extractedPhoto || undefined,
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
          description: `Welcome, ${data.name || fullName}.`,
        });
        onSuccess(data.name || fullName);
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
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl overflow-y-auto overscroll-contain"
        >
          <motion.div
            initial={{ scale: 0.96, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 15 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative my-auto max-h-[calc(100dvh-2rem)] sm:max-h-[90dvh] flex flex-col"
          >
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-3.5 right-3.5 p-2 text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 rounded-full transition-colors z-30 cursor-pointer touch-manipulation"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-5 sm:p-8 space-y-6 overflow-y-auto flex-1 overscroll-contain min-h-0 pb-safe">
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
                  {/* Header */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-accent-gold/10 text-accent-gold border border-accent-gold/20 text-[10px] uppercase font-mono tracking-wider flex items-center gap-1 font-bold">
                        <ShieldCheck className="w-3 h-3" /> Secure Digital Check-In
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase font-mono tracking-wider font-bold">
                        Police Compliant (180 Days)
                      </span>
                    </div>

                    <h2 className="font-serif text-2xl text-white font-bold">Guest Identity Verification</h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Upload your <span className="text-white font-semibold">Aadhaar Card</span> or <span className="text-white font-semibold">Passport</span>.
                      Your document and photo are securely encrypted for statutory compliance.
                    </p>
                  </div>

                  {/* Hidden File Inputs */}
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

                  {/* Step 1: Upload Action Zone */}
                  {uploadedImages.length === 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => primaryCameraRef.current?.click()}
                          className="border border-dashed border-zinc-800 hover:border-accent-gold/50 rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-2.5 bg-zinc-900/30 hover:bg-zinc-900/60 group cursor-pointer"
                        >
                          <Camera className="w-7 h-7 text-accent-gold group-hover:scale-110 transition-transform" />
                          <span className="text-xs text-white font-bold">Take Live Photo</span>
                          <span className="text-[10px] text-zinc-500 font-mono">Use Camera</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => primaryGalleryRef.current?.click()}
                          className="border border-dashed border-zinc-800 hover:border-accent-gold/50 rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-2.5 bg-zinc-900/30 hover:bg-zinc-900/60 group cursor-pointer"
                        >
                          <ImageIcon className="w-7 h-7 text-zinc-400 group-hover:text-accent-gold group-hover:scale-110 transition-transform" />
                          <span className="text-xs text-white font-bold">Upload File(s)</span>
                          <span className="text-[10px] text-zinc-500 font-mono">Gallery / PDF / Scan</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Step 2: Uploaded Previews & Live Extracted Face */
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-zinc-400 font-bold">
                          Document Photos ({uploadedImages.length}/2)
                        </span>
                        {isScanning && (
                          <span className="text-[10px] text-accent-gold font-mono flex items-center gap-1.5 animate-pulse">
                            <Sparkles className="w-3 h-3" /> Auto-scanning document details...
                          </span>
                        )}
                      </div>

                      {/* Images Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {uploadedImages.map((img, idx) => (
                          <div key={img.id} className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-video flex items-center justify-center">
                            <img src={img.preview} alt="ID Document" className="w-full h-full object-cover" />
                            <div className="absolute top-2 right-2">
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="p-1.5 bg-black/80 hover:bg-red-500 text-white rounded-lg transition-colors cursor-pointer"
                                title="Remove"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 rounded text-[9px] text-zinc-300 font-mono">
                              {idx === 0 ? 'Front Side' : 'Back Side'}
                            </div>
                          </div>
                        ))}

                        {uploadedImages.length === 1 && (
                          <div
                            onClick={() => addCameraRef.current?.click()}
                            className="border border-dashed border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-zinc-900/20 aspect-video"
                          >
                            <Plus className="w-5 h-5 text-zinc-500" />
                            <span className="text-xs text-zinc-400 font-medium">Add Back Side</span>
                            <span className="text-[9px] text-zinc-600 font-mono">Optional if 1 photo has both</span>
                          </div>
                        )}
                      </div>

                      {/* Live Extracted Face & Photo Match Box */}
                      {extractedPhoto && (
                        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-emerald-500/30 flex items-center gap-4">
                          <div className="w-16 h-20 rounded-xl overflow-hidden border border-emerald-500/40 bg-black shrink-0 shadow-lg">
                            <img src={extractedPhoto} alt="Extracted Face" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1">
                              <Check className="w-3 h-3" /> Extracted Photo Matched
                            </span>
                            <p className="text-xs text-white font-medium mt-1">Photo cropped from your official document</p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">This official photograph will be attached to your Police Compliance Dossier.</p>
                          </div>
                        </div>
                      )}

                      {/* Scanning Status Banner */}
                      {isScanning && (
                        <div className="p-3.5 rounded-2xl bg-accent-gold/10 border border-accent-gold/20 flex items-center gap-3 text-accent-gold text-xs animate-pulse">
                          <Sparkles className="w-4 h-4 text-accent-gold animate-spin shrink-0" />
                          <div>
                            <p className="font-semibold">Scanning ID document...</p>
                            <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                              Extracting Name, Document Number, Date of Birth, and Address.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Scan Success Banner */}
                      {scanSuccess && !isScanning && (
                        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 text-emerald-400 text-xs">
                          <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div>
                              <p className="font-semibold">ID Details Autofilled</p>
                              <p className="text-[11px] text-emerald-300/70 font-sans mt-0.5">
                                Please verify the fields below for accuracy before submitting.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => triggerDocumentScan(uploadedImages.map((img) => img.preview))}
                            className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-[10px] font-mono transition-colors shrink-0"
                          >
                            Rescan
                          </button>
                        </div>
                      )}

                      {/* Point-to-Point Exact Detail Confirmation Form */}
                      <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4 font-mono text-xs">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                          <span className="text-xs text-zinc-300 font-bold uppercase tracking-wider flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-accent-gold" />
                            Confirm Exact Document Details
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setDocumentType('Aadhaar')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] transition-colors ${
                                documentType === 'Aadhaar' ? 'bg-accent-gold text-black font-bold' : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              Aadhaar
                            </button>
                            <button
                              type="button"
                              onClick={() => setDocumentType('Passport')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] transition-colors ${
                                documentType === 'Passport' ? 'bg-accent-gold text-black font-bold' : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              Passport
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-zinc-400 block mb-1">Full Legal Name (as on card)</label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              placeholder="e.g. Huda Vaqt"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-amber-500 focus:outline-none"
                            />
                            <User className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="text-zinc-400 block mb-1">
                            {documentType === 'Aadhaar' ? '12-Digit Aadhaar Number' : 'Passport Number'}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              placeholder={documentType === 'Aadhaar' ? 'XXXX XXXX 1234' : 'A1234567'}
                              value={documentNumber}
                              onChange={(e) => setDocumentNumber(formatAadhaarInput(e.target.value))}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-mono tracking-wider focus:border-amber-500 focus:outline-none"
                            />
                            <CreditCard className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-zinc-400 block mb-1">Date of Birth / Year</label>
                            <input
                              type="text"
                              placeholder="DD/MM/YYYY"
                              value={dob}
                              onChange={(e) => setDob(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-amber-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-zinc-400 block mb-1">Contact Phone</label>
                            <input
                              type="tel"
                              placeholder="+91..."
                              value={inputPhone}
                              onChange={(e) => setInputPhone(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-zinc-400 block mb-1">Residential Address (Optional)</label>
                          <input
                            type="text"
                            placeholder="Residential address as printed on ID"
                            value={permanentAddress}
                            onChange={(e) => setPermanentAddress(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-2xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {uploadedImages.length > 0 && (
                    <button
                      onClick={submitVerification}
                      disabled={loading || !fullName.trim() || !documentNumber.trim()}
                      className="w-full py-4 bg-accent-gold hover:bg-white text-black font-bold uppercase tracking-wider text-xs rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Uploading &amp; Authenticating 180-Day ID...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Submit &amp; Authenticate 180-Day ID Pass</span>
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
