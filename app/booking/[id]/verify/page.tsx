'use client';

import React, { useState, use, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Copy, 
  Share2, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight,
  CreditCard,
  Building2,
  Calendar,
  Sparkles,
  FileText
} from 'lucide-react';
import IDUploadModal from '@/components/IDUploadModal';
import FaceIdScanModal from '@/components/FaceIdScanModal';
import { toast } from 'sonner';

interface Guest {
  id: string;
  guest_index: number;
  name: string | null;
  phone?: string | null;
  verification_status: string;
  verification_token: string;
}

interface BookingDetails {
  id: string;
  status: string;
  payment_status: string;
  total_price: number;
  check_in: string;
  check_out: string;
  guest_name: string;
  spaces?: {
    title: string;
  };
}

function VerificationDashboardContent({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [guests, setGuests] = useState<Guest[]>([]);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeGuest, setActiveGuest] = useState<Guest | null>(null);
  const [faceIdModalOpen, setFaceIdModalOpen] = useState(false);
  const [faceGuest, setFaceGuest] = useState<Guest | null>(null);

  // Check URL parameters on mount
  useEffect(() => {
    const paymentStatus = searchParams?.get('payment');
    const errorMsg = searchParams?.get('error');
    const idVerified = searchParams?.get('id_verified');

    if (paymentStatus === 'success') {
      toast.success('Payment Received Successfully!', {
        description: 'Your sanctuary reservation is confirmed. Please complete statutory ID verification for all guests below.',
      });
    } else if (paymentStatus === 'failed') {
      toast.error('Payment Failed or Incomplete', {
        description: errorMsg ? decodeURIComponent(errorMsg) : 'Your transaction was not completed. Please retry payment.',
      });
    }

    if (idVerified === 'true') {
      toast.success('Statutory ID Verified!', {
        description: 'Guest compliance record successfully updated for this stay.',
      });
    }
  }, [searchParams]);

  useEffect(() => {
    fetchGuests();
    
    // Poll for updates every 5 seconds so if partner verifies on their phone, it updates here
    const interval = setInterval(fetchGuests, 5000);
    return () => clearInterval(interval);
  }, [bookingId]);

  const fetchGuests = async () => {
    try {
      const res = await fetch(`/api/guests?bookingId=${bookingId}`);
      const data = await res.json();
      if (data.guests) {
        setGuests(data.guests);
        if (data.booking) {
          setBooking(data.booking);
        }
        
        // If all verified and payment is paid/confirmed, redirect to success credentials
        const allVerified = data.guests.length > 0 && data.guests.every((g: Guest) => g.verification_status === 'verified');
        const isPaid = data.booking?.payment_status === 'paid' || data.booking?.status === 'confirmed';
        if (allVerified && isPaid) {
          router.push(`/booking/${bookingId}/success`);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async () => {
    setRetryingPayment(true);
    toast.info('Reconnecting to PayU Secure Payment Gateway...');

    try {
      const res = await fetch(`/api/bookings/${bookingId}/retry-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to re-initiate payment');
      }

      // Auto-submit dynamic PayU form
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.paymentUrl;

      Object.entries(data.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        }
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Payment initiation failed.');
      setRetryingPayment(false);
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

  const isPaymentFailed = searchParams?.get('payment') === 'failed' || booking?.payment_status === 'failed';
  const isPaymentPaid = searchParams?.get('payment') === 'success' || booking?.payment_status === 'paid' || booking?.status === 'confirmed';
  const errorMessage = searchParams?.get('error') ? decodeURIComponent(searchParams.get('error')!) : 'The payment transaction was cancelled or declined by your bank.';

  return (
    <main className="min-h-screen pt-36 pb-24 px-5 md:px-8 max-w-4xl mx-auto flex flex-col items-center">
      {/* Header */}
      <div className="mb-8 w-full text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent-gold/70 mb-3">Verification &amp; Check-In Portal</p>
        <h1 className="font-serif text-3xl md:text-5xl mb-4 leading-tight text-white">
          Sanctuary <span className="italic text-white/50">Reservation</span>
        </h1>
        {booking?.spaces?.title && (
          <p className="text-accent-gold/90 font-mono text-xs uppercase tracking-widest mb-2">
            {booking.spaces.title}
          </p>
        )}
      </div>

      {/* Payment Failure Warning Banner & 1-Click Retry CTA */}
      {isPaymentFailed && (
        <div className="w-full mb-8 p-6 bg-rose-950/30 border border-rose-500/40 rounded-3xl backdrop-blur-md space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-white tracking-wide">Reservation Payment Incomplete</h2>
              <p className="text-xs text-rose-200/80 mt-1 leading-relaxed">
                {errorMessage}
              </p>
              <p className="text-[11px] text-zinc-400 font-mono mt-1">
                Your selected dates remain reserved temporarily. Please retry payment to confirm your sanctuary stay.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-rose-500/20">
            <button
              onClick={handleRetryPayment}
              disabled={retryingPayment}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-950/50 disabled:opacity-50"
            >
              {retryingPayment ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to PayU...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Retry Payment Now (₹{Number(booking?.total_price || 0).toLocaleString('en-IN')})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-[10px] text-zinc-500 font-mono">
              Secure 256-bit encrypted PayU checkout • Descriptor: <strong className="text-zinc-400">PAYU*NOTHINGNESS</strong>
            </p>
          </div>
        </div>
      )}

      {/* Payment Confirmed Banner */}
      {isPaymentPaid && (
        <div className="w-full mb-8 p-5 bg-emerald-950/25 border border-emerald-500/30 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono">
                Tariff Confirmed &amp; Settled
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Primary payment verified. Please complete statutory ID verification below to release your entrance passcode.
              </p>
            </div>
          </div>
          <Link
            href={`/booking/${bookingId}/invoice`}
            className="shrink-0 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-mono font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View GST Invoice</span>
          </Link>
        </div>
      )}

      {/* Guest ID Verification Card Section */}
      <div className="w-full mb-4">
        <p className="text-white/60 text-xs md:text-sm leading-relaxed mb-6 max-w-2xl">
          Per local police compliance regulations, Aadhaar or Passport (Front &amp; Back) is mandatory for ALL guests. Your secret access code is automatically revealed once everyone is vetted.
        </p>
      </div>

      <div className="w-full space-y-4">
        {loading && (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-2 border-accent-gold/20 border-t-accent-gold rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white/40 text-xs font-mono tracking-widest uppercase">Loading verification ledger...</p>
          </div>
        )}
        
        {!loading && guests.map((guest) => {
          const isMain = guest.guest_index === 0;
          const isVerified = guest.verification_status === 'verified';
          
          return (
            <div key={guest.id} className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-1 font-mono">
                  {isMain ? 'Primary Guest' : `Co-Guest ${guest.guest_index + 1}`}
                </p>
                <h3 className="text-lg text-white font-light">
                  {guest.name || 'Awaiting Verification...'}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${isVerified ? 'bg-green-500' : 'bg-accent-gold'}`} />
                  <span className="text-xs uppercase tracking-widest text-white/50 font-mono">
                    {guest.verification_status}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                {isVerified ? (
                  <div className="text-green-500 flex items-center gap-2 px-6 py-3 bg-green-500/10 rounded-xl font-mono text-xs font-bold border border-green-500/20">
                    <CheckCircle2 className="w-4 h-4" /> Verified
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => { setActiveGuest(guest); setModalOpen(true); }}
                      className="flex-1 md:flex-none bg-accent-gold text-black px-6 py-3 rounded-xl text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-white transition-colors cursor-pointer"
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
          bookingId={bookingId}
          guestId={activeGuest.id}
          onSuccess={(name) => {
            const guestJustVerified = activeGuest;
            fetchGuests();
            setModalOpen(false);
            setActiveGuest(null);
            if (guestJustVerified) {
              setFaceGuest(guestJustVerified);
              setFaceIdModalOpen(true);
            }
          }}
        />
      )}

      {faceGuest && (
        <FaceIdScanModal
          isOpen={faceIdModalOpen}
          onClose={() => { setFaceIdModalOpen(false); setFaceGuest(null); }}
          guestId={faceGuest.id}
          token={faceGuest.verification_token}
          onSuccess={(url) => {
            setFaceIdModalOpen(false);
            setFaceGuest(null);
            fetchGuests();
            toast.success('3D Face ID Registered!', {
              description: 'Gatekeeper priority check-in is now active.',
            });
          }}
        />
      )}
    </main>
  );
}

export default function VerificationDashboard({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <Suspense fallback={
      <main className="min-h-screen pt-40 pb-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-gold/20 border-t-accent-gold rounded-full animate-spin" />
      </main>
    }>
      <VerificationDashboardContent bookingId={resolvedParams.id} />
    </Suspense>
  );
}
