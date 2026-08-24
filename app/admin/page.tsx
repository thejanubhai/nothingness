import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import Link from "next/link";
import { 
  ArrowRight, CheckCircle, ShieldAlert, Building2, 
  CalendarDays, Users, Sparkles, CreditCard, Settings,
  ShieldCheck, Clock
} from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = await createClient();
  
  // 1. Fetch bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, total_price, status, created_at, check_in, check_out, guest_name, spaces(title)')
    .order('created_at', { ascending: false })
    .limit(8);
    
  const { data: allBookings } = await supabase
    .from('bookings')
    .select('status, total_price, check_in, check_out');

  // 2. Fetch pending guest verifications
  const { count: pendingGuestVerifications } = await supabase
    .from('guest_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_verified', false);

  // 3. Fetch active spaces
  const { count: totalSpaces } = await supabase
    .from('spaces')
    .select('*', { count: 'exact', head: true });

  // 4. Fetch pending housekeeping tasks
  const { count: pendingHousekeeping } = await supabase
    .from('housekeeping_tasks')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'completed');

  const totalRevenue = allBookings 
    ? allBookings.filter(b => b.status === 'confirmed' || b.status === 'completed' || b.status === 'checked_in').reduce((sum, b) => sum + Number(b.total_price), 0) 
    : 0;
    
  const activeBookings = allBookings 
    ? allBookings.filter(b => b.status === 'confirmed' || b.status === 'checked_in').length 
    : 0;

  const stats = [
    { label: "Gross Revenue", value: `₹${totalRevenue.toLocaleString('en-IN')}`, subtext: "Paid & Confirmed" },
    { label: "Active Reservations", value: activeBookings.toString(), subtext: "In-house & Upcoming" },
    { label: "Total Sanctuaries", value: (totalSpaces || 0).toString(), subtext: "Managed Properties" },
    { label: "Pending Actions", value: ((pendingGuestVerifications || 0) + (pendingHousekeeping || 0)).toString(), subtext: "IDs & Turnovers" }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl mb-1 text-white">Dashboard Command Center</h1>
        <p className="text-white/50 text-sm tracking-wide">Autonomous Operations, Channel Manager &amp; Hospitality Intelligence.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-mono">{stat.label}</p>
            <h2 className="font-serif text-3xl text-white mb-1">{stat.value}</h2>
            <p className="text-[10px] text-accent-gold/80 font-mono">{stat.subtext}</p>
          </div>
        ))}
      </div>

      {/* Quick Launch Control Hub */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Calendar Sync", href: "/admin/calendar", icon: CalendarDays, desc: "2-Way OTA Hub" },
          { label: "Sanctuaries", href: "/admin/spaces", icon: Building2, desc: "Property CRUD" },
          { label: "Bookings", href: "/admin/bookings", icon: CalendarDays, desc: "Reservations" },
          { label: "Police Log", href: "/admin/guests/police-register", icon: ShieldCheck, desc: "Delhi Form C" },
          { label: "Turnovers", href: "/admin/housekeeping", icon: Sparkles, desc: "Cleaner Dispatch" },
          { label: "Settlements", href: "/admin/financials", icon: CreditCard, desc: "GST & Ledger" },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-accent-gold/30 p-4 rounded-xl transition-all group block text-left"
          >
            <item.icon className="w-5 h-5 text-white/40 group-hover:text-accent-gold transition-colors mb-2" />
            <p className="text-xs font-bold text-white group-hover:text-accent-gold transition-colors">{item.label}</p>
            <p className="text-[10px] text-white/40 font-mono mt-0.5">{item.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Bookings Stream */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-serif text-xl text-white">Recent Reservations</h3>
            <Link href="/admin/bookings" className="text-xs text-accent-gold hover:text-white flex items-center gap-1 transition-colors">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {bookings && bookings.length > 0 ? bookings.map((booking: any) => (
              <div key={booking.id} className="flex justify-between items-center p-3.5 hover:bg-white/5 rounded-xl transition-colors border border-white/5">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white font-medium">{booking.spaces?.title || 'Sanctuary'}</p>
                    <span className="text-[10px] text-accent-gold font-mono uppercase">
                      {booking.id.split('-')[0]}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40 uppercase font-mono mt-0.5">
                    {format(new Date(booking.check_in), 'MMM dd')} - {format(new Date(booking.check_out), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white font-bold font-mono">₹{Number(booking.total_price).toLocaleString('en-IN')}</p>
                  <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm border ${
                    booking.status === 'confirmed' ? 'text-green-400 border-green-500/20 bg-green-500/10' :
                    booking.status === 'checked_in' ? 'text-blue-400 border-blue-500/20 bg-blue-500/10' :
                    booking.status === 'cancelled' ? 'text-red-400 border-red-500/20' :
                    'text-accent-gold border-accent-gold/20'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-sm text-white/30 text-center py-8">No recent bookings recorded.</p>
            )}
          </div>
        </div>

        {/* Attention Required / Operational Action Board */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-serif text-xl text-white mb-6">Operations Queue</h3>
            
            <div className="space-y-3">
              {(pendingGuestVerifications || 0) > 0 && (
                <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-amber-400" />
                    <div>
                      <p className="text-xs text-white font-medium">Pending Guest ID Vetting</p>
                      <p className="text-[10px] text-amber-400/80 font-mono">{pendingGuestVerifications} guest(s) awaiting approval</p>
                    </div>
                  </div>
                  <Link href="/admin/guests" className="text-xs bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-md hover:bg-amber-500/30 transition-colors font-semibold">
                    Review
                  </Link>
                </div>
              )}

              {(pendingHousekeeping || 0) > 0 && (
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-accent-gold" />
                    <div>
                      <p className="text-xs text-white font-medium">Scheduled Cleanings</p>
                      <p className="text-[10px] text-white/50 font-mono">{pendingHousekeeping} turnover task(s) active</p>
                    </div>
                  </div>
                  <Link href="/admin/housekeeping" className="text-xs bg-white/10 px-3 py-1.5 rounded-md hover:bg-white/20 transition-colors">
                    View
                  </Link>
                </div>
              )}
              
              {!pendingGuestVerifications && !pendingHousekeeping && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CheckCircle className="w-8 h-8 text-green-500/50 mb-3" />
                  <p className="text-sm text-white/50">All systems operating smoothly.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 mt-6">
            <Link
              href="/admin/settings"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-white/70 hover:text-white transition-colors"
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
