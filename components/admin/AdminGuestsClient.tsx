'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, UserCheck, UserX, Plus, ShieldCheck, 
  FileText, Download, Clock, Phone, MapPin, Eye, CheckCircle2, XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface GuestProfile {
  id: string;
  full_name: string;
  phone_number?: string;
  id_document_type: string;
  document_number: string;
  is_verified: boolean;
  permanent_address?: string;
  dob?: string;
  is_foreign_national?: boolean;
  verification_timestamp?: string;
  created_at: string;
  id_front_url?: string;
  id_back_url?: string;
  booking_guests?: Array<{
    bookings?: {
      id: string;
      check_in: string;
      check_out: string;
      spaces?: {
        title: string;
      };
    };
  }>;
}

export default function AdminGuestsClient({ initialGuests }: { initialGuests: GuestProfile[] }) {
  const router = useRouter();
  const [guests, setGuests] = useState<GuestProfile[]>(initialGuests);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [selectedGuest, setSelectedGuest] = useState<GuestProfile | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredGuests = useMemo(() => {
    return guests.filter(g => {
      const matchesStatus = statusFilter === 'all' 
        || (statusFilter === 'verified' && g.is_verified)
        || (statusFilter === 'unverified' && !g.is_verified);

      const name = (g.full_name || '').toLowerCase();
      const phone = (g.phone_number || '').toLowerCase();
      const doc = (g.document_number || '').toLowerCase();
      const query = searchTerm.toLowerCase();

      const matchesSearch = !searchTerm || name.includes(query) || phone.includes(query) || doc.includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [guests, statusFilter, searchTerm]);

  const handleVerifyGuest = async (guestId: string, isVerified: boolean) => {
    setProcessingId(guestId);
    try {
      const res = await fetch('/api/admin/verify-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_profile_id: guestId, is_verified: isVerified })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(isVerified ? 'Guest marked as Verified for 180 days!' : 'Guest marked as Unverified');
        setGuests(prev => prev.map(g => g.id === guestId ? { ...g, is_verified: isVerified } : g));
        if (selectedGuest && selectedGuest.id === guestId) {
          setSelectedGuest(prev => prev ? { ...prev, is_verified: isVerified } : null);
        }
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to update verification');
      }
    } catch {
      toast.error('Network error updating verification');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-white">Guest CRM &amp; Police Compliance</h1>
          <p className="text-white/50 text-sm tracking-wide mt-1">
            Police verified guest registry, 180-day reusable vetting, and Form C foreign records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/guests/police-register"
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <FileText className="w-4 h-4 text-accent-gold" />
            Police Register
          </Link>

          <Link
            href="/admin/guests/new"
            className="flex items-center gap-2 bg-accent-gold text-black px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white transition-all shadow-lg"
          >
            <Plus className="w-4 h-4" /> Add Guest
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Total Registered Guests</p>
          <p className="text-2xl font-serif text-white">{guests.length}</p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">180-Day Vetted Guests</p>
          <p className="text-2xl font-serif text-green-400 flex items-center justify-between">
            {guests.filter(g => g.is_verified).length}
            <ShieldCheck className="w-5 h-5 text-green-400/60" />
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Pending Review</p>
          <p className="text-2xl font-serif text-amber-400 flex items-center justify-between">
            {guests.filter(g => !g.is_verified).length}
            <Clock className="w-5 h-5 text-amber-400/60" />
          </p>
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
            placeholder="Search by name, phone, document ID..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-accent-gold/50"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              statusFilter === 'all' ? 'bg-accent-gold text-black font-bold' : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            All ({guests.length})
          </button>
          <button
            onClick={() => setStatusFilter('verified')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              statusFilter === 'verified' ? 'bg-green-500/20 text-green-400 border border-green-500/30 font-bold' : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            Verified ({guests.filter(g => g.is_verified).length})
          </button>
          <button
            onClick={() => setStatusFilter('unverified')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              statusFilter === 'unverified' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold' : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            Pending Review ({guests.filter(g => !g.is_verified).length})
          </button>
        </div>
      </div>

      {/* Guests Table */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.01] border-b border-white/10 text-[10px] uppercase tracking-widest text-white/40">
              <tr>
                <th className="px-6 py-4 font-medium">Guest Full Name</th>
                <th className="px-6 py-4 font-medium">ID Document</th>
                <th className="px-6 py-4 font-medium">Verification Status</th>
                <th className="px-6 py-4 font-medium">Total Stays</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredGuests.map((guest) => (
                <tr key={guest.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{guest.full_name}</p>
                    {guest.phone_number && (
                      <p className="text-white/40 text-xs font-mono mt-0.5">{guest.phone_number}</p>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-white/90 text-xs uppercase font-mono">{guest.id_document_type}</p>
                    <p className="text-white/40 text-[11px] font-mono mt-0.5">{guest.document_number}</p>
                  </td>

                  <td className="px-6 py-4">
                    {guest.is_verified ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 180-Day Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono">
                        <Clock className="w-3.5 h-3.5" /> Pending Review
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-xs text-white/60 font-mono">
                    {guest.booking_guests?.length || 0} stay(s)
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {!guest.is_verified ? (
                        <button
                          onClick={() => handleVerifyGuest(guest.id, true)}
                          disabled={processingId === guest.id}
                          className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          Approve ID
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerifyGuest(guest.id, false)}
                          disabled={processingId === guest.id}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          Revoke
                        </button>
                      )}

                      <Link
                        href={`/admin/guests/${guest.id}`}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg text-xs transition-colors border border-white/10"
                      >
                        View Profile
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredGuests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/30 text-xs">
                    No guest profiles found matching your search.
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
