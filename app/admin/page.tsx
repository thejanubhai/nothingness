import { createClient } from "@/lib/supabase/server";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import Link from "next/link";
import { 
  ArrowRight, CheckCircle, ShieldAlert, Building2, 
  CalendarDays, Users, Sparkles, CreditCard, Settings,
  ShieldCheck, Clock, MessageSquare, Plus, DollarSign, Calendar
} from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = await createClient();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const now = new Date();
  const currentMonthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const currentMonthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
  
  // 1. Fetch bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id, total_price, status, payment_method, created_at, check_in, check_out, 
      guest_name, guest_phone,
      spaces(id, title)
    `)
    .order('created_at', { ascending: false })
    .limit(8);
    
  const { data: allBookings } = await supabase
    .from('bookings')
    .select('status, total_price, check_in, check_out, space_id');

  // 2. Fetch pending guest verifications
  const { count: pendingGuestVerifications } = await supabase
    .from('guest_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_verified', false);

  // 3. Fetch active spaces
  const { data: spacesData, count: totalSpaces } = await supabase
    .from('spaces')
    .select('id, title', { count: 'exact' });

  // 4. Fetch pending housekeeping tasks
  const { count: pendingHousekeeping } = await supabase
    .from('housekeeping_tasks')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'completed');

  // 4b. Fetch pending franchise leads and partner verifications
  const { count: newFranchiseLeads } = await supabase
    .from('franchise_leads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new');

  const { count: pendingPartnerVerifications } = await supabase
    .from('partner_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'under_review');

  // 5. Today's Movements
  const { data: todayArrivals } = await supabase
    .from('bookings')
    .select('id, guest_name, guest_phone, status, spaces(title)')
    .eq('check_in', todayStr)
    .neq('status', 'cancelled');

  const { data: todayDepartures } = await supabase
    .from('bookings')
    .select('id, guest_name, guest_phone, status, spaces(title)')
    .eq('check_out', todayStr)
    .neq('status', 'cancelled');

  // 6. Current Month Revenue & Occupancy Calculations (Item 12)
  const currentMonthBookings = allBookings 
    ? allBookings.filter(b => (b.status === 'confirmed' || b.status === 'completed' || b.status === 'checked_in') && (b.check_in <= currentMonthEnd && b.check_out >= currentMonthStart))
    : [];

  const currentMonthRevenue = currentMonthBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);

  const daysInCurrentMonth = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });
  let totalBookedNightsThisMonth = 0;
  daysInCurrentMonth.forEach(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const hasBooking = currentMonthBookings.some(b => b.check_in <= dayStr && b.check_out > dayStr);
    if (hasBooking) totalBookedNightsThisMonth++;
  });

  const totalSanctuariesCount = Math.max(totalSpaces || 1, 1);
  const possibleNights = daysInCurrentMonth.length * totalSanctuariesCount;
  const occupancyPercentage = Math.min(100, Math.round((totalBookedNightsThisMonth / possibleNights) * 100));

  const stats = [
    { label: `${format(now, 'MMMM')} Tariff`, value: `₹${currentMonthRevenue.toLocaleString('en-IN')}`, subtext: "Paid & Confirmed" },
    { label: `${format(now, 'MMMM')} Occupancy`, value: `${occupancyPercentage}%`, subtext: `${totalBookedNightsThisMonth} Nights Booked` },
    { label: "Active Sanctuaries", value: (totalSpaces || 0).toString(), subtext: "Managed Properties" },
    { label: "Operations Queue", value: ((pendingGuestVerifications || 0) + (pendingHousekeeping || 0)).toString(), subtext: "IDs & Turnovers Pending" }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl mb-1 text-white">Dashboard Command Center</h1>
          <p className="text-white/50 text-xs md:text-sm tracking-wide">Autonomous Operations, Channel Manager &amp; Hospitality Intelligence.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/calendar"
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2"
          >
            <CalendarDays className="w-4 h-4 text-accent-gold" />
            Master Calendar
          </Link>

          <Link
            href="/admin/bookings/new"
            className="px-4 py-2.5 bg-accent-gold hover:bg-white text-black rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xl flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New Booking
          </Link>
        </div>
      </div>

      {/* KPI Cards (Item 12) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl shadow-lg">
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-mono">{stat.label}</p>
            <h2 className="font-serif text-3xl text-white mb-1">{stat.value}</h2>
            <p className="text-[10px] text-accent-gold/80 font-mono">{stat.subtext}</p>
          </div>
        ))}
      </div>

      {/* TODAY'S MOVEMENTS WIDGET (Item 10) */}
      {((todayArrivals && todayArrivals.length > 0) || (todayDepartures && todayDepartures.length > 0)) && (
        <div className="bg-gradient-to-r from-accent-gold/10 via-white/[0.02] to-transparent border border-accent-gold/20 rounded-3xl p-5 md:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent-gold" />
              Today's Sanctuary Movements ({format(now, 'dd MMMM yyyy')})
            </h3>
            <span className="text-[10px] text-accent-gold font-mono">Live Dispatch</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Arrivals */}
            {todayArrivals?.map((b: any) => {
              const spaceTitle = Array.isArray(b.spaces) ? b.spaces[0]?.title : b.spaces?.title;
              const cleanDigits = (b.guest_phone || '').replace(/[^0-9]/g, '');
              const cleanPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
              const waText = `Namaste ${b.guest_name || 'Guest'}! ✨ Welcome to Nothingness (${spaceTitle || 'The Chamber'})...`;

              return (
                <div key={b.id} className="bg-black/50 border border-green-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs font-bold text-white">{b.guest_name || 'Guest'}</span>
                      <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-mono font-bold">
                        Arriving Today
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 font-mono mt-1">{spaceTitle} • {b.guest_phone || 'No phone'}</p>
                  </div>
                  {b.guest_phone && (
                    <a
                      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl transition-colors"
                      title="Send WhatsApp message"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>
                  )}
                </div>
              );
            })}

            {/* Departures */}
            {todayDepartures?.map((b: any) => {
              const spaceTitle = Array.isArray(b.spaces) ? b.spaces[0]?.title : b.spaces?.title;

              return (
                <div key={b.id} className="bg-black/50 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                      <span className="text-xs font-bold text-white">{b.guest_name || 'Guest'}</span>
                      <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-mono font-bold">
                        Departing Today
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 font-mono mt-1">{spaceTitle} • Turnover needed</p>
                  </div>
                  <Link
                    href="/admin/housekeeping"
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs uppercase font-mono transition-colors"
                  >
                    Turnover
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Launch Control Hub */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: "Master Calendar", href: "/admin/calendar", icon: CalendarDays, desc: "2-Way OTA Hub" },
          { label: "Sanctuaries", href: "/admin/spaces", icon: Building2, desc: "Property CRUD" },
          { label: "Franchise & Partners", href: "/admin/partners", icon: Sparkles, desc: "Leads & KYC" },
          { label: "Editorial Journal", href: "/admin/journal", icon: Sparkles, desc: "30 Articles & AI" },
          { label: "Bookings CRM", href: "/admin/bookings", icon: CalendarDays, desc: "Reservations" },
          { label: "Police Log", href: "/admin/guests/police-register", icon: ShieldCheck, desc: "Police Compliance" },
          { label: "Housekeeping", href: "/admin/housekeeping", icon: Sparkles, desc: "Turnover Dispatch" },
          { label: "Financials", href: "/admin/financials", icon: CreditCard, desc: "Ledger & GST" },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-accent-gold/30 p-4 rounded-2xl transition-all group block text-left shadow-lg"
          >
            <item.icon className="w-5 h-5 text-white/40 group-hover:text-accent-gold transition-colors mb-2" />
            <p className="text-xs font-bold text-white group-hover:text-accent-gold transition-colors">{item.label}</p>
            <p className="text-[10px] text-white/40 font-mono mt-0.5">{item.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Bookings Stream */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-serif text-xl text-white">Recent Reservations</h3>
            <Link href="/admin/bookings" className="text-xs text-accent-gold hover:text-white flex items-center gap-1 transition-colors font-mono">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {bookings && bookings.length > 0 ? bookings.map((booking: any) => {
              const spaceTitle = Array.isArray(booking.spaces) ? booking.spaces[0]?.title : booking.spaces?.title;

              return (
                <div key={booking.id} className="flex justify-between items-center p-3.5 hover:bg-white/5 rounded-2xl transition-colors border border-white/5">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white font-semibold">{booking.guest_name || spaceTitle || 'Sanctuary'}</p>
                      <span className="text-[10px] text-accent-gold font-mono uppercase">
                        {booking.id.split('-')[0]}
                      </span>
                      {booking.payment_method && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-mono font-bold">
                          {booking.payment_method}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/40 uppercase font-mono mt-0.5">
                      {format(new Date(booking.check_in), 'MMM dd')} - {format(new Date(booking.check_out), 'MMM dd, yyyy')} • {spaceTitle}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white font-bold font-mono">₹{Number(booking.total_price).toLocaleString('en-IN')}</p>
                    <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-md border font-mono ${
                      booking.status === 'confirmed' ? 'text-green-400 border-green-500/20 bg-green-500/10' :
                      booking.status === 'checked_in' ? 'text-blue-400 border-blue-500/20 bg-blue-500/10' :
                      booking.status === 'cancelled' ? 'text-red-400 border-red-500/20' :
                      'text-accent-gold border-accent-gold/20 bg-accent-gold/5'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-white/30 text-center py-8 font-mono">No recent bookings recorded.</p>
            )}
          </div>
        </div>

        {/* Attention Required / Operational Action Board */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-xl">
          <div>
            <h3 className="font-serif text-xl text-white mb-6">Operations Queue</h3>
            
            <div className="space-y-3">
              {(pendingPartnerVerifications || 0) > 0 && (
                <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-amber-400" />
                    <div>
                      <p className="text-xs text-white font-semibold">Partner NOC / KYC Audits</p>
                      <p className="text-[10px] text-amber-400/80 font-mono">{pendingPartnerVerifications} partner(s) awaiting verification</p>
                    </div>
                  </div>
                  <Link href="/admin/partners" className="text-xs bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-500/30 transition-colors font-bold font-mono">
                    Audit
                  </Link>
                </div>
              )}

              {(newFranchiseLeads || 0) > 0 && (
                <div className="flex items-center justify-between p-4 bg-accent-gold/10 border border-accent-gold/20 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-accent-gold" />
                    <div>
                      <p className="text-xs text-white font-semibold">New Franchise Applications</p>
                      <p className="text-[10px] text-accent-gold/80 font-mono">{newFranchiseLeads} new prospect inquiry</p>
                    </div>
                  </div>
                  <Link href="/admin/partners" className="text-xs bg-accent-gold text-black px-3 py-1.5 rounded-lg hover:bg-white transition-colors font-bold font-mono">
                    View
                  </Link>
                </div>
              )}

              {(pendingGuestVerifications || 0) > 0 && (
                <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-amber-400" />
                    <div>
                      <p className="text-xs text-white font-semibold">Pending Guest ID Vetting</p>
                      <p className="text-[10px] text-amber-400/80 font-mono">{pendingGuestVerifications} guest(s) awaiting approval</p>
                    </div>
                  </div>
                  <Link href="/admin/guests" className="text-xs bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-500/30 transition-colors font-bold font-mono">
                    Review
                  </Link>
                </div>
              )}

              {(pendingHousekeeping || 0) > 0 && (
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-accent-gold" />
                    <div>
                      <p className="text-xs text-white font-semibold">Scheduled Cleanings</p>
                      <p className="text-[10px] text-white/50 font-mono">{pendingHousekeeping} turnover task(s) active</p>
                    </div>
                  </div>
                  <Link href="/admin/housekeeping" className="text-xs bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors font-mono">
                    View
                  </Link>
                </div>
              )}
              
              {!pendingGuestVerifications && !pendingHousekeeping && !pendingPartnerVerifications && !newFranchiseLeads && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CheckCircle className="w-8 h-8 text-green-500/50 mb-3" />
                  <p className="text-sm text-white/50 font-mono">All systems operating smoothly.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 mt-6">
            <Link
              href="/admin/settings"
              className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-white/70 hover:text-white transition-colors uppercase font-mono font-semibold"
            >
              <Settings className="w-4 h-4 text-accent-gold" />
              Configure System Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
