'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { KeyRound, ShieldCheck, RefreshCw } from 'lucide-react';

export default function RegisterPasskeyButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const bufferToBase64URLString = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const base64URLStringToBuffer = (base64URLString: string) => {
    const padding = '='.repeat((4 - (base64URLString.length % 4)) % 4);
    const base64 = (base64URLString + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleRegisterPasskey = async () => {
    if (typeof window === 'undefined' || !window.PublicKeyCredential || !navigator.credentials) {
      toast.error('Passkeys are not supported on this browser or platform.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      
      const { data, error: startError } = await supabase.auth.passkey.startRegistration();

      if (startError) throw startError;

      const options = data?.options as any;
      const publicKey: any = {
        ...options,
        challenge: base64URLStringToBuffer(options.challenge),
        user: {
          ...options.user,
          id: base64URLStringToBuffer(options.user.id),
        },
      };

      if (options.excludeCredentials) {
        publicKey.excludeCredentials = options.excludeCredentials.map((cred: any) => ({
          ...cred,
          id: base64URLStringToBuffer(cred.id),
        }));
      }

      const credential = (await navigator.credentials.create({
        publicKey,
      })) as any;

      if (!credential) {
        toast.info('Passkey setup cancelled.');
        setLoading(false);
        return;
      }

      // Serialize response properly for Supabase
      let serializedCredential: any;
      if (typeof credential.toJSON === 'function') {
        serializedCredential = credential.toJSON();
      } else {
        const response = credential.response;
        serializedCredential = {
          id: credential.id,
          rawId: bufferToBase64URLString(credential.rawId),
          type: credential.type,
          response: {
            clientDataJSON: bufferToBase64URLString(response.clientDataJSON),
            attestationObject: bufferToBase64URLString(response.attestationObject),
            transports: response.getTransports ? response.getTransports() : undefined,
          },
          clientExtensionResults: credential.getClientExtensionResults ? credential.getClientExtensionResults() : {},
          authenticatorAttachment: credential.authenticatorAttachment || undefined,
        };
      }

      const { error: verifyError } = await supabase.auth.passkey.verifyRegistration({
        challengeId: data?.challenge_id as string,
        credential: serializedCredential,
      });

      if (verifyError) throw verifyError;

      toast.success('Passkey enrolled! You can now use FaceID / TouchID to log in.');
      router.refresh();
    } catch (err: any) {
      console.error('[Passkey Registration Error]:', err);
      const msg = err.message || '';
      if (msg.includes('AbortError') || msg.includes('cancel') || msg.includes('NotAllowedError')) {
        toast.info('Passkey setup prompt was dismissed.');
      } else {
        toast.error(msg || 'Failed to register passkey.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleRegisterPasskey}
      disabled={loading}
      className="text-white hover:text-accent-gold transition-colors flex items-center justify-between w-full py-2 cursor-pointer group disabled:opacity-50"
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
