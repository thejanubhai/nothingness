'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { KeyRound, ShieldCheck, RefreshCw } from 'lucide-react';

export default function RegisterPasskeyButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegisterPasskey = async () => {
    if (
      typeof window === 'undefined' ||
      !window.PublicKeyCredential ||
      !navigator.credentials
    ) {
      toast.error('Passkeys & WebAuthn are not supported on this browser or device.');
      return;
    }

    // Check if user platform authenticator (FaceID, TouchID, Windows Hello) is available
    if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (!available) {
          console.warn('[Passkey] Platform authenticator not available on this device.');
        }
      } catch (_) {}
    }

    setLoading(true);
    try {
      const supabase = createClient();

      // Ensure user has an active session before enrolling biometric passkey
      const {
        data: { session },
        error: sessionErr,
      } = await supabase.auth.getSession();

      if (sessionErr || !session?.user) {
        toast.error('Please log in with your mobile OTP first before adding a Passkey.');
        return;
      }

      // Execute full official Supabase WebAuthn ceremony
      // Handles challenge retrieval, navigator.credentials.create, and server verification
      const { data, error } = await supabase.auth.registerPasskey();

      if (error) {
        const msg = error.message || '';
        if (
          msg.includes('AbortError') ||
          msg.includes('cancel') ||
          msg.includes('NotAllowedError') ||
          msg.includes('user cancelled')
        ) {
          toast.info('Passkey setup prompt was dismissed.');
          return;
        }
        throw error;
      }

      toast.success('Passkey enrolled! You can now use FaceID / TouchID to log in without OTP.');
      router.refresh();
    } catch (err: any) {
      console.error('[Passkey Registration Error]:', err);
      const msg = err.message || '';
      if (
        msg.includes('AbortError') ||
        msg.includes('cancel') ||
        msg.includes('NotAllowedError')
      ) {
        toast.info('Passkey prompt dismissed.');
      } else {
        toast.error(msg || 'Failed to register passkey on this device.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRegisterPasskey}
      disabled={loading}
      className={`text-white hover:text-accent-gold transition-colors flex items-center justify-between w-full py-2 cursor-pointer group disabled:opacity-50 ${className || ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-accent-gold/20 flex items-center justify-center transition-colors">
          {loading ? (
            <RefreshCw className="w-4 h-4 text-accent-gold animate-spin" />
          ) : (
            <KeyRound className="w-4 h-4 text-accent-gold" />
          )}
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-white group-hover:text-accent-gold transition-colors">
            {loading ? 'Activating Biometrics...' : 'Enroll New Passkey (FaceID / TouchID)'}
          </p>
          <p className="text-xs text-white/40 font-mono">1-click login without OTP</p>
        </div>
      </div>
      <ShieldCheck className="w-4 h-4 text-zinc-500 group-hover:text-accent-gold transition-colors" />
    </button>
  );
}
