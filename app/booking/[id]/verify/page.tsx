'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, CheckCircle2, Copy, Link as LinkIcon, Share2 } from 'lucide-react';
import IDUploadModal from '@/components/IDUploadModal';
import { toast } from 'sonner';

interface Guest {
  id: string;
  guest_index: number;
  name: string | null;
  phone?: string | null;
  verification_status: string;
  verification_token: string;
}

export default function VerificationDashboard({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeGuest, setActiveGuest] = useState<Guest | null>(null);

  useEffect(() => {
    fetchGuests();
    
    // Poll for updates every 5 seconds so if partner verifies on their phone, it updates here
    const interval = setInterval(fetchGuests, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchGuests = async () => {
    try {
      const res = await fetch(`/api/guests?bookingId=${resolvedParams.id}`);
      const data = await res.json();
      if (data.guests) {
        setGuests(data.guests);
        
        // If all verified, redirect
        const allVerified = data.guests.length > 0 && data.guests.every((g: Guest) => g.verification_status === 'verified');
        if (allVerified) {
          router.push(`/booking/${resolvedParams.id}/success`);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getGuestVerificationUrl = (guest: Guest) => {
    const token = guest.verification_token || guest.id;
    const origin = typeof window !== 'undefined' && !window.location.origin.includes('localhost') 
      ? window.location.origin 
      : 'https://nothingness.asia';
    return `${origin}/verify-guest/${token}`;
  };

  const copyLink = (guest: Guest) => {
    const url = getGuestVerificationUrl(guest);
    navigator.clipboard.writeText(url);
    toast.success('Link Copied!', { description: 'Share this link with your co-guest.' });
  };

  const shareCoGuestWhatsApp = (guest: Guest) => {
    const url = getGuestVerificationUrl(guest);
    const guestLabel = guest.name || `Guest ${guest.guest_index + 1}`;
    const text = encodeURIComponent(`Namaste ${guestLabel}! ✨ Please complete your discreet 30-second digital ID check-in for our upcoming stay at Nothingness:\n${url}`);
    
    const cleanDigits = guest.phone ? guest.phone.replace(/[^0-9]/g, '') : '';
    if (cleanDigits) {
      const cleanPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
      window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  return (
    <main className="min-h-screen pt-40 pb-24 px-5 md:px-8 max-w-4xl mx-auto flex flex-col items-center">
      <div className="mb-10 w-full text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-4">Verification Dashboard</p>
        <h1 className="font-serif text-4xl md:text-5xl mb-6 leading-tight">
          Verify Your <span className="italic text-white/50">Guests</span>
        </h1>
        <p className="text-white/60 text-sm md:text-base leading-relaxed mb-6 max-w-2xl mx-auto">
          Per local regulations, we require Aadhaar or Passport (Front & Back) for ALL guests. You will receive your access code once everyone is verified.
        </p>
      </div>

      <div className="w-full space-y-4">
        {loading && <p className="text-white/40 text-center">Loading guests...</p>}
        
        {!loading && guests.map((guest) => {
          const isMain = guest.guest_index === 0;
          const isVerified = guest.verification_status === 'verified';
          
          return (
            <div key={guest.id} className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-1">
                  {isMain ? 'Main Guest' : `Guest ${guest.guest_index + 1}`}
                </p>
                <h3 className="text-lg text-white font-light">
                  {guest.name || 'Awaiting Verification...'}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${isVerified ? 'bg-green-500' : 'bg-accent-gold'}`} />
                  <span className="text-xs uppercase tracking-widest text-white/50">
                    {guest.verification_status}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                {isVerified ? (
                  <div className="text-green-500 flex items-center gap-2 px-6 py-3 bg-green-500/10 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" /> Verified
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => { setActiveGuest(guest); setModalOpen(true); }}
                      className="flex-1 md:flex-none bg-accent-gold text-black px-6 py-3 rounded-xl text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-white transition-colors"
                    >
                      Verify Now
                    </button>
                    {!isMain && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => copyLink(guest)}
                          className="flex-1 md:flex-none bg-white/5 text-white px-4 py-3 rounded-xl text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </button>
                        <button 
                          onClick={() => shareCoGuestWhatsApp(guest)}
                          className="flex-1 md:flex-none bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 px-4 py-3 rounded-xl text-[11px] font-bold tracking-[0.15em] uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Share via WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" /> WhatsApp
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeGuest && (
        <IDUploadModal 
          isOpen={modalOpen} 
          onClose={() => { setModalOpen(false); setActiveGuest(null); }}
          bookingId={resolvedParams.id}
          guestId={activeGuest.id}
          onSuccess={(name) => {
            fetchGuests();
            setModalOpen(false);
            setActiveGuest(null);
          }}
        />
      )}
    </main>
  );
}
