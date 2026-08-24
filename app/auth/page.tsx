'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendOtp, verifyOtp, onPasskeyLoginSuccess } from '@/app/actions/auth';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { KeyRound, Smartphone, ShieldCheck, Sparkles, Building2, Flame, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [step, setStep] = useState<'identifier' | 'verify-phone'>('identifier');
  const [otpToken, setOtpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const base64URLStringToBuffer = (base64URLString: string) => {
    const padding = '='.repeat((4 - base64URLString.length % 4) % 4);
    const base64 = (base64URLString + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleSendOtp = async () => {
    if (!identifier) return;
    setLoading(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('identifier', identifier);

    const result = await sendOtp(null, formData);

    if (result?.error) {
      setErrorMsg(result.error);
    } else if (result?.success) {
      setStep('verify-phone');
      toast.success(result.message);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpToken) return;
    setLoading(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('identifier', identifier);
    formData.append('token', otpToken);

    const result = await verifyOtp(null, formData);
    if (result?.error) {
      setErrorMsg(result.error);
    }
    setLoading(false);
  };

  const handlePasskeyLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const supabase = createClient();
      const { data, error: startError } = await supabase.auth.passkey.startAuthentication();
      
      if (startError) throw startError;

      const options = data?.options as any;
      const publicKey = {
        ...options,
        challenge: base64URLStringToBuffer(options.challenge),
      };
      
      if (publicKey.allowCredentials) {
        publicKey.allowCredentials = publicKey.allowCredentials.map((cred: any) => ({
          ...cred,
          id: base64URLStringToBuffer(cred.id),
        }));
      }

      const credential = await navigator.credentials.get({
        publicKey: publicKey as any,
      });

      if (!credential) throw new Error('Passkey selection cancelled');

      const { error: verifyError } = await supabase.auth.passkey.verifyAuthentication({
        challengeId: data?.challenge_id as string,
        credential: credential as any,
      });

      if (verifyError) throw verifyError;

      toast.success('Successfully logged in with Passkey!');
      // Route user to correct dashboard via server action
      await onPasskeyLoginSuccess();
      
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Passkey authentication cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-32 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 flex items-center justify-center relative overflow-hidden bg-black selection:bg-rose-500/30">
      {/* Subtle atmospheric ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

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
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-xl mb-5 text-left">
            {errorMsg}
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
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 sm:px-5 py-3.5 sm:py-4 text-base md:text-sm text-white focus:outline-none focus:border-accent-gold/60 transition-colors font-mono tracking-wider"
                  required
                />
                <Smartphone className="w-4 h-4 text-zinc-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            
            <button 
              onClick={handleSendOtp}
              disabled={!identifier || loading}
              className="w-full bg-accent-gold hover:bg-white text-black py-4 rounded-xl text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 disabled:opacity-50 mt-2 shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? 'Sending Code...' : <><span>Continue with OTP</span> <ArrowRight className="w-4 h-4" /></>}
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
              className="w-full flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-white py-3.5 sm:py-4 rounded-xl text-xs font-bold tracking-[0.1em] uppercase transition-all duration-300 disabled:opacity-50 active:scale-[0.99]"
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
              <button type="button" onClick={() => setStep('identifier')} className="text-xs text-accent-gold hover:underline font-mono">Change</button>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-2 font-mono">Enter 6-Digit Verification Code</label>
              <input 
                type="text" 
                placeholder="123456" 
                value={otpToken}
                onChange={(e) => setOtpToken(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-3.5 sm:py-4 text-white focus:outline-none focus:border-accent-gold/60 text-center tracking-[0.5em] text-xl font-mono transition-colors"
                required
                maxLength={6}
                autoFocus
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || otpToken.length < 6}
              className="w-full bg-accent-gold hover:bg-white text-black py-4 rounded-xl text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 mt-4 disabled:opacity-50 shadow-xl"
            >
              {loading ? 'Verifying...' : 'Verify & Enter Portal'}
            </button>

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full bg-transparent text-zinc-400 hover:text-white py-2.5 rounded-xl text-[11px] font-mono tracking-wider uppercase transition-colors disabled:opacity-50"
            >
              Resend OTP Code
            </button>
          </form>
        )}

        <div className="mt-8 pt-4 border-t border-zinc-800/80 flex items-center justify-center gap-2 text-[10px] text-zinc-500 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-accent-gold" />
          <span>256-Bit Encrypted • Delhi Police Compliant</span>
        </div>
      </motion.div>
    </main>
  );
}
