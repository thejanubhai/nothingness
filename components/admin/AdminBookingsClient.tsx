'use client';

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  Filter, Plus, Search, CheckCircle, Clock, ShieldAlert, ShieldCheck,
  Calendar, User, ArrowDownToLine, Phone, Mail, CheckCircle2,
  AlertTriangle, RefreshCw, MessageSquare, Share2
} from 'lucide-react';
import Link from 'next/link';
import CancelBookingButton from '@/components/CancelBookingButton';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface BookingGuest {
  id: string;
  name?: string;
  phone?: string;
  verification_status?: string;
  payment_status?: string;
  payment_amount?: number;
  paid_at?: string;
  is_primary?: boolean;
  guest_index: number;
  guest_profiles?: {
    full_name?: string;
    document_number?: string;
    is_verified?: boolean;
    phone_number?: string;
  };
}

interface Booking {
  id: string;
  space_id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string;
  payment_status?: string;
  payment_method?: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  guests?: number;
  default_guests?: number;
  additional_guests_count?: number;
  additional_guest_payment_mode?: string;
  additional_guest_total_amount?: number;
  created_at: string;
  spaces?: {
    title: string;
  };
  booking_guests?: BookingGuest[];
}

export default function AdminBookingsClient({ initialBookings }: { initialBookings: Booking[] }) {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      const ref = b.id.toLowerCase();
      const space = (b.spaces?.title || '').toLowerCase();
      const guest = (b.guest_name || b.booking_guests?.[0]?.name || b.booking_guests?.[0]?.guest_profiles?.full_name || '').toLowerCase();
      const query = searchTerm.toLowerCase();

      const matchesSearch = !searchTerm || ref.includes(query) || space.includes(query) || guest.includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [bookings, statusFilter, searchTerm]);

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingId(bookingId);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Booking status updated to ${newStatus}`);
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch {
      toast.error('Error updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  const shareVerificationWhatsApp = (b: Booking) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nothingness.asia';
    const inviteUrl = `${origin}/verify-guest/invite?booking=${b.id}`;
    const message = `Namaste ${b.guest_name || 'Guest'}! ✨ Regarding your reservation at Nothingness (${b.spaces?.title || 'Sanctuary'}).\n\nPlease complete your quick 30-second digital ID check-in here:\n${inviteUrl}`;
    
    if (b.guest_phone) {
      const cleanDigits = b.guest_phone.replace(/[^0-9]/g, '');
      const cleanPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
    toast.success('Opened WhatsApp with digital check-in invite link!');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-white">Reservations &amp; Multi-Guest Registry</h1>
          <p className="text-white/50 text-xs md:text-sm tracking-wide mt-1">
            Manage confirmed stays, track payment modes (UPI / Cash / OTA), and dispatch WhatsApp digital verification links.
          </p>
        </div>

        <Link
          href="/admin/bookings/new"
          className="flex items-center gap-2 bg-accent-gold hover:bg-white text-black px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xl"
        >
          <Plus className="w-4 h-4" /> Add Reservation
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, guest name, sanctuary..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-accent-gold font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {['all', 'confirmed', 'checked_in', 'completed', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all ${
                statusFilter === st ? 'bg-accent-gold text-black font-bold' : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              {st === 'all' ? `All (${bookings.length})` : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.01] border-b border-white/10 text-[10px] uppercase tracking-widest text-white/40">
              <tr>
                <th className="px-6 py-4 font-medium">Sanctuary &amp; ID</th>
                <th className="px-6 py-4 font-medium">Guest &amp; Contact</th>
                <th className="px-6 py-4 font-medium">Stay Dates</th>
                <th className="px-6 py-4 font-medium">Tariff &amp; Payment Mode</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">WhatsApp Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredBookings.map((b) => {
                const guestName = b.guest_name || b.booking_guests?.[0]?.name || 'Guest';
                const guestPhone = b.guest_phone || b.booking_guests?.[0]?.phone;

                return (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white font-semibold text-sm">{b.spaces?.title || 'Sanctuary'}</p>
                      <p className="text-white/40 font-mono text-[10px] mt-0.5">{b.id.slice(0, 8)}</p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{guestName}</p>
                      {guestPhone && <p className="text-white/40 font-mono text-[11px] mt-0.5">{guestPhone}</p>}
                    </td>

                    <td className="px-6 py-4 font-mono text-white/80">
                      {format(new Date(b.check_in), 'MMM dd')} → {format(new Date(b.check_out), 'MMM dd, yyyy')}
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-white font-bold font-mono text-sm">₹{Number(b.total_price || 0).toLocaleString('en-IN')}</p>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 font-mono text-[10px] uppercase font-bold">
                        {b.payment_method || 'UPI'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-mono border ${
                        b.status === 'confirmed' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                        b.status === 'checked_in' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                        b.status === 'cancelled' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                        'text-accent-gold bg-accent-gold/10 border-accent-gold/20'
                      }`}>
                        {b.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => shareVerificationWhatsApp(b)}
                        className="px-3 py-1.5 bg-accent-gold/15 hover:bg-accent-gold/25 text-accent-gold border border-accent-gold/30 rounded-lg font-mono text-[11px] flex items-center gap-1.5 transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" /> WhatsApp ID Link
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-white/30 font-mono">
                    No reservations found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
