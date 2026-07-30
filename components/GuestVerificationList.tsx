'use client';

import { CheckCircle, Clock, Copy, ShieldAlert, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function GuestVerificationList({ guests, siteUrl }: { guests: any[], siteUrl: string }) {
  if (!guests || guests.length === 0) return null;

  const handleCopy = (id: string) => {
    const link = `${siteUrl}/verify-guest/${id}`;
    navigator.clipboard.writeText(link);
    toast.success('Link Copied', {
      description: 'Send this securely to your guest.'
    });
  };

  const handleWhatsApp = (id: string) => {
    const link = `${siteUrl}/verify-guest/${id}`;
    const text = encodeURIComponent(`Please verify your identity for our upcoming stay at Nothingness: ${link}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
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
    <div className="mt-6 pt-6 border-t border-white/5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-4">Guest Roster & Verification</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {guests.map((guest: any) => (
          <div key={guest.id} className="bg-white/[0.01] border border-white/5 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">
                  {guest.guest_index === 0 ? 'Main Guest' : `Guest ${guest.guest_index + 1}`}
                </p>
                <p className="text-white text-sm">{guest.name || 'Awaiting Upload'}</p>
              </div>
              <div>
                {guest.verification_status === 'verified' ? (
                  <div className="flex items-center gap-1 text-green-400 text-[10px] uppercase tracking-wider bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20">
                    <CheckCircle className="w-3 h-3" /> VERIFIED
                  </div>
                ) : guest.verification_status === 'failed' ? (
                  <div className="flex items-center gap-1 text-red-400 text-[10px] uppercase tracking-wider bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">
                    <ShieldAlert className="w-3 h-3" /> REJECTED
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-accent-gold text-[10px] uppercase tracking-wider bg-accent-gold/10 px-2 py-1 rounded-md border border-accent-gold/20">
                    <Clock className="w-3 h-3" /> PENDING
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-1">
              {guest.verification_status !== 'verified' && (
                <>
                  <button 
                    onClick={() => handleUpdateStatus(guest.id, 'verified')}
                    className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-colors"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(guest.id, 'failed')}
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-colors"
                  >
                    Reject
                  </button>
                </>
              )}
              <button 
                onClick={() => handleCopy(guest.id)}
                className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-colors"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
              <button 
                onClick={() => handleWhatsApp(guest.id)}
                className="flex items-center justify-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-colors"
                title="Share via WhatsApp"
              >
                <Share2 className="w-3 h-3" /> WhatsApp
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
