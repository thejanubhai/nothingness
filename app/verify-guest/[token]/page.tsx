'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import IDUploadModal from '@/components/IDUploadModal';

export default function GuestPrivateVerification({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [name, setName] = useState('');

  // Optional: We could verify if the token is valid here on mount

  return (
    <main className="min-h-screen pt-40 pb-24 px-5 md:px-8 max-w-2xl mx-auto flex flex-col items-center text-center">
      <div className="mb-10 w-full">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-4">Guest Verification</p>
        <h1 className="font-serif text-4xl md:text-5xl mb-6 leading-tight">
          Verify Your <span className="italic text-white/50">Identity</span>
        </h1>
        <p className="text-white/60 text-sm md:text-base leading-relaxed mb-6">
          You have been invited as a guest to Nothingness. To gain entry, you must verify your identity privately. We require an Aadhaar or Passport (Front & Back).
        </p>
      </div>

      {!verified ? (
        <div className="w-full bg-white/[0.02] border border-white/5 rounded-3xl p-8 md:p-12">
          <ShieldAlert className="w-12 h-12 text-accent-gold/50 mx-auto mb-6" />
          <h2 className="text-xl text-white mb-4">Private & Secure</h2>
          <p className="text-white/40 text-sm mb-8 max-w-md mx-auto">
            Your documents are processed securely by AI and immediately discarded. They are never shown to the main booking guest.
          </p>
          
          <button 
            onClick={() => setModalOpen(true)}
            className="w-full md:w-auto bg-accent-gold text-black px-12 py-4 rounded-xl text-[12px] font-bold tracking-[0.15em] uppercase hover:bg-white transition-colors"
          >
            Start Verification
          </button>
        </div>
      ) : (
        <div className="w-full bg-white/[0.02] border border-white/5 rounded-3xl p-8 md:p-12">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl text-white mb-2">Verified</h2>
          <p className="text-white/60 mb-6">Thank you, {name}. Your identity has been confirmed.</p>
          <p className="text-sm text-accent-gold">You can now close this tab. The main guest has been notified.</p>
        </div>
      )}

      <IDUploadModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        token={resolvedParams.token}
        onSuccess={(n) => {
          setModalOpen(false);
          setVerified(true);
          setName(n);
        }}
      />
    </main>
  );
}
