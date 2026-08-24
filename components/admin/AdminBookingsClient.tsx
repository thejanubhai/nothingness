'use client';

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  Filter, Plus, Search, CheckCircle, Clock, ShieldAlert, ShieldCheck,
  Calendar, User, ArrowDownToLine, Phone, Mail, CheckCircle2,
  AlertTriangle, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import CancelBookingButton from '@/components/CancelBookingButton';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface BookingGuest {
  id: string;
  name?: string;
  verification_status?: string;
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
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
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

  const handleExportCSV = () => {
    const headers = ['Booking ID', 'Sanctuary', 'Guest Name', 'Check In', 'Check Out', 'Total (INR)', 'Status', 'Payment', 'Created'];
    const rows = filteredBookings.map(b => [
      b.id,
      b.spaces?.title || 'Unknown',
      b.guest_name || b.booking_guests?.[0]?.guest_profiles?.full_name || b.booking_guests?.[0]?.name || 'N/A',
      new Date(b.check_in).toISOString().split('T')[0],
      new Date(b.check_out).toISOString().split('T')[0],
      b.total_price,
      b.status,
      b.payment_status || 'paid',
      new Date(b.created_at).toISOString().split('T')[0]
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nothingness_reservations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-white">Bookings &amp; Reservations</h1>
          <p className="text-white/50 text-sm tracking-wide mt-1">
            Real-time reservation stream, Delhi Police guest protocols, and key access dispatch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <ArrowDownToLine className="w-4 h-4" /> Export CSV
          </button>

          <Link
            href="/admin/bookings/new"
            className="flex items-center gap-2 bg-accent-gold text-black px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white transition-all shadow-lg"
          >
            <Plus className="w-4 h-4" /> Add Reservation
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search reference, guest, sanctuary..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-accent-gold/50"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'checked_in', label: 'Checked In' },
            { id: 'completed', label: 'Completed' },
            { id: 'pending', label: 'Pending' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-accent-gold text-black font-bold shadow-md'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Stream List */}
      <div className="space-y-6">
        {filteredBookings.map((booking) => {
          const mainGuest = booking.booking_guests?.[0]?.guest_profiles?.full_name 
            || booking.booking_guests?.[0]?.name 
            || booking.guest_name 
            || 'Guest';
          const guestPhone = booking.booking_guests?.[0]?.guest_profiles?.phone_number || booking.guest_phone;
          const isVerified = booking.booking_guests?.some(g => g.verification_status === 'verified');

          return (
            <div key={booking.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex flex-col lg:flex-row gap-8 hover:border-white/10 transition-colors">
              
              {/* Left Column: Booking Info & Actions */}
              <div className="w-full lg:w-1/3 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-accent-gold uppercase font-mono tracking-widest block mb-1">
                      REF: {booking.id.split('-')[0].toUpperCase()}
                    </span>
                    <h3 className="text-xl font-serif text-white">{booking.spaces?.title || 'Sanctuary'}</h3>
                  </div>
                  <span className={`px-2.5 py-1 text-[9px] uppercase tracking-widest rounded-full font-mono border ${
                    booking.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    booking.status === 'checked_in' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    booking.status === 'completed' ? 'bg-zinc-800 text-zinc-300 border-zinc-700' :
                    booking.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    'bg-accent-gold/10 text-accent-gold border-accent-gold/20'
                  }`}>
                    {booking.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                  <div>
                    <p className="text-white/30 uppercase font-mono text-[9px] mb-0.5">Stay Dates</p>
                    <p className="text-white font-medium">
                      {format(new Date(booking.check_in), 'MMM dd')} - {format(new Date(booking.check_out), 'MMM dd')}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/30 uppercase font-mono text-[9px] mb-0.5">Total Tariff</p>
                    <p className="text-accent-gold font-bold font-mono">₹{Number(booking.total_price).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleUpdateStatus(booking.id, 'checked_in')}
                      disabled={updatingId === booking.id}
                      className="flex-1 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold rounded-lg text-xs transition-colors"
                    >
                      Check-In Guest
                    </button>
                  )}

                  {booking.status === 'checked_in' && (
                    <button
                      onClick={() => handleUpdateStatus(booking.id, 'completed')}
                      disabled={updatingId === booking.id}
                      className="flex-1 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 font-bold rounded-lg text-xs transition-colors"
                    >
                      Mark Check-Out
                    </button>
                  )}

                  {booking.status !== 'cancelled' && (
                    <CancelBookingButton variant="admin" bookingId={booking.id} />
                  )}
                </div>
              </div>

              {/* Right Column: Guest Protocol & ID Verification */}
              <div className="w-full lg:w-2/3 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Delhi Police Guest Compliance</p>
                  {isVerified ? (
                    <span className="flex items-center gap-1 text-[10px] text-green-400 font-mono">
                      <ShieldCheck className="w-3.5 h-3.5" /> 180-Day Vetted Guest
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                      <Clock className="w-3.5 h-3.5" /> ID Verification Pending
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {booking.booking_guests && booking.booking_guests.length > 0 ? (
                    booking.booking_guests.map((guest, idx) => (
                      <div key={guest.id || idx} className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex justify-between items-center">
                        <div className="min-w-0">
                          <p className="text-[9px] uppercase tracking-widest text-white/40 mb-0.5">
                            {guest.guest_index === 0 ? 'Primary Guest' : `Additional Guest ${guest.guest_index + 1}`}
                          </p>
                          <p className="text-white text-sm font-medium truncate">
                            {guest.guest_profiles?.full_name || guest.name || 'Awaiting Upload'}
                          </p>
                          {guest.guest_profiles?.document_number && (
                            <p className="text-white/40 text-[10px] font-mono mt-1">ID: {guest.guest_profiles.document_number}</p>
                          )}
                        </div>

                        <div>
                          {guest.verification_status === 'verified' ? (
                            <span className="flex items-center gap-1 text-green-400 text-[10px] font-bold uppercase tracking-wider bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20">
                              <CheckCircle2 className="w-3 h-3" /> OK
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-accent-gold text-[10px] font-bold uppercase tracking-wider bg-accent-gold/10 px-2 py-1 rounded-md border border-accent-gold/20">
                              <Clock className="w-3 h-3" /> PEND
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 bg-white/[0.01] border border-dashed border-white/10 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium text-sm">{mainGuest}</p>
                        {guestPhone && <p className="text-white/40 text-xs font-mono">{guestPhone}</p>}
                      </div>
                      <span className="text-xs text-white/30">Direct Guest Record</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-1">
                  <Link
                    href="/admin/guests/police-register"
                    className="text-[11px] text-accent-gold hover:text-white transition-colors"
                  >
                    View Official Delhi Police Register ↗
                  </Link>
                </div>
              </div>

            </div>
          );
        })}

        {filteredBookings.length === 0 && (
          <div className="text-center py-20 bg-white/[0.01] border border-white/5 rounded-3xl p-8 space-y-3">
            <Calendar className="w-10 h-10 text-white/20 mx-auto" />
            <p className="text-white/50 text-sm">No reservations matching your filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
