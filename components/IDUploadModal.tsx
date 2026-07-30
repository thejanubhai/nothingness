'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle2, ShieldAlert, X } from 'lucide-react';
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
      setError("Both Front and Back photos are required.");
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
        throw new Error(data.reason || 'ID is invalid.');
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors z-10">
              <X className="w-5 h-5" />
            </button>

            <div className="p-8">
              <h2 className="font-serif text-2xl mb-2 text-white">Digital Guest ID Verification</h2>
              <p className="text-sm text-white/50 mb-6">
                Per Delhi Police regulations, please upload clear front &amp; back photos of your <span className="text-white font-medium">Aadhaar Card</span> or <span className="text-white font-medium">Passport</span>.
                <br />
                <span className="text-[11px] text-red-400/90 mt-1 inline-block">⚠️ Driving License (DL) &amp; Voter ID are not accepted for security compliance.</span>
              </p>

              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-accent-gold/80 bg-accent-gold/10 py-2 px-4 rounded-lg w-max mb-6 border border-accent-gold/20 font-mono">
                <ShieldAlert className="w-3.5 h-3.5 text-accent-gold" />
                <span>Verified once — Valid for 180 Days across all bookings</span>
              </div>

              <div className="space-y-6">
                {/* Front ID */}
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Front of ID</p>
                  <input type="file" ref={frontInputRef} onChange={(e) => handleFileChange(e, 'front')} accept="image/*" className="hidden" />
                  {!frontPreview ? (
                    <div onClick={() => frontInputRef.current?.click()} className="border border-dashed border-white/20 hover:border-accent-gold/40 rounded-xl p-8 cursor-pointer transition-colors flex flex-col items-center justify-center gap-3 bg-white/[0.02]">
                      <UploadCloud className="w-6 h-6 text-white/30" />
                      <p className="text-xs text-white/50">Upload Front</p>
                    </div>
                  ) : (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/20 group cursor-pointer" onClick={() => frontInputRef.current?.click()}>
                      <img src={frontPreview} alt="Front ID Preview" className="w-full h-full object-contain bg-black/50" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs uppercase tracking-widest text-white">Retake</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Back ID */}
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Back of ID</p>
                  <input type="file" ref={backInputRef} onChange={(e) => handleFileChange(e, 'back')} accept="image/*" className="hidden" />
                  {!backPreview ? (
                    <div onClick={() => backInputRef.current?.click()} className="border border-dashed border-white/20 hover:border-accent-gold/40 rounded-xl p-8 cursor-pointer transition-colors flex flex-col items-center justify-center gap-3 bg-white/[0.02]">
                      <UploadCloud className="w-6 h-6 text-white/30" />
                      <p className="text-xs text-white/50">Upload Back</p>
                    </div>
                  ) : (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/20 group cursor-pointer" onClick={() => backInputRef.current?.click()}>
                      <img src={backPreview} alt="Back ID Preview" className="w-full h-full object-contain bg-black/50" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs uppercase tracking-widest text-white">Retake</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}

              <button 
                onClick={submitVerification}
                disabled={loading || !frontPreview || !backPreview}
                className="w-full mt-8 bg-accent-gold text-black py-4 rounded-xl text-[12px] font-semibold tracking-[0.15em] uppercase hover:bg-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Processing...' : <><CheckCircle2 className="w-4 h-4" /> Verify Document</>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
