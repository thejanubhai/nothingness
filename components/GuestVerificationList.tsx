'use client';

import { CheckCircle, Clock, Copy, ShieldAlert, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function GuestVerificationList({ 
  guests, 
  siteUrl,
  isAdmin = false,
  bookingId
}: { 
  guests: any[], 
  siteUrl?: string,
  isAdmin?: boolean,
  bookingId?: string
}) {
  if (!guests || guests.length === 0) return null;

  const getShareableLink = (guest: any) => {
    const token = guest.verification_token || guest.id;
    let base = 'https://nothingness.asia';

    if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')) {
      base = window.location.origin;
    } else if (siteUrl && !siteUrl.includes('localhost')) {
      base = siteUrl;
    }

    return `${base}/verify-guest/${token}`;
  };

  const handleCopy = (guest: any) => {
    const link = getShareableLink(guest);
    navigator.clipboard.writeText(link);
    toast.success('Link Copied', {
      description: 'Send this securely to your guest.'
    });
  };

  const handleWhatsApp = (guest: any) => {
    const link = getShareableLink(guest);
    const guestLabel = guest.name || (guest.guest_index ? `Guest ${guest.guest_index + 1}` : 'Guest');
    const message = `Namaste ${guestLabel}! ✨ Please complete your discreet 30-second digital ID check-in for our upcoming stay at Nothingness:\n${link}`;
    
    const cleanDigits = guest.phone ? guest.phone.replace(/[^0-9]/g, '') : '';
    if (cleanDigits) {
      const cleanPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleUpdateStatus = async (guestId: string, status: 'verified' | 'failed') => {
    try {
      toast.loading(`Updating status to ${status}...`);
      const res = await fetch('/api/admin/verify-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingGuestId: guestId, status })
      });
      const data = await res.json();
      toast.dismiss();
      if (res.ok) {
        toast.success(data.message || `Status updated to ${status}`);
        window.location.reload();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || 'Network error');
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-white/5">
      <p className="text-[10px] uppercase font-mono tracking-[0.2em] text-zinc-400 mb-3">Guest Roster &amp; Verification</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {guests.map((guest: any) => {
          const isMain = guest.guest_index === 0;
          const isVerified = guest.verification_status === 'verified';

          return (
            <div key={guest.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider mb-0.5">
                    {isMain ? 'Main Guest' : `Guest ${guest.guest_index + 1}`}
                  </p>
                  <p className="text-white text-sm font-medium">{guest.name || (isMain ? 'You (Booker)' : 'Awaiting Guest')}</p>
                </div>
                <div>
                  {isVerified ? (
                    <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-mono uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                      <CheckCircle className="w-3 h-3" /> VERIFIED
                    </div>
                  ) : guest.verification_status === 'failed' ? (
                    <div className="flex items-center gap-1 text-red-400 text-[10px] font-mono uppercase tracking-wider bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">
                      <ShieldAlert className="w-3 h-3" /> REJECTED
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-400 text-[10px] font-mono uppercase tracking-wider bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                      <Clock className="w-3 h-3" /> PENDING
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/60">
                {isAdmin && !isVerified && (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus(guest.id, 'verified')}
                      className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-[10px] uppercase font-mono tracking-wider transition-colors cursor-pointer"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(guest.id, 'failed')}
                      className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-[10px] uppercase font-mono tracking-wider transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                  </>
                )}

                {!isAdmin && !isVerified && (
                  <>
                    {isMain ? (
                      <a 
                        href={bookingId ? `/booking/${bookingId}/verify` : getShareableLink(guest)}
                        className="flex-1 text-center bg-amber-400 hover:bg-white text-black font-bold text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-lg transition-colors cursor-pointer shadow-sm"
                      >
                        Upload ID Document
                      </a>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleCopy(guest)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] uppercase font-mono tracking-wider transition-colors cursor-pointer border border-zinc-700/60"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                        <button 
                          onClick={() => handleWhatsApp(guest)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg text-[10px] uppercase font-mono tracking-wider transition-colors cursor-pointer"
                          title="Share via WhatsApp"
                        >
                          <Share2 className="w-3 h-3" /> WhatsApp
                        </button>
                      </>
                    )}
                  </>
                )}

                {isVerified && (
                  <span className="text-[10px] text-zinc-500 font-mono italic">
                    Identity verified for police compliance
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
