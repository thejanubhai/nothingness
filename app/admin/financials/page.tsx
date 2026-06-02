'use client';

import { ArrowDownToLine, TrendingUp, DollarSign, CreditCard, Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminFinancials() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingRevenue: 0,
    gstCollected: 0,
    totalBookings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();
      const { data: bookings } = await supabase.from('bookings').select('total_price, status, payment_status');
      
      if (bookings) {
        let totalRev = 0;
        let pendingRev = 0;
        let gst = 0;
        
        bookings.forEach(b => {
          if (b.payment_status === 'paid' && b.status !== 'cancelled') {
            totalRev += b.total_price;
            // Assuming 18% GST built into price for reporting
            gst += b.total_price - (b.total_price / 1.18);
          } else if (b.payment_status === 'pending' && b.status !== 'cancelled') {
            pendingRev += b.total_price;
          }
        });

        setStats({
          totalRevenue: totalRev,
          pendingRevenue: pendingRev,
          gstCollected: gst,
          totalBookings: bookings.filter(b => b.status !== 'cancelled').length
        });
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  const handleExportCSV = async () => {
    const supabase = createClient();
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*, spaces(title), guest_profiles(full_name)')
      .order('created_at', { ascending: false });

    if (!bookings) return;

    // Create CSV content
    const headers = ['Booking ID', 'Space', 'Guest', 'Check In', 'Check Out', 'Amount (INR)', 'Payment Status', 'Booking Status', 'GST (18%)'];
    const rows = bookings.map(b => [
      b.id,
      b.spaces?.title || 'Unknown',
      b.guest_profiles?.full_name || 'Unknown',
      new Date(b.check_in).toISOString().split('T')[0],
      new Date(b.check_out).toISOString().split('T')[0],
      b.total_price,
      b.payment_status,
      b.status,
      (b.total_price - (b.total_price / 1.18)).toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nothingness_financials_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl mb-2 text-white">Financials</h1>
          <p className="text-white/50 text-sm tracking-wide">Accounting and revenue dashboard.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <ArrowDownToLine className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Gross Revenue</p>
          <p className="text-3xl font-serif text-white">
            {loading ? '...' : `₹${stats.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          </p>
        </div>
        
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Pending Payouts</p>
          <p className="text-3xl font-serif text-white">
            {loading ? '...' : `₹${stats.pendingRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          </p>
        </div>
        
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Estimated GST (18%)</p>
          <p className="text-3xl font-serif text-white">
            {loading ? '...' : `₹${stats.gstCollected.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          </p>
        </div>
        
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Total Bookings</p>
          <p className="text-3xl font-serif text-white">
            {loading ? '...' : stats.totalBookings}
          </p>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8 text-center text-white/30 text-sm">
        <p>Charts and deep financial reporting will be integrated in Phase 2.</p>
        <p className="mt-2 text-xs">For now, use the Export CSV button to reconcile payments with your Cashfree dashboard.</p>
      </div>
    </div>
  );
}
