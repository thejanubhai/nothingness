'use client';

import { cancelBooking } from '@/app/actions/booking';
import { Ban, AlertTriangle, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CancelBookingButton({ 
  bookingId, 
  bookingTitle,
  variant = 'dashboard',
  onCancelled
}: { 
  bookingId: string;
  bookingTitle?: string;
  variant?: 'dashboard' | 'admin';
  onCancelled?: (bookingId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirmCancel = async () => {
    setLoading(true);
    try {
      const res = await cancelBooking(bookingId);
      if (res && res.error) {
        toast.error('Cancellation Failed', { description: res.error });
        return;
      }
      toast.success('Reservation Cancelled', {
        description: 'Your reservation has been cancelled and the sanctuary dates released.',
      });
      setIsOpen(false);
      onCancelled?.(bookingId);
    } catch (err: any) {
      toast.error('Network Error', { description: err.message || 'Failed to cancel reservation' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {variant === 'admin' ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="text-[10px] font-semibold tracking-wider uppercase text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
        >
          Cancel Booking
        </button>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="text-[11px] font-semibold tracking-[0.1em] uppercase text-red-400 bg-red-500/10 px-4 py-2 rounded-xl hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Ban className="w-3.5 h-3.5" /> Cancel
        </button>
      )}

      {/* LUXURY IN-APP CONFIRMATION MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 text-left relative">
            
            {/* Close Button */}
            <button
              onClick={() => !loading && setIsOpen(false)}
              disabled={loading}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-900 transition-colors disabled:opacity-30"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Warning Icon & Heading */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-xl text-white font-bold">
                  Cancel Reservation?
                </h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {bookingTitle ? `Regarding "${bookingTitle}"` : 'Sanctuary Stay Cancellation'}
                </p>
              </div>
            </div>

            {/* Explanation Note */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs font-mono text-zinc-300 space-y-2 leading-relaxed">
              <p>
                Are you sure you want to cancel this reservation?
              </p>
              <p className="text-[11px] text-zinc-500">
                • The reserved dates will be immediately released for other members.
                <br />
                • Any date locks on connected external platforms (Airbnb, MMT) will be lifted.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsOpen(false)}
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Nevermind, Keep Stay
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    <span>Yes, Cancel Reservation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
