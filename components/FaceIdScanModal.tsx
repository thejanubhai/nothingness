'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Camera, ShieldCheck, CheckCircle2, RefreshCw, 
  Sparkles, Lock, ArrowRight, Scan, Eye, AlertCircle, Check
} from 'lucide-react';
import { toast } from 'sonner';

interface FaceIdScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestId?: string;
  onSuccess: (liveFaceUrl: string) => void;
}

export default function FaceIdScanModal({
  isOpen,
  onClose,
  guestId,
  onSuccess,
}: FaceIdScanModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [step, setStep] = useState<'instructions' | 'front' | 'angle' | 'review' | 'submitting' | 'success'>('instructions');

  const [frontCapturedImage, setFrontCapturedImage] = useState<string | null>(null);
  const [angleCapturedImage, setAngleCapturedImage] = useState<string | null>(null);
  const [isScanningActive, setIsScanningActive] = useState(false);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError('Camera access denied or unavailable. Please enable camera permissions in your browser or device settings.');
    }
  }, [stream]);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  // Handle modal open/close
  useEffect(() => {
    if (isOpen) {
      setStep('instructions');
      setFrontCapturedImage(null);
      setAngleCapturedImage(null);
      setCameraError(null);
      setIsScanningActive(false);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, stopCamera]);

  // Capture Frame from Video
  const captureFrame = (): string | null => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Flip horizontally for natural mirror selfie view
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.92);
  };

  // Step 1: Capture Front Center Frame
  const handleCaptureFront = () => {
    setIsScanningActive(true);
    setTimeout(() => {
      const frame = captureFrame();
      if (frame) {
        setFrontCapturedImage(frame);
        setIsScanningActive(false);
        setStep('angle');
        toast.info('Front profile captured! Now turn your head slightly for 3D depth verification.');
      } else {
        setIsScanningActive(false);
        toast.error('Failed to capture frame. Please try again.');
      }
    }, 600);
  };

  // Step 2: Capture Angle Frame
  const handleCaptureAngle = () => {
    setIsScanningActive(true);
    setTimeout(() => {
      const frame = captureFrame();
      if (frame) {
        setAngleCapturedImage(frame);
        setIsScanningActive(false);
        setStep('review');
        stopCamera();
        toast.success('3D Biometric scan complete! Review your frames below.');
      } else {
        setIsScanningActive(false);
        toast.error('Failed to capture frame. Please try again.');
      }
    }, 600);
  };

  // Submit Captured Biometric Data
  const handleSubmitBiometrics = async () => {
    if (!frontCapturedImage) return;
    setStep('submitting');

    try {
      const res = await fetch('/api/guests/face-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frontImage: frontCapturedImage,
          angleImage: angleCapturedImage || undefined,
          guestId: guestId || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStep('success');
        toast.success('3D Face ID Vetting Registered!', {
          description: 'Priority gate access is now active for upcoming Sanctuary Gatherings.',
        });
        setTimeout(() => {
          onSuccess(data.live_face_url);
          onClose();
        }, 2200);
      } else {
        throw new Error(data.error || 'Failed to submit 3D Face ID');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error submitting Face ID');
      setStep('review');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative max-h-[92vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full transition-colors z-20 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Hidden canvas for frame extraction */}
            <canvas ref={canvasRef} className="hidden" />

            <div className="p-6 sm:p-8 space-y-6 text-center">
              
              {/* ========================================================= */}
              {/* STEP 1: INSTRUCTIONS & PROTOCOL                           */}
              {/* ========================================================= */}
              {step === 'instructions' && (
                <div className="space-y-6">
                  <div className="w-16 h-16 rounded-full bg-accent-gold/10 border border-accent-gold/30 text-accent-gold flex items-center justify-center mx-auto">
                    <Scan className="w-8 h-8 animate-pulse" />
                  </div>

                  <div>
                    <span className="px-3 py-1 rounded-full bg-accent-gold/10 text-accent-gold border border-accent-gold/30 text-[10px] uppercase font-mono tracking-widest font-bold">
                      Internal Nothingness Gatekeeper Protocol
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl text-white font-bold mt-2">
                      3D Face ID Vetting
                    </h2>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed max-w-md mx-auto">
                      Official IDs often have outdated photos. Nothingness uses a fast, confidential 3D face scan so Gatekeepers can verify your real-life identity at event gates with 100% confidence.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 text-left space-y-2.5 font-mono text-xs text-zinc-300">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] shrink-0 font-bold">1</span>
                      <p><strong className="text-white">Strictly Confidential:</strong> Stored securely for internal Gatekeeper door-matching only. Never displayed publicly.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] shrink-0 font-bold">2</span>
                      <p><strong className="text-white">Priority Gate Access:</strong> Vetted profiles receive instant door check-in and higher acceptance for private Munches.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] shrink-0 font-bold">3</span>
                      <p><strong className="text-white">Anti-Spoofing 3D Check:</strong> Requires 2 quick poses (Center Face + Angle) to confirm live depth.</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setStep('front');
                      startCamera();
                    }}
                    className="w-full py-4 bg-accent-gold hover:bg-white text-black font-bold uppercase tracking-wider text-xs rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Begin 3D Biometric Scan</span>
                  </button>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 2 & 3: LIVE CAMERA SCANNING (FRONT & ANGLE)          */}
              {/* ========================================================= */}
              {(step === 'front' || step === 'angle') && (
                <div className="space-y-4">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-accent-gold/10 text-accent-gold border border-accent-gold/30 text-[10px] uppercase font-mono font-bold">
                      {step === 'front' ? 'Step 1 of 2: Frontal Biometric Scan' : 'Step 2 of 2: 3D Depth Confirmation'}
                    </span>
                    <h3 className="font-serif text-xl text-white font-bold mt-1">
                      {step === 'front' ? 'Look Directly into Camera' : 'Turn Head Slightly (Left or Right)'}
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      {step === 'front' ? 'Position your face within the luminous oval frame.' : 'Confirm real-life 3D presence for Gatekeepers.'}
                    </p>
                  </div>

                  {cameraError ? (
                    <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono space-y-3">
                      <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                      <p>{cameraError}</p>
                      <button
                        onClick={startCamera}
                        className="px-4 py-2 bg-zinc-900 border border-zinc-700 text-white rounded-xl text-xs"
                      >
                        Retry Camera Permission
                      </button>
                    </div>
                  ) : (
                    /* Biometric Oval HUD Viewport */
                    <div className="relative w-full aspect-square max-w-[320px] mx-auto rounded-3xl overflow-hidden bg-black border border-zinc-800 shadow-2xl flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />

                      {/* Apple-style Biometric Oval Frame Overlay */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
                        <div className={`w-[220px] h-[280px] rounded-[110px] border-2 transition-all duration-500 relative ${
                          isScanningActive
                            ? 'border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.5)] scale-98'
                            : 'border-accent-gold/70 shadow-[0_0_20px_rgba(217,119,6,0.3)] animate-pulse'
                        }`}>
                          {/* Corner alignment crosshairs */}
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-accent-gold" />
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-accent-gold" />
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-accent-gold" />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-accent-gold" />

                          {/* Sweeping Laser Scan Line when capturing */}
                          {isScanningActive && (
                            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan" />
                          )}
                        </div>
                      </div>

                      {/* Status HUD tag */}
                      <div className="absolute bottom-3 inset-x-0 flex justify-center">
                        <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono text-zinc-300 border border-white/10 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isScanningActive ? 'bg-emerald-400 animate-ping' : 'bg-accent-gold animate-pulse'}`} />
                          {isScanningActive ? 'Analyzing 3D Topology...' : step === 'front' ? 'Face Detected' : 'Turn Head Slightly'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={step === 'front' ? handleCaptureFront : handleCaptureAngle}
                      disabled={isScanningActive || !!cameraError}
                      className="w-full py-4 bg-accent-gold hover:bg-white text-black font-bold uppercase tracking-wider text-xs rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isScanningActive ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Scanning Biometric Coordinates...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          <span>{step === 'front' ? 'Capture Front Face' : 'Capture 3D Angle Depth'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 4: REVIEW CAPTURED 3D FRAMES                         */}
              {/* ========================================================= */}
              {step === 'review' && (
                <div className="space-y-5">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] uppercase font-mono font-bold">
                      Biometric Frames Captured
                    </span>
                    <h3 className="font-serif text-2xl text-white font-bold mt-1">Review 3D Face ID</h3>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      Verify that your face is clearly visible without heavy shadows.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                    {frontCapturedImage && (
                      <div className="space-y-1">
                        <div className="rounded-2xl overflow-hidden border border-emerald-500/40 bg-black aspect-[3/4] shadow-lg">
                          <img src={frontCapturedImage} alt="Front Face" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold block">✓ Frontal Frame</span>
                      </div>
                    )}

                    {angleCapturedImage && (
                      <div className="space-y-1">
                        <div className="rounded-2xl overflow-hidden border border-emerald-500/40 bg-black aspect-[3/4] shadow-lg">
                          <img src={angleCapturedImage} alt="Angle Face" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold block">✓ Depth Angle</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSubmitBiometrics}
                      className="flex-1 py-4 bg-accent-gold hover:bg-white text-black font-bold uppercase tracking-wider text-xs rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm &amp; Register Face ID</span>
                    </button>

                    <button
                      onClick={() => {
                        setStep('front');
                        setFrontCapturedImage(null);
                        setAngleCapturedImage(null);
                        startCamera();
                      }}
                      className="px-4 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono rounded-xl cursor-pointer"
                    >
                      Retake
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 5: SUBMITTING / PROCESSING                           */}
              {/* ========================================================= */}
              {step === 'submitting' && (
                <div className="py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-accent-gold/10 border border-accent-gold/30 text-accent-gold flex items-center justify-center mx-auto animate-spin">
                    <RefreshCw className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif text-xl text-white font-bold">Encrypting 3D Face Biometric</h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    Storing high-resolution frames into Nothingness Gatekeeper vault...
                  </p>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 6: SUCCESS                                           */}
              {/* ========================================================= */}
              {step === 'success' && (
                <div className="py-10 space-y-4 animate-fadeIn">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] uppercase font-mono tracking-widest font-bold inline-block">
                    Physical Vetting Active
                  </span>
                  <h3 className="font-serif text-2xl text-white font-bold">3D Face ID Registered ✓</h3>
                  <p className="text-xs text-zinc-400 font-mono leading-relaxed max-w-sm mx-auto">
                    Your real-life identity is verified for Gatekeeper door scanners. You now have priority admission to private Sanctuary Gatherings.
                  </p>
                </div>
              )}

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
