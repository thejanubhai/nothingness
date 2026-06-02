'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { sendOtp, verifyOtp, onPasskeyLoginSuccess } from '@/app/actions/auth';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [step, setStep] = useState<'identifier' | 'verify-phone'>('identifier');
  const [otpToken, setOtpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      const { data: options, error: startError } = await supabase.auth.passkey.startAuthentication();
      
      if (startError) throw startError;

      const credential = await navigator.credentials.get({
        publicKey: options as any,
      });

      if (!credential) throw new Error('Passkey selection cancelled');

      const { error: verifyError } = await supabase.auth.passkey.verifyAuthentication({
        credential,
      });

      if (verifyError) throw verifyError;

      toast.success('Successfully logged in with Passkey!');
      // Route user to correct dashboard via server action
      await onPasskeyLoginSuccess();
      
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Passkey authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-40 pb-24 px-5 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/[0.02] border border-white/5 rounded-3xl p-8 md:p-12 text-center shadow-2xl backdrop-blur-sm"
      >
        <div className="w-16 h-16 bg-accent-gold/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-accent-gold/20">
          <svg className="w-6 h-6 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h1 className="font-serif text-3xl mb-4 text-white">Access Portal</h1>
        <p className="text-white/50 text-sm mb-8">Enter your mobile number to continue securely.</p>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-6">
            {errorMsg}
          </div>
        )}

        {step === 'identifier' && (
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Mobile Number</label>
              <input 
                type="tel" 
                placeholder="+91 98765 43210" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-accent-gold/50 transition-colors tracking-widest"
                required
              />
            </div>
            
            <button 
              onClick={handleSendOtp}
              disabled={!identifier || loading}
              className="w-full bg-accent-gold text-black py-4 rounded-xl text-[12px] font-bold tracking-[0.15em] uppercase hover:bg-white transition-colors disabled:opacity-50 mt-6"
            >
              {loading ? 'Sending OTP...' : 'Get OTP Code'}
            </button>
            
            <div className="mt-8 pt-6 border-t border-white/5">
              <button 
                onClick={handlePasskeyLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white py-4 rounded-xl text-[12px] font-bold tracking-[0.1em] uppercase hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
                Sign in with Passkey
              </button>
            </div>
          </div>
        )}

        {step === 'verify-phone' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
            <div className="flex items-center justify-between mb-6 bg-white/[0.02] p-3 rounded-lg border border-white/5">
              <span className="text-sm text-white/70">OTP sent to {identifier}</span>
              <button type="button" onClick={() => setStep('identifier')} className="text-xs text-accent-gold">Change</button>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Enter 6-Digit Code</label>
              <input 
                type="text" 
                placeholder="123456" 
                value={otpToken}
                onChange={(e) => setOtpToken(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-accent-gold/50 text-center tracking-[0.5em] text-xl transition-colors"
                required
                maxLength={6}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || otpToken.length < 6}
              className="w-full bg-accent-gold text-black py-4 rounded-xl text-[12px] font-bold tracking-[0.15em] uppercase hover:bg-white transition-colors mt-6 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}
      </motion.div>
    </main>
  );
}
