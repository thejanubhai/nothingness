'use client';

import { cancelBooking } from '@/app/actions/booking';
import { Ban } from 'lucide-react';
import { useState } from 'react';

export default function CancelBookingButton({ 
  bookingId, 
  variant = 'dashboard' 
}: { 
  bookingId: string;
  variant?: 'dashboard' | 'admin';
}) {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setLoading(true);
    await cancelBooking(bookingId);
    setLoading(false);
  };

  if (variant === 'admin') {
    return (
      <button 
        onClick={handleCancel}
        disabled={loading}
        className="text-[10px] font-semibold tracking-wider uppercase text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
      >
        {loading ? 'Cancelling...' : 'Cancel Booking'}
      </button>
    );
  }

  return (
    <button 
      onClick={handleCancel}
      disabled={loading}
      className="text-[11px] font-semibold tracking-[0.1em] uppercase text-red-400 bg-red-500/10 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
    >
      <Ban className="w-3 h-3" /> {loading ? 'Cancelling...' : 'Cancel'}
    </button>
  );
}
