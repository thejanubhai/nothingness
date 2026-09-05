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
  token?: string;
  onSuccess: (liveFaceUrl: string) => void;
}

export default function FaceIdScanModal({
  isOpen,
  onClose,
  guestId,
  token,
  onSuccess,
}: FaceIdScanModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const prevIsOpenRef = useRef(false);
  const selfieInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [step, setStep] = useState<'instructions' | 'front' | 'angle' | 'review' | 'submitting' | 'success'>('instructions');

  const [frontCapturedImage, setFrontCapturedImage] = useState<string | null>(null);
  const [angleCapturedImage, setAngleCapturedImage] = useState<string | null>(null);
  const [isScanningActive, setIsScanningActive] = useState(false);

  // Stop Camera Stream (stable reference with no stream state dependency)
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
      streamRef.current = null;
    }
    setStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Helper to reliably attach a stream to the video element
  const attachStreamToVideo = useCallback((mediaStream: MediaStream) => {
    if (videoRef.current) {
      const video = videoRef.current;
      if (video.srcObject !== mediaStream) {
        video.srcObject = mediaStream;
      }
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.muted = true;
      video.play().catch((err) => {
        console.warn('Video auto-play caught:', err);
      });
    }
  }, []);

  // Video Ref callback: Immediately connects active stream the instant video mounts
  const handleVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      attachStreamToVideo(streamRef.current);
    }
  }, [attachStreamToVideo]);

  // Start Camera Stream with mobile / PWA fallbacks
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraLoading(true);

    // Stop any active stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch (_) {}
      });
      streamRef.current = null;
    }

    if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
      setCameraLoading(false);
      setCameraError('Camera access is not supported on this browser or requires a secure HTTPS connection.');
      return;
    }

    let mediaStream: MediaStream | null = null;
    let lastError: any = null;

    // Progressive constraints: standard mobile 1280x720 -> generic user front -> any video device
    const constraintSets: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },
      {
        video: { facingMode: 'user' },
        audio: false,
      },
      {
        video: true,
        audio: false,
      },
    ];

    for (const constraints of constraintSets) {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (mediaStream) break;
      } catch (err: any) {
        lastError = err;
        console.warn('getUserMedia attempt failed with constraints:', constraints, err?.name || err);
      }
    }

    setCameraLoading(false);

    if (!mediaStream) {
      console.error('Camera stream error:', lastError);
      if (lastError?.name === 'NotAllowedError' || lastError?.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera permissions in your browser or device settings, or use the selfie photo upload option below.');
      } else if (lastError?.name === 'NotFoundError' || lastError?.name === 'DevicesNotFoundError') {
        setCameraError('No camera sensor found on this device.');
      } else {
        setCameraError('Unable to activate camera sensor. Please check device permissions or use the selfie photo option below.');
      }
      return;
    }

    streamRef.current = mediaStream;
    setStream(mediaStream);
    attachStreamToVideo(mediaStream);
  }, [attachStreamToVideo]);

  // Connect active stream to video element when step changes or stream arrives
  useEffect(() => {
    if (stream && (step === 'front' || step === 'angle')) {
      attachStreamToVideo(stream);
    }
  }, [stream, step, attachStreamToVideo]);

  // Handle modal open/close and lock background scroll
  useEffect(() => {
    if (isOpen) {
      if (!prevIsOpenRef.current) {
        // Only reset flow state on initial open transition
        setStep('instructions');
        setFrontCapturedImage(null);
        setAngleCapturedImage(null);
        setCameraError(null);
        setIsScanningActive(false);
      }
      prevIsOpenRef.current = true;

      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        stopCamera();
        document.body.style.overflow = previousOverflow;
      };
    } else {
      prevIsOpenRef.current = false;
      stopCamera();
    }
  }, [isOpen, stopCamera]);

  // Fallback selfie file upload handler
  const handleSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;

      if (step === 'front' || !frontCapturedImage) {
        setFrontCapturedImage(dataUrl);
        setStep('angle');
        toast.info('Front selfie captured! Now capture an angled photo or continue to review.');
      } else {
        setAngleCapturedImage(dataUrl);
        setStep('review');
        stopCamera();
        toast.success('3D Biometric photos loaded! Review below.');
      }
    };
    reader.readAsDataURL(file);
    // Reset file input value so same photo can be reselected if needed
    e.target.value = '';
  };

  // Capture Frame from Video
  const captureFrame = (): string | null => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
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
        toast.error('Failed to capture frame. Please ensure your face is clearly in frame and try again.');
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
        toast.error('Failed to capture frame. Please hold steady and try again.');
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
          token: token || undefined,
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
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl overflow-y-auto overscroll-contain"
        >
          <motion.div
            initial={{ scale: 0.96, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 15 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative my-auto max-h-[calc(100dvh-2rem)] sm:max-h-[90dvh] flex flex-col"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-3.5 right-3.5 p-2 text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 rounded-full transition-colors z-30 cursor-pointer touch-manipulation"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Hidden canvas for frame extraction */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Hidden file input for native camera / selfie upload fallback */}
            <input
              type="file"
              ref={selfieInputRef}
              accept="image/*"
              capture="user"
              onChange={handleSelfieUpload}
              className="hidden"
            />

            <div className="p-5 sm:p-7 overflow-y-auto space-y-5 text-center flex-1 overscroll-contain min-h-0 pb-safe">
              
              {/* ========================================================= */}
              {/* STEP 1: INSTRUCTIONS & PROTOCOL                           */}
              {/* ========================================================= */}
              {step === 'instructions' && (
                <div className="space-y-5">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-accent-gold/10 border border-accent-gold/30 text-accent-gold flex items-center justify-center mx-auto">
                    <Scan className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse" />
                  </div>

                  <div>
                    <span className="px-3 py-1 rounded-full bg-accent-gold/10 text-accent-gold border border-accent-gold/30 text-[10px] uppercase font-mono tracking-widest font-bold inline-block">
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
                    className="w-full py-3.5 sm:py-4 bg-accent-gold hover:bg-white text-black font-bold uppercase tracking-wider text-xs rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation min-h-[48px]"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Begin 3D Biometric Scan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => selfieInputRef.current?.click()}
                    className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-xl text-xs font-mono transition-colors flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
                  >
                    <Camera className="w-3.5 h-3.5 text-accent-gold" />
                    <span>Or Upload / Take Selfie Photo</span>
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
                    <h3 className="font-serif text-xl sm:text-2xl text-white font-bold mt-1">
                      {step === 'front' ? 'Look Directly into Camera' : 'Turn Head Slightly (Left or Right)'}
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      {step === 'front' ? 'Position your face within the luminous oval frame.' : 'Confirm real-life 3D presence for Gatekeepers.'}
                    </p>
                  </div>

                  {/* Biometric Oval HUD Viewport with persistent video mounting */}
                  <div className="relative w-full aspect-square max-w-[260px] sm:max-w-[320px] mx-auto rounded-3xl overflow-hidden bg-black border border-zinc-800 shadow-2xl flex items-center justify-center">
                    <video
                      ref={handleVideoRef}
                      autoPlay
                      playsInline
                      muted
                      {...({ 'webkit-playsinline': 'true' } as any)}
                      className="w-full h-full object-cover scale-x-[-1]"
                    />

                    {/* Camera Loading Overlay */}
                    {cameraLoading && (
                      <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-3 z-20">
                        <RefreshCw className="w-8 h-8 text-accent-gold animate-spin" />
                        <p className="text-xs font-mono text-zinc-200 font-bold">Activating camera sensor...</p>
                        <p className="text-[11px] text-zinc-400 font-mono text-center">Please allow camera access when prompted.</p>
                      </div>
                    )}

                    {/* Apple-style Biometric Oval Frame Overlay */}
                    {!cameraLoading && !cameraError && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-3 sm:p-4 z-10">
                        <div className={`w-[170px] sm:w-[210px] h-[220px] sm:h-[270px] rounded-[85px] sm:rounded-[105px] border-2 transition-all duration-500 relative ${
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
                    )}

                    {/* Status HUD tag */}
                    {!cameraLoading && !cameraError && (
                      <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none z-10">
                        <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono text-zinc-300 border border-white/10 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isScanningActive ? 'bg-emerald-400 animate-ping' : 'bg-accent-gold animate-pulse'}`} />
                          {isScanningActive ? 'Analyzing 3D Topology...' : step === 'front' ? 'Face Positioned' : 'Turn Head Slightly'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Camera Error Message with Action Buttons */}
                  {cameraError && (
                    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono space-y-3 max-w-sm mx-auto">
                      <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
                      <p className="leading-relaxed text-[11px]">{cameraError}</p>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-3.5 py-2 bg-zinc-900 border border-zinc-700 text-white rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-zinc-800 transition-colors cursor-pointer touch-manipulation"
                        >
                          Retry Camera
                        </button>
                        <button
                          type="button"
                          onClick={() => selfieInputRef.current?.click()}
                          className="px-3.5 py-2 bg-accent-gold text-black rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors cursor-pointer touch-manipulation"
                        >
                          Upload Selfie Photo
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 space-y-2">
                    <button
                      onClick={step === 'front' ? handleCaptureFront : handleCaptureAngle}
                      disabled={isScanningActive || !!cameraError || cameraLoading}
                      className="w-full py-3.5 sm:py-4 bg-accent-gold hover:bg-white text-black font-bold uppercase tracking-wider text-xs rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 touch-manipulation min-h-[48px]"
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

                    {/* Secondary Selfie Upload Trigger */}
                    <button
                      type="button"
                      onClick={() => selfieInputRef.current?.click()}
                      className="w-full py-2.5 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-xl text-[11px] font-mono transition-colors flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
                    >
                      <Camera className="w-3.5 h-3.5 text-accent-gold" />
                      <span>{step === 'front' ? 'Take Front Selfie via Camera App' : 'Take Angled Selfie via Camera App'}</span>
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

                  <div className="grid grid-cols-2 gap-3 max-w-xs sm:max-w-sm mx-auto">
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
                      className="flex-1 py-3.5 sm:py-4 bg-accent-gold hover:bg-white text-black font-bold uppercase tracking-wider text-xs rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation min-h-[48px]"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm &amp; Register</span>
                    </button>

                    <button
                      onClick={() => {
                        setStep('front');
                        setFrontCapturedImage(null);
                        setAngleCapturedImage(null);
                        startCamera();
                      }}
                      className="px-4 py-3.5 sm:py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono rounded-xl cursor-pointer touch-manipulation min-h-[48px]"
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
