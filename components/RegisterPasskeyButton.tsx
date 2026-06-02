'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function RegisterPasskeyButton() {
  const [loading, setLoading] = useState(false);

  const handleRegisterPasskey = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      const { data: options, error: startError } = await supabase.auth.passkey.startRegistration();
      if (startError) throw startError;

      const credential = await navigator.credentials.create({
        publicKey: options,
      });

      if (!credential) throw new Error('Passkey registration cancelled');

      const { error: verifyError } = await supabase.auth.passkey.verifyRegistration({
        credential,
      });

      if (verifyError) throw verifyError;

      toast.success('Passkey successfully registered! You can now use it to sign in.');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to register passkey.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleRegisterPasskey}
      disabled={loading}
      className="text-white/50 hover:text-white transition-colors flex items-center gap-2 cursor-pointer w-full text-left"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
      </svg>
      {loading ? 'Setting up...' : 'Setup Passkey Login'}
    </button>
  );
}
