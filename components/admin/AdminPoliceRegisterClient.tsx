'use client';

import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, Download, UserCheck, ArrowLeft, FileText, 
  Globe, Calendar, Search, Filter, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from 'date-fns';

interface GuestRecord {
  id: string;
  full_name: string;
  phone_number?: string;
  phone?: string;
  id_document_type?: string;
  document_number?: string;
  permanent_address?: string;
  dob?: string;
  is_foreign_national?: boolean;
  nationality?: string;
  visa_number?: string;
  is_verified?: boolean;
  verification_timestamp?: string;
  photo_url?: string;
  id_front_url?: string;
  id_document_url?: string;
  created_at: string;
  booking_guests?: any[];
}

export default function AdminPoliceRegisterClient({ initialGuests }: { initialGuests: GuestRecord[] }) {
  const [guests, setGuests] = useState<GuestRecord[]>(initialGuests);
  const [filterType, setFilterType] = useState<'all' | 'indian' | 'foreign'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Date Range State
  const [fromDate, setFromDate] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState<string>(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [useDateFilter, setUseDateFilter] = useState(false);

  // Apply Presets
  const applyPreset = (preset: 'thisMonth' | 'lastMonth' | 'all') => {
    const now = new Date();
    if (preset === 'thisMonth') {
      setFromDate(format(startOfMonth(now), 'yyyy-MM-dd'));
      setToDate(format(endOfMonth(now), 'yyyy-MM-dd'));
      setUseDateFilter(true);
    } else if (preset === 'lastMonth') {
      const prev = subMonths(now, 1);
      setFromDate(format(startOfMonth(prev), 'yyyy-MM-dd'));
      setToDate(format(endOfMonth(prev), 'yyyy-MM-dd'));
      setUseDateFilter(true);
    } else {
      setUseDateFilter(false);
    }
  };

  const filteredGuests = useMemo(() => {
    return guests.filter(g => {
      // Type filter
      if (filterType === 'indian' && g.is_foreign_national) return false;
      if (filterType === 'foreign' && !g.is_foreign_national) return false;

      // Search filter
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const name = (g.full_name || '').toLowerCase();
        const doc = (g.document_number || '').toLowerCase();
        const nat = (g.nationality || '').toLowerCase();
        if (!name.includes(q) && !doc.includes(q) && !nat.includes(q)) return false;
      }

      // Date Range filter
      if (useDateFilter && (fromDate || toDate)) {
        const recordDate = g.verification_timestamp ? g.verification_timestamp.split('T')[0] : g.created_at.split('T')[0];
        if (fromDate && recordDate < fromDate) return false;
        if (toDate && recordDate > toDate) return false;
      }

      return true;
    });
  }, [guests, filterType, searchTerm, useDateFilter, fromDate, toDate]);

  const totalVerified = filteredGuests.filter(g => g.is_verified).length;
  const foreignNationals = filteredGuests.filter(g => g.is_foreign_national).length;

  const exportUrl = useMemo(() => {
    let url = '/api/admin/police-register/export';
    if (useDateFilter && fromDate && toDate) {
      url += `?from=${fromDate}&to=${toDate}`;
    }
    return url;
  }, [useDateFilter, fromDate, toDate]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/guests" className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-white/50 hover:text-white border border-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] uppercase font-mono tracking-wider">
                Official Law Enforcement Format
              </span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl text-white">Police Compliance Guest Register</h1>
            <p className="text-white/50 text-xs md:text-sm tracking-wide mt-0.5">
              Guest check-in records formatted for Police station submission &amp; Form C foreign national compliance.
            </p>
          </div>
        </div>

        <a
          href={exportUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 bg-accent-gold hover:bg-white text-black px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xl whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          Export Police Report ({useDateFilter ? `${fromDate} to ${toDate}` : 'All Dates'})
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-mono">Compliant Filtered Records</p>
          <p className="text-2xl font-serif text-white flex items-center justify-between">
            {totalVerified}
            <ShieldCheck className="w-5 h-5 text-green-400" />
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-mono">Foreign Nationals (Form C)</p>
          <p className="text-2xl font-serif text-accent-gold flex items-center justify-between">
            {foreignNationals}
            <Globe className="w-5 h-5 text-accent-gold/60" />
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-mono">Compliance Standard</p>
          <p className="text-xs font-medium text-green-400 mt-2 flex items-center gap-1.5 font-mono">
            ✓ 18+ ID Checked • 180-Day Vetted
          </p>
        </div>
      </div>

      {/* Filter & Date-Range Controls */}
      <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-5 md:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, document ID, country..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-accent-gold font-mono"
            />
          </div>

          {/* Type Segmented Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                filterType === 'all' ? 'bg-accent-gold text-black font-bold' : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              All ({guests.length})
            </button>
            <button
              onClick={() => setFilterType('indian')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                filterType === 'indian' ? 'bg-green-500/20 text-green-400 border border-green-500/30 font-bold' : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              🇮🇳 Indian Residents ({guests.filter(g => !g.is_foreign_national).length})
            </button>
            <button
              onClick={() => setFilterType('foreign')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                filterType === 'foreign' ? 'bg-accent-gold/20 text-accent-gold border border-accent-gold/30 font-bold' : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              🌐 Form C Foreigners ({guests.filter(g => g.is_foreign_national).length})
            </button>
          </div>
        </div>

        {/* Date Range Picker Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/5 text-xs font-mono">
          <span className="text-white/50 uppercase tracking-widest text-[10px]">Filter by Date:</span>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setUseDateFilter(true);
              }}
              className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-accent-gold"
            />
            <span className="text-white/30">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setUseDateFilter(true);
              }}
              className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-accent-gold"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyPreset('thisMonth')}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-white/70 hover:text-white text-[11px]"
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => applyPreset('lastMonth')}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-white/70 hover:text-white text-[11px]"
            >
              Last Month
            </button>
            <button
              type="button"
              onClick={() => applyPreset('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] ${
                !useDateFilter ? 'bg-accent-gold text-black font-bold' : 'bg-white/5 text-white/70 hover:text-white'
              }`}
            >
              All Dates
            </button>
          </div>
        </div>
      </div>

      {/* Register Table */}
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xs font-semibold text-white uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent-gold" />
            Digital Police Guest Log ({filteredGuests.length} Records)
          </h2>
          <span className="text-[10px] text-green-400 font-mono flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live Sync
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.01] border-b border-white/5 text-[10px] uppercase tracking-widest text-white/40">
              <tr>
                <th className="px-6 py-4 font-medium">Guest Name &amp; DOB</th>
                <th className="px-6 py-4 font-medium">ID Document</th>
                <th className="px-6 py-4 font-medium">Permanent Residential Address</th>
                <th className="px-6 py-4 font-medium">Nationality / Form C</th>
                <th className="px-6 py-4 font-medium">Verification Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredGuests.map((guest) => (
                <tr key={guest.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-10 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 flex items-center justify-center">
                        {guest.photo_url ? (
                          <img src={guest.photo_url} alt={guest.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <UserCheck className="w-4 h-4 text-zinc-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{guest.full_name}</p>
                        {guest.dob && <p className="text-white/40 text-[10px] mt-0.5 font-mono">DOB: {guest.dob}</p>}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-mono">
                    <p className="text-white/90">{guest.id_document_type}</p>
                    <p className="text-white/40 text-[10px] mt-0.5">{guest.document_number || 'Recorded'}</p>
                  </td>

                  <td className="px-6 py-4 max-w-xs truncate text-white/70">
                    {guest.permanent_address || 'Address recorded on ID'}
                  </td>

                  <td className="px-6 py-4">
                    {guest.is_foreign_national ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-gold/10 text-accent-gold border border-accent-gold/20 text-[10px] uppercase tracking-wider font-mono">
                        <Globe className="w-3 h-3" /> Form C ({guest.nationality || 'Foreign'})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] uppercase tracking-wider font-mono">
                        <UserCheck className="w-3 h-3" /> Indian Resident
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-white/40 font-mono text-[10px]">
                    {guest.verification_timestamp 
                      ? format(new Date(guest.verification_timestamp), 'MMM dd, yyyy HH:mm')
                      : format(new Date(guest.created_at), 'MMM dd, yyyy')}
                  </td>
                </tr>
              ))}

              {filteredGuests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/30 font-mono text-xs">
                    No verified guest check-in records found for this filter.
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
