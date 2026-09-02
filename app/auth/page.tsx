'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { loginWithFirebasePhone, onPasskeyLoginSuccess } from '@/app/actions/auth';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { auth } from '@/lib/firebase/client';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { normalizeIdentifier } from '@/lib/auth-utils';
import { KeyRound, Smartphone, ShieldCheck, Sparkles, Building2, Flame, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier | null;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [step, setStep] = useState<'identifier' | 'verify-phone'>('identifier');
  const [otpToken, setOtpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    return () => {
      // Clean up recaptcha verifier on unmount
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const getRecaptchaVerifier = () => {
    if (typeof window === 'undefined') return null;
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
      });
    }
    return window.recaptchaVerifier;
  };

  const handleSendOtp = async () => {
    if (!identifier) return;
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    const formattedPhone = normalizeIdentifier(identifier);

    try {
      const appVerifier = getRecaptchaVerifier();
      if (!appVerifier) {
        throw new Error('reCAPTCHA security verification could not be initialized.');
      }

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setStep('verify-phone');
      toast.success(`SMS verification code sent to ${formattedPhone}`);
    } catch (err: any) {
      console.error('[Auth] Firebase Phone Auth client error:', err);
      // Clean up recaptcha verifier on error so it can be re-attempted
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch {
          // ignore
        }
      }

      const fbCode = err?.code || '';
      let userFriendlyError = err?.message || 'Failed to send SMS OTP. Please check your phone number and try again.';
      if (fbCode === 'auth/invalid-phone-number') {
        userFriendlyError = 'Please enter a valid 10-digit mobile number with country code (e.g. +91 98765 43210).';
      } else if (fbCode === 'auth/too-many-requests') {
        userFriendlyError = 'Too many attempts. Please wait a few minutes before requesting another code.';
      } else if (fbCode === 'auth/quota-exceeded') {
        userFriendlyError = 'Daily SMS limit reached on Firebase. Please try again later or contact support.';
      } else if (fbCode === 'auth/unauthorized-domain') {
        userFriendlyError = 'Domain unauthorized for Firebase Phone Auth. Please ensure this domain is added in Firebase Console.';
      } else if (fbCode === 'auth/invalid-app-credential' || fbCode === 'auth/api-key-not-valid') {
        userFriendlyError = 'Firebase project configuration error. Please verify NEXT_PUBLIC_FIREBASE_API_KEY.';
      }

      setErrorMsg(userFriendlyError);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpToken || otpToken.length < 6 || !confirmationResult) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const userCredential = await confirmationResult.confirm(otpToken);
      const idToken = await userCredential.user.getIdToken();
      const result = await loginWithFirebasePhone(idToken);

      if (result.success) {
        toast.success('Successfully authenticated!');
        router.push(result.redirectUrl || '/dashboard');
        router.refresh();
      } else {
        setErrorMsg(result.error || 'Authentication session failed. Please try again.');
        setLoading(false);
      }
    } catch (firebaseVerifyErr: any) {
      console.error('[Auth] Firebase verification error:', firebaseVerifyErr);
      const fbCode = firebaseVerifyErr?.code || '';
      let userFriendlyError = 'Invalid verification code. Please check the SMS and try again.';
      if (fbCode === 'auth/invalid-verification-code') {
        userFriendlyError = 'The 6-digit verification code is incorrect. Please re-check the SMS.';
      } else if (fbCode === 'auth/code-expired' || fbCode === 'auth/session-expired') {
        userFriendlyError = 'The verification code has expired. Please click "Resend OTP Code".';
      } else if (firebaseVerifyErr?.message) {
        userFriendlyError = firebaseVerifyErr.message;
      }
      setErrorMsg(userFriendlyError);
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      if (
        typeof window === 'undefined' ||
        !window.PublicKeyCredential ||
        !navigator.credentials
      ) {
        setErrorMsg('Biometric Passkeys are not supported on this browser. Please sign in with Mobile OTP.');
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPasskey();

      if (error) {
        const msg = error.message || '';
        if (
          msg.includes('not allowed') ||
          msg.includes('denied permission') ||
          msg.includes('NotAllowedError') ||
          msg.includes('no credentials')
        ) {
          setErrorMsg(
            'No Passkey found on this device. Please sign in with Mobile OTP first, then set up your FaceID / Passkey in Account Settings.'
          );
        } else if (msg.includes('AbortError') || msg.includes('cancel')) {
          setInfoMsg('Biometric prompt was dismissed.');
        } else {
          setErrorMsg(msg || 'Passkey authentication was not completed. Please sign in with Mobile OTP.');
        }
        setLoading(false);
        return;
      }

      if (data?.user) {
        toast.success('Successfully authenticated with Passkey!');
        await onPasskeyLoginSuccess();
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      console.error('[Auth] Passkey error:', err);
      const msg = err.message || '';
      if (
        msg.includes('not allowed') ||
        msg.includes('denied permission') ||
        msg.includes('NotAllowedError')
      ) {
        setErrorMsg(
          'No Passkey found on this device. Please sign in with Mobile OTP first, then set up your FaceID / Passkey in Account Settings.'
        );
      } else {
        setErrorMsg('Passkey authentication could not be completed. Please use Mobile OTP.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-32 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 flex items-center justify-center relative overflow-hidden bg-black selection:bg-rose-500/30">
      {/* Subtle atmospheric ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Invisible reCAPTCHA container for Firebase */}
      <div id="recaptcha-container" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-950/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 md:p-10 text-center shadow-2xl backdrop-blur-2xl relative z-10"
      >
        {/* Universal Portal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-zinc-400 mb-4 uppercase tracking-widest">
            <Sparkles className="w-3 h-3 text-accent-gold" />
            Universal Single Sign-On
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl text-white mb-2 font-bold tracking-tight">Nothingness Portal</h1>
          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
            One-click access for Guests, Sanctuary Hosts, Lifestyle Members &amp; Admins.
          </p>
        </div>

        {/* Roles Supported Badges */}
        <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl mb-6 text-[10px] font-mono text-zinc-400">
          <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-white/[0.02]">
            <ShieldCheck className="w-4 h-4 text-accent-gold mb-1" />
            <span>Guest Stay</span>
          </div>
          <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-white/[0.02]">
            <Building2 className="w-4 h-4 text-amber-400 mb-1" />
            <span>Host Partner</span>
          </div>
          <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-white/[0.02]">
            <Flame className="w-4 h-4 text-rose-400 mb-1" />
            <span>Lifestyle</span>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-xl mb-5 text-left leading-relaxed">
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs p-3.5 rounded-xl mb-5 text-left leading-relaxed">
            {infoMsg}
          </div>
        )}

        {/* Step 1: Mobile Phone Number Input */}
        {step === 'identifier' && (
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-2 font-mono">
                Mobile Number (SMS &amp; WhatsApp OTP)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && identifier && !loading) {
                      e.preventDefault();
                      handleSendOtp();
                    }
                  }}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 sm:px-5 py-3.5 sm:py-4 text-base md:text-sm text-white focus:outline-none focus:border-accent-gold/60 transition-colors font-mono tracking-wider"
                  required
                />
                <Smartphone className="w-4 h-4 text-zinc-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={handleSendOtp}
              disabled={!identifier || loading}
              className="w-full bg-accent-gold hover:bg-white text-black py-4 rounded-xl text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 disabled:opacity-50 mt-2 shadow-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Continue with OTP</span> <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono">
                <span className="bg-zinc-950 px-3 text-zinc-500">Or 1-Click Biometrics</span>
              </div>
            </div>

            {/* 1-Click Passkey Biometric Sign In */}
            <button
              onClick={handlePasskeyLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-white py-3.5 sm:py-4 rounded-xl text-xs font-bold tracking-[0.1em] uppercase transition-all duration-300 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-accent-gold" />
              Sign in with Passkey / FaceID
            </button>
          </div>
        )}

        {/* Step 2: 6-Digit OTP Verification */}
        {step === 'verify-phone' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-xs text-zinc-300 font-mono">Sent to {identifier}</span>
              <button
                type="button"
                onClick={() => {
                  setStep('identifier');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                className="text-xs text-accent-gold hover:underline font-mono cursor-pointer"
              >
                Change
              </button>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-2 font-mono">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                placeholder="------"
                value={otpToken}
                onChange={(e) => setOtpToken(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-3.5 sm:py-4 text-white focus:outline-none focus:border-accent-gold/60 text-center tracking-[0.5em] text-xl font-mono transition-colors"
                required
                maxLength={6}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpToken.length < 6}
              className="w-full bg-accent-gold hover:bg-white text-black py-4 rounded-xl text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 mt-4 disabled:opacity-50 shadow-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Enter Portal</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full bg-transparent text-zinc-400 hover:text-white py-2.5 rounded-xl text-[11px] font-mono tracking-wider uppercase transition-colors disabled:opacity-50 cursor-pointer"
            >
              Resend OTP Code
            </button>
          </form>
        )}

        <div className="mt-8 pt-4 border-t border-zinc-800/80 flex items-center justify-center gap-2 text-[10px] text-zinc-500 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-accent-gold" />
          <span>256-Bit Encrypted • Police Compliance Verified</span>
        </div>
      </motion.div>
    </main>
  );
}
