'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle2, ShieldAlert, X, Camera } from 'lucide-react';
import { toast } from 'sonner';

interface IDUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestId?: string;
  token?: string;
  bookingId?: string;
  onSuccess: (name: string) => void;
}

export default function IDUploadModal({ isOpen, onClose, guestId, token, bookingId, onSuccess }: IDUploadModalProps) {
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  
  const [backFile, setBackFile] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError("Both Front and Back photos of your ID are required.");
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
        mimeType: frontFile?.type || 'image/jpeg'
      };

      if (token) payload.token = token;
      else if (bookingId && guestId) {
        payload.bookingId = bookingId;
        payload.guestId = guestId;
      }

      const res = await fetch('/api/verify-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || data.reason || 'Verification failed');

      if (data.verified) {
        toast.success('Identity Verified', { description: `Welcome, ${data.name || 'Guest'}.` });
        onSuccess(data.name);
      } else {
        throw new Error(data.reason || 'ID verification failed.');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error('Verification Failed', { description: err.message });
      setFrontFile(null); setFrontPreview(null);
      setBackFile(null); setBackPreview(null);
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
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full transition-colors z-10">
              <X className="w-4 h-4" />
            </button>

            <div className="p-5 sm:p-8">
              <h2 className="font-serif text-xl sm:text-2xl mb-1.5 text-white">Digital Guest ID Verification</h2>
              <p className="text-xs sm:text-sm text-zinc-400 mb-4 leading-relaxed">
                Per Delhi Police compliance, upload clear front &amp; back photos of your <span className="text-white font-medium">Aadhaar Card</span> or <span className="text-white font-medium">Passport</span>.
                <br />
                <span className="text-[10px] sm:text-[11px] text-amber-400/90 mt-1 inline-block font-mono">⚠️ Driving License &amp; Voter ID are not accepted.</span>
              </p>

              <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] uppercase tracking-wider text-accent-gold bg-accent-gold/10 py-1.5 px-3 rounded-lg w-max mb-5 border border-accent-gold/20 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>180-Day Reusable Vetting Protocol</span>
              </div>

              <div className="space-y-4">
                {/* Front ID */}
                <div>
                  <p className="text-[10px] sm:text-xs uppercase tracking-wider text-zinc-400 mb-1.5 font-mono">Front of ID Document</p>
                  <input type="file" ref={frontInputRef} onChange={(e) => handleFileChange(e, 'front')} accept="image/*" className="hidden" />
                  {!frontPreview ? (
                    <div onClick={() => frontInputRef.current?.click()} className="border border-dashed border-zinc-800 hover:border-accent-gold/50 rounded-xl p-5 sm:p-6 cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 bg-white/[0.02]">
                      <Camera className="w-5 h-5 text-accent-gold/70" />
                      <p className="text-xs text-zinc-400 font-medium">Tap to Take Photo / Upload Front</p>
                    </div>
                  ) : (
                    <div className="relative w-full h-28 sm:h-32 rounded-xl overflow-hidden border border-zinc-700 group cursor-pointer" onClick={() => frontInputRef.current?.click()}>
                      <img src={frontPreview} alt="Front ID Preview" className="w-full h-full object-contain bg-black/60" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs uppercase tracking-widest text-white font-mono">Retake Photo</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Back ID */}
                <div>
                  <p className="text-[10px] sm:text-xs uppercase tracking-wider text-zinc-400 mb-1.5 font-mono">Back of ID Document</p>
                  <input type="file" ref={backInputRef} onChange={(e) => handleFileChange(e, 'back')} accept="image/*" className="hidden" />
                  {!backPreview ? (
                    <div onClick={() => backInputRef.current?.click()} className="border border-dashed border-zinc-800 hover:border-accent-gold/50 rounded-xl p-5 sm:p-6 cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 bg-white/[0.02]">
                      <Camera className="w-5 h-5 text-accent-gold/70" />
                      <p className="text-xs text-zinc-400 font-medium">Tap to Take Photo / Upload Back</p>
                    </div>
                  ) : (
                    <div className="relative w-full h-28 sm:h-32 rounded-xl overflow-hidden border border-zinc-700 group cursor-pointer" onClick={() => backInputRef.current?.click()}>
                      <img src={backPreview} alt="Back ID Preview" className="w-full h-full object-contain bg-black/60" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs uppercase tracking-widest text-white font-mono">Retake Photo</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {error && <p className="text-red-400 text-xs mt-3 text-center">{error}</p>}

              <button 
                onClick={submitVerification}
                disabled={loading || !frontPreview || !backPreview}
                className="w-full mt-6 bg-accent-gold hover:bg-white text-black py-3.5 sm:py-4 rounded-xl text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl"
              >
                {loading ? 'Validating via AI...' : <><CheckCircle2 className="w-4 h-4" /> Verify Document</>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
