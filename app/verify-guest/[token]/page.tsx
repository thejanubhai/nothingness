'use client';

import { useState, use, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert, CheckCircle2, CreditCard, Lock, Calendar, MapPin, Sparkles, AlertCircle, Camera, Scan } from 'lucide-react';
import IDUploadModal from '@/components/IDUploadModal';
import FaceIdScanModal from '@/components/FaceIdScanModal';
import { toast } from 'sonner';

export default function GuestPrivateVerification({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const token = resolvedParams.token;
  
  const [loading, setLoading] = useState(true);
  const [guestData, setGuestData] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [faceIdModalOpen, setFaceIdModalOpen] = useState(false);
  const [faceIdVetted, setFaceIdVetted] = useState(false);
  const [liveFaceUrl, setLiveFaceUrl] = useState('');
  const [verified, setVerified] = useState(false);
  const [verifiedName, setVerifiedName] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetchGuestDetails();
  }, [token]);

  const fetchGuestDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/verify-guest/details?token=${token}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to load details');

      setGuestData(data.guest);
      if (data.guest.verification_status === 'verified') {
        setVerified(true);
        setVerifiedName(data.guest.name || 'Guest');
        setFaceIdVetted(Boolean(data.guest?.guest_profiles?.face_id_vetted));
        setLiveFaceUrl(data.guest?.guest_profiles?.live_face_url || '');
      }

      // Check if redirected after payment
      const orderId = searchParams?.get('order_id');
      const paymentStatus = searchParams?.get('payment');
      const errorMsg = searchParams?.get('error');

      if (paymentStatus === 'success') {
        toast.success('Your stay fee payment has been confirmed!');
        setGuestData((prev: any) => ({ ...prev, payment_status: 'paid' }));
      } else if (paymentStatus === 'failed') {
        const decodedError = errorMsg ? decodeURIComponent(errorMsg) : 'Your transaction was declined or cancelled.';
        toast.error('Stay Fee Payment Incomplete', {
          description: decodedError,
        });
        setGuestData((prev: any) => ({ ...prev, payment_status: 'failed' }));
      } else if (orderId && data.guest.payment_status !== 'paid') {
        verifyPayment(orderId);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Invalid or expired verification link');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (orderId: string) => {
    try {
      const res = await fetch('/api/verify-guest/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, orderId })
      });
      const data = await res.json();
      if (data.success && data.paid) {
        toast.success('Your stay fee payment has been confirmed!');
        setGuestData((prev: any) => ({ ...prev, payment_status: 'paid' }));
      }
    } catch (err) {
      console.error('Payment confirmation error:', err);
    }
  };

  const handleSelfPay = async () => {
    if (!token) return;
    setPaying(true);
    toast.info('Initializing secure payment session...');

    try {
      const res = await fetch('/api/verify-guest/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize payment');

      // Dynamically create and submit PayU form
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
      toast.info('Connecting to PayU Secure Payment Gateway...');
      form.submit();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Payment initiation failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen pt-36 pb-24 px-5 max-w-xl mx-auto flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 border-2 border-accent-gold/20 border-t-accent-gold rounded-full animate-spin mb-4" />
        <p className="text-white/40 text-xs font-mono tracking-widest uppercase">Loading Guest Verification Portal...</p>
      </main>
    );
  }

  if (!guestData) {
    return (
      <main className="min-h-screen pt-36 pb-24 px-5 max-w-xl mx-auto flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h1 className="font-serif text-2xl text-white mb-2">Invalid or Expired Link</h1>
        <p className="text-white/50 text-sm mb-6">This guest verification link is no longer valid or has expired.</p>
      </main>
    );
  }

  const space = Array.isArray(guestData.bookings?.spaces) ? guestData.bookings?.spaces[0] : guestData.bookings?.spaces;
  const isPaymentPending = guestData.payment_status === 'pending';
  const isPaymentFailed = guestData.payment_status === 'failed';
  const isPaymentPaid = guestData.payment_status === 'paid';
  const isPaymentCovered = guestData.payment_status === 'not_required';

  return (
    <main className="min-h-screen pt-32 pb-24 px-5 md:px-8 max-w-2xl mx-auto flex flex-col items-center">
      
      {/* Header */}
      <div className="mb-8 text-center w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-gold/10 border border-accent-gold/20 rounded-full mb-3">
          <Sparkles className="w-3.5 h-3.5 text-accent-gold" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-accent-gold font-mono">Private Guest Portal</span>
        </div>
        <h1 className="font-serif text-3xl md:text-4xl text-white mb-2 leading-tight">
          Welcome to <span className="italic text-accent-gold">{space?.title || 'Nothingness'}</span>
        </h1>
        <p className="text-white/50 text-xs md:text-sm">
          You have been registered for an exclusive stay. Please complete your identity verification and stay requirements below.
        </p>
      </div>

      {/* Reservation Summary Card */}
      {guestData.bookings && (
        <div className="w-full bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 mb-6 text-left relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-[0.2em] text-white/40 font-mono">Stay Reservation</span>
            <span className="text-xs font-mono text-accent-gold/80 font-bold">
              Primary: {guestData.bookings.guest_name || 'Host Booker'}
            </span>
          </div>
          <h2 className="text-xl font-serif text-white mb-1">{space?.title || 'Sanctuary Suite'}</h2>
          {guestData.bookings.check_in && guestData.bookings.check_out && (
            <div className="text-xs text-white/50 font-mono mt-2">
              {guestData.bookings.check_in} → {guestData.bookings.check_out}
            </div>
          )}
        </div>
      )}

      {/* Payment Status Card (if self-pay required) */}
      <div className="w-full bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 mb-6 text-left space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-accent-gold" />
            <h3 className="text-base font-medium text-white">Tariff &amp; Payment Status</h3>
          </div>
          {isPaymentPaid && (
            <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] uppercase font-mono rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Paid
            </span>
          )}
          {isPaymentCovered && (
            <span className="px-2.5 py-1 bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] uppercase font-mono rounded-full">
              Covered by Primary Booker
            </span>
          )}
          {isPaymentFailed && (
            <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] uppercase font-mono rounded-full">
              Payment Incomplete (₹{guestData.payment_amount})
            </span>
          )}
          {isPaymentPending && !isPaymentFailed && (
            <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] uppercase font-mono rounded-full">
              Pending (₹{guestData.payment_amount})
            </span>
          )}
        </div>

        {(isPaymentPending || isPaymentFailed) && (
          <div className="space-y-4">
            <p className="text-xs text-white/60 leading-relaxed">
              {isPaymentFailed
                ? 'Your previous transaction was declined or interrupted. Please retry your stay fee contribution below.'
                : 'The primary booker opted for individual guest contribution. Your additional guest stay tariff is '}
              <strong className="text-accent-gold font-mono font-bold"> ₹{guestData.payment_amount}</strong> (including taxes &amp; luxury sanitization fees).
            </p>
            <button
              onClick={handleSelfPay}
              disabled={paying}
              className={`w-full py-3.5 ${
                isPaymentFailed
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-black'
                  : 'bg-accent-gold hover:bg-white text-black'
              } font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer`}
            >
              <Lock className="w-4 h-4" />
              {paying
                ? 'Connecting to Payment...'
                : isPaymentFailed
                ? `Retry Payment (₹${guestData.payment_amount})`
                : `Pay ₹${guestData.payment_amount} Now`}
            </button>
          </div>
        )}

        {isPaymentPaid && (
          <p className="text-xs text-green-400/80 leading-relaxed font-mono">
            ✓ Your stay contribution of ₹{guestData.payment_amount} has been successfully received.
          </p>
        )}

        {isPaymentCovered && (
          <p className="text-xs text-white/50 leading-relaxed">
            Your stay tariff has been completely settled by the primary booker ({guestData.bookings?.guest_name || 'Primary Guest'}). No payment is required from you.
          </p>
        )}
      </div>

      {/* ID Verification Section */}
      <div className="w-full bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 text-center space-y-6">
        {!verified ? (
          <>
            <ShieldAlert className="w-12 h-12 text-accent-gold/60 mx-auto" />
            <div>
              <h2 className="text-xl text-white mb-2 font-serif">Govt ID Verification Required</h2>
              <p className="text-white/40 text-xs md:text-sm max-w-md mx-auto leading-relaxed">
                Under local hospitality regulations, all staying guests must submit a valid Aadhaar Card or Passport (Front &amp; Back). Your documents are processed privately with encryption.
              </p>
            </div>
            
            <button 
              onClick={() => setModalOpen(true)}
              className="w-full sm:w-auto px-10 py-3.5 bg-accent-gold text-black rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-white transition-all shadow-xl"
            >
              Upload ID Documents
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl text-white font-serif">Identity Verified</h2>
            <p className="text-white/60 text-xs font-mono">
              Thank you, <span className="text-accent-gold font-bold">{verifiedName}</span>. Your verification has been registered.
            </p>
            
            {faceIdVetted ? (
              <div className="pt-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold inline-flex items-center gap-1.5">
                  <Scan className="w-3.5 h-3.5" />
                  <span>3D Face ID Biometric Verified ✓</span>
                </span>
              </div>
            ) : (
              <div className="pt-4 border-t border-white/10 space-y-2.5">
                <p className="text-xs text-zinc-300 font-medium">Want faster gate check-in &amp; priority access to private events?</p>
                <button
                  onClick={() => setFaceIdModalOpen(true)}
                  className="px-6 py-2.5 bg-accent-gold/20 hover:bg-accent-gold/30 border border-accent-gold/40 text-accent-gold rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 mx-auto cursor-pointer transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>Complete 3D Face Scan (Confidential)</span>
                </button>
              </div>
            )}

            <p className="text-[11px] text-white/40 pt-2">
              You will receive door lockbox access codes on your phone prior to check-in.
            </p>
          </div>
        )}
      </div>

      <IDUploadModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        token={token}
        onSuccess={(n) => {
          setModalOpen(false);
          setVerified(true);
          setVerifiedName(n);
          toast.success(`Identity verified for ${n}!`);
          setFaceIdModalOpen(true);
        }}
      />

      <FaceIdScanModal
        isOpen={faceIdModalOpen}
        onClose={() => setFaceIdModalOpen(false)}
        guestId={guestData?.guest_profile_id || guestData?.guest_profiles?.id}
        token={token}
        onSuccess={(url) => {
          setFaceIdVetted(true);
          setLiveFaceUrl(url);
          toast.success('3D Face ID Registered!', {
            description: 'Your real-life identity is verified for Gatekeeper door entry.',
          });
        }}
      />
    </main>
  );
}
