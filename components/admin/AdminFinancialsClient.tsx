'use client';

import React, { useState, useMemo } from 'react';
import { 
  ArrowDownToLine, TrendingUp, DollarSign, CreditCard, 
  Building2, Percent, Search, CheckCircle2, Clock, 
  Calendar, ShieldCheck, ArrowUpRight
} from 'lucide-react';
import { format } from 'date-fns';
import AdminPageHeader from '@/components/admin/ui/AdminPageHeader';
import AdminMetricCard from '@/components/admin/ui/AdminMetricCard';

interface Booking {
  id: string;
  space_id: string;
  total_price: number;
  status: string;
  payment_status?: string;
  check_in: string;
  check_out: string;
  created_at: string;
  spaces?: {
    id: string;
    title: string;
  };
  guest_profiles?: {
    full_name: string;
  };
  guest_name?: string;
}

interface SpaceStat {
  id: string;
  title: string;
  totalBookings: number;
  grossRevenue: number;
  gstAmount: number;
  netRevenue: number;
}

export default function AdminFinancialsClient({ initialBookings }: { initialBookings: Booking[] }) {
  const [bookings] = useState<Booking[]>(initialBookings);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');

  // Compute Overall Totals
  const { grossRevenue, pendingRevenue, gstCollected, netRevenue, totalBookingsCount } = useMemo(() => {
    let gross = 0;
    let pending = 0;
    let gst = 0;
    let net = 0;
    let count = 0;

    bookings.forEach(b => {
      if (b.status !== 'cancelled') {
        const price = Number(b.total_price) || 0;
        count++;
        if (b.payment_status === 'paid' || b.status === 'confirmed' || b.status === 'completed' || b.status === 'checked_in') {
          gross += price;
          const gstPortion = price - (price / 1.18);
          gst += gstPortion;
          net += (price - gstPortion);
        } else if (b.payment_status === 'pending') {
          pending += price;
        }
      }
    });

    return {
      grossRevenue: gross,
      pendingRevenue: pending,
      gstCollected: gst,
      netRevenue: net,
      totalBookingsCount: count
    };
  }, [bookings]);

  // Compute Space-by-Space Breakdown
  const spaceBreakdown = useMemo(() => {
    const map = new Map<string, SpaceStat>();

    bookings.forEach(b => {
      if (b.status === 'cancelled') return;
      const spaceId = b.space_id || 'unknown';
      const spaceTitle = b.spaces?.title || 'Sanctuary Space';
      const price = Number(b.total_price) || 0;
      const gstPortion = price - (price / 1.18);

      if (!map.has(spaceId)) {
        map.set(spaceId, {
          id: spaceId,
          title: spaceTitle,
          totalBookings: 0,
          grossRevenue: 0,
          gstAmount: 0,
          netRevenue: 0
        });
      }

      const entry = map.get(spaceId)!;
      entry.totalBookings += 1;
      entry.grossRevenue += price;
      entry.gstAmount += gstPortion;
      entry.netRevenue += (price - gstPortion);
    });

    return Array.from(map.values());
  }, [bookings]);

  // Filtered Transactions
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const isPaid = b.payment_status === 'paid' || b.status === 'confirmed' || b.status === 'completed';
      const isFailed = b.payment_status === 'failed';
      const matchesFilter = statusFilter === 'all' 
        || (statusFilter === 'paid' && isPaid)
        || (statusFilter === 'failed' && isFailed)
        || (statusFilter === 'pending' && !isPaid && !isFailed);

      const space = (b.spaces?.title || '').toLowerCase();
      const guest = (b.guest_profiles?.full_name || b.guest_name || '').toLowerCase();
      const ref = b.id.toLowerCase();
      const query = searchTerm.toLowerCase();

      const matchesSearch = !searchTerm || space.includes(query) || guest.includes(query) || ref.includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [bookings, statusFilter, searchTerm]);

  const handleExportCSV = () => {
    const headers = ['Booking Reference', 'Sanctuary', 'Guest Name', 'Check In', 'Check Out', 'Gross Tariff (INR)', 'GST 18% (INR)', 'Net Revenue (INR)', 'Payment Status', 'Booking Status'];
    const rows = filteredBookings.map(b => {
      const gross = Number(b.total_price) || 0;
      const gst = gross - (gross / 1.18);
      const net = gross - gst;
      return [
        b.id,
        b.spaces?.title || 'Unknown',
        b.guest_profiles?.full_name || b.guest_name || 'Direct Guest',
        new Date(b.check_in).toISOString().split('T')[0],
        new Date(b.check_out).toISOString().split('T')[0],
        gross.toFixed(2),
        gst.toFixed(2),
        net.toFixed(2),
        b.payment_status || 'paid',
        b.status
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nothingness_financial_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Unified Luxury Header */}
      <AdminPageHeader
        title="Financials & Settlements"
        description="Reconciliation ledger, 18% GST statutory tax liability, and space-by-space revenue distribution."
        badge="GSTR-3B"
        badgeVariant="emerald"
        actions={
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-accent-gold hover:bg-white text-black px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-lg cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Export Ledger (CSV)
          </button>
        }
      />

      {/* Unified KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminMetricCard
          label="Gross Revenue"
          value={`₹${grossRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtext={`${totalBookingsCount} Reservations Recorded`}
          icon={DollarSign}
          highlightColor="emerald"
        />

        <AdminMetricCard
          label="Net Operating Income"
          value={`₹${netRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtext="Excluding 18% GST"
          icon={TrendingUp}
          highlightColor="gold"
        />

        <AdminMetricCard
          label="Estimated GST (18%)"
          value={`₹${gstCollected.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtext="Form GSTR-3B Statutory Output"
          icon={Percent}
          highlightColor="purple"
        />

        <AdminMetricCard
          label="Pending Settlement"
          value={`₹${pendingRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtext="Awaiting Gateway Payout"
          icon={CreditCard}
          highlightColor={pendingRevenue > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* Space-by-Space Distribution */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-accent-gold" />
            <h2 className="font-serif text-xl text-white">Revenue by Sanctuary Space</h2>
          </div>
          <span className="text-xs text-white/40 font-mono">{spaceBreakdown.length} Sanctuaries</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaceBreakdown.map((space) => (
            <div key={space.id} className="bg-white/[0.01] border border-white/10 rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-serif text-lg text-white">{space.title}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/70 font-mono">
                  {space.totalBookings} stays
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/40">Gross Revenue:</span>
                  <span className="text-white font-mono font-semibold">₹{space.grossRevenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">GST (18%):</span>
                  <span className="text-white/60 font-mono">₹{space.gstAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-1">
                  <span className="text-white/40">Net Share:</span>
                  <span className="text-accent-gold font-mono font-bold">₹{space.netRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            </div>
          ))}

          {spaceBreakdown.length === 0 && (
            <p className="text-xs text-white/30 italic col-span-3 py-4 text-center">No revenue recorded yet across spaces.</p>
          )}
        </div>
      </div>

      {/* Detailed Ledger Transactions Table */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden space-y-4">
        <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-xl text-white">Settlement &amp; Transaction Ledger</h3>
            <p className="text-xs text-white/40 mt-0.5">Direct matching with your PayU and bank settlements.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10 font-mono text-[11px]">
              {(['all', 'paid', 'pending', 'failed'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-colors cursor-pointer ${
                    statusFilter === filter
                      ? filter === 'failed'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : filter === 'paid'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : filter === 'pending'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-accent-gold text-black'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search reference, space, guest..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-accent-gold/50 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.01] border-b border-white/10 text-[10px] uppercase tracking-widest text-white/40">
              <tr>
                <th className="px-6 py-4 font-medium">Reference</th>
                <th className="px-6 py-4 font-medium">Sanctuary</th>
                <th className="px-6 py-4 font-medium">Stay Period</th>
                <th className="px-6 py-4 font-medium">Gross Tariff</th>
                <th className="px-6 py-4 font-medium">GST (18%)</th>
                <th className="px-6 py-4 font-medium">Net Revenue</th>
                <th className="px-6 py-4 font-medium">Settlement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredBookings.map((booking) => {
                const gross = Number(booking.total_price) || 0;
                const gst = gross - (gross / 1.18);
                const net = gross - gst;
                const isPaid = booking.payment_status === 'paid' || booking.status === 'confirmed' || booking.status === 'completed';

                return (
                  <tr key={booking.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-accent-gold font-bold">
                      {booking.id.split('-')[0].toUpperCase()}
                    </td>

                    <td className="px-6 py-4 font-sans text-white font-medium">
                      {booking.spaces?.title || 'Sanctuary'}
                    </td>

                    <td className="px-6 py-4 text-white/60">
                      {format(new Date(booking.check_in), 'MMM dd')} - {format(new Date(booking.check_out), 'MMM dd')}
                    </td>

                    <td className="px-6 py-4 text-white font-bold">
                      ₹{gross.toLocaleString('en-IN')}
                    </td>

                    <td className="px-6 py-4 text-white/50">
                      ₹{gst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>

                    <td className="px-6 py-4 text-accent-gold">
                      ₹{net.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>

                    <td className="px-6 py-4">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" /> Settled / Paid
                        </span>
                      ) : booking.payment_status === 'failed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] uppercase tracking-wider">
                          <Clock className="w-3 h-3" /> Payment Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] uppercase tracking-wider">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-white/30 font-sans">
                    No transactions found matching your search.
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
