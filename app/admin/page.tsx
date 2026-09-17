import { createClient } from "@/lib/supabase/server";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import Link from "next/link";
import { 
  ArrowRight, CheckCircle, ShieldAlert, Building2, 
  CalendarDays, Users, Sparkles, CreditCard, Settings,
  ShieldCheck, Clock, MessageSquare, Plus, DollarSign, 
  Scan, ArrowUpRight, CheckCircle2
} from "lucide-react";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminMetricCard from "@/components/admin/ui/AdminMetricCard";
import AdminBadge from "@/components/admin/ui/AdminBadge";
import TodayMovementsHub from "@/components/admin/TodayMovementsHub";
import { ADMIN_HUBS } from "@/lib/admin-nav";

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

  // 4c. Fetch pending sanctuary gathering applications
  const { count: pendingGatheringApplications } = await supabase
    .from('sanctuary_event_applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'applied');

  // 4d. Fetch kinkster mode activations count
  const { count: totalKinksters } = await supabase
    .from('kinkster_profiles')
    .select('*', { count: 'exact', head: true });

  // 5. Today's Movements
  const { data: todayArrivals } = await supabase
    .from('bookings')
    .select('id, guest_name, guest_phone, status, check_in, check_out, spaces(id, title)')
    .eq('check_in', todayStr)
    .neq('status', 'cancelled');

  const { data: todayDepartures } = await supabase
    .from('bookings')
    .select('id, guest_name, guest_phone, status, check_in, check_out, spaces(id, title)')
    .eq('check_out', todayStr)
    .neq('status', 'cancelled');

  // 6. Current Month Revenue & Occupancy Calculations
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

  const totalPendingOps = (pendingGuestVerifications || 0) + (pendingHousekeeping || 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Unified Luxury Header */}
      <AdminPageHeader
        title="Dashboard Command Center"
        description="Autonomous Operations, Multi-Channel Manager & Hospitality Intelligence."
        badge="OS 2026"
        badgeVariant="gold"
        actions={
          <>
            <Link
              href="/admin/marshall-scanner"
              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
            >
              <Scan className="w-3.5 h-3.5 text-rose-400" />
              Gatekeeper Scanner
            </Link>

            <Link
              href="/admin/calendar"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-mono font-semibold uppercase tracking-wider transition-colors flex items-center gap-2"
            >
              <CalendarDays className="w-3.5 h-3.5 text-accent-gold" />
              Master Calendar
            </Link>

            <Link
              href="/admin/bookings/new"
              className="px-4 py-2 bg-accent-gold hover:bg-white text-black rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-lg flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New Booking
            </Link>
          </>
        }
      />

      {/* Unified Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminMetricCard
          label={`${format(now, 'MMMM')} Gross Tariff`}
          value={`₹${currentMonthRevenue.toLocaleString('en-IN')}`}
          subtext="Confirmed & Paid Bookings"
          icon={CreditCard}
          highlightColor="gold"
          trend={{ value: `${currentMonthBookings.length} bookings`, direction: 'up' }}
        />

        <AdminMetricCard
          label="The Circle Network"
          value={(totalKinksters || 0).toString()}
          subtext={`${pendingGatheringApplications || 0} Gathering Vetting Queue`}
          icon={Sparkles}
          highlightColor="purple"
        />

        <AdminMetricCard
          label={`${format(now, 'MMMM')} Space Occupancy`}
          value={`${occupancyPercentage}%`}
          subtext={`${totalBookedNightsThisMonth} of ${possibleNights} Room Nights`}
          icon={Building2}
          highlightColor="emerald"
          trend={{ value: `${totalSanctuariesCount} Suites`, direction: 'neutral' }}
        />

        <AdminMetricCard
          label="Operational Action Queue"
          value={totalPendingOps.toString()}
          subtext="IDs, Turnovers & Audits Pending"
          icon={ShieldCheck}
          highlightColor={totalPendingOps > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* Interactive Today's Movements Hub with Turnover Squeeze Alerts */}
      <TodayMovementsHub
        todayDateStr={format(now, 'dd MMMM yyyy')}
        arrivals={(todayArrivals as any) || []}
        departures={(todayDepartures as any) || []}
      />

      {/* Quick Launch Control Hub (7 Integrated Parent Domains) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {ADMIN_HUBS.filter((h) => h.id !== 'dashboard').map((hub) => {
          const HubIcon = hub.icon;
          return (
            <Link
              key={hub.id}
              href={hub.href}
              className="bg-zinc-950/60 hover:bg-white/[0.04] border border-white/5 hover:border-accent-gold/30 p-3.5 sm:p-4 rounded-2xl transition-all group block text-left shadow-lg hover:translate-y-[-1px]"
            >
              <div className="flex items-center justify-between mb-2">
                <HubIcon className="w-4 h-4 text-white/40 group-hover:text-accent-gold transition-colors" />
                {hub.badge && (
                  <span className="text-[7px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/5 text-accent-gold border border-accent-gold/20 font-bold">
                    {hub.badge}
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-white group-hover:text-accent-gold transition-colors truncate">
                {hub.name}
              </p>
              <p className="text-[9px] text-white/40 font-mono mt-0.5 truncate">
                {hub.subItems.length} integrated tools
              </p>
            </Link>
          );
        })}
      </div>

      {/* Main Operations Stream & Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Bookings Stream */}
        <div className="lg:col-span-2 bg-zinc-950/60 border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl backdrop-blur-md">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-serif text-xl text-white font-bold">Recent Reservations</h3>
              <p className="text-xs text-white/40 font-sans mt-0.5">Live incoming stays and direct bookings stream</p>
            </div>
            <Link
              href="/admin/bookings"
              className="text-xs text-accent-gold hover:text-white flex items-center gap-1 transition-colors font-mono font-medium"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {bookings && bookings.length > 0 ? bookings.map((booking: any) => {
              const spaceTitle = Array.isArray(booking.spaces) ? booking.spaces[0]?.title : booking.spaces?.title;

              return (
                <div 
                  key={booking.id} 
                  className="flex justify-between items-center p-3.5 hover:bg-white/[0.03] rounded-2xl transition-colors border border-white/5 group"
                >
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-white font-semibold truncate group-hover:text-accent-gold transition-colors">
                        {booking.guest_name || spaceTitle || 'Direct Guest'}
                      </p>
                      <span className="text-[10px] text-accent-gold/80 font-mono uppercase bg-accent-gold/10 px-1.5 py-0.5 rounded">
                        {booking.id.split('-')[0]}
                      </span>
                      {booking.payment_method && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/60 font-mono">
                          {booking.payment_method}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/40 font-mono mt-1 truncate">
                      {format(new Date(booking.check_in), 'MMM dd')} - {format(new Date(booking.check_out), 'MMM dd, yyyy')} • {spaceTitle || 'Sanctuary Space'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm text-white font-bold font-mono">
                      ₹{Number(booking.total_price).toLocaleString('en-IN')}
                    </p>
                    <div className="mt-1">
                      <AdminBadge status={booking.status} />
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-10">
                <Clock className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-sm text-white/40 font-mono">No recent reservations recorded.</p>
              </div>
            )}
          </div>
        </div>

        {/* Operational Attention Queue */}
        <div className="bg-zinc-950/60 border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-xl backdrop-blur-md">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-serif text-xl text-white font-bold">Operations Queue</h3>
                <p className="text-xs text-white/40 font-sans mt-0.5">Tasks requiring administrative sign-off</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-gold/10 text-accent-gold border border-accent-gold/25 font-bold">
                {totalPendingOps} Active
              </span>
            </div>
            
            <div className="space-y-3">
              {(pendingGatheringApplications || 0) > 0 && (
                <div className="flex items-center justify-between p-3.5 bg-purple-500/10 border border-purple-500/25 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <p className="text-xs text-white font-semibold">Gathering Concierge Vetting</p>
                      <p className="text-[10px] text-purple-300/80 font-mono">
                        {pendingGatheringApplications} applicant(s) in queue
                      </p>
                    </div>
                  </div>
                  <Link 
                    href="/admin/events" 
                    className="text-xs bg-purple-500/20 text-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-500/30 transition-colors font-bold font-mono"
                  >
                    Curate
                  </Link>
                </div>
              )}

              {(pendingPartnerVerifications || 0) > 0 && (
                <div className="flex items-center justify-between p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xs text-white font-semibold">Partner NOC / KYC Audits</p>
                      <p className="text-[10px] text-amber-400/80 font-mono">
                        {pendingPartnerVerifications} partner(s) awaiting verification
                      </p>
                    </div>
                  </div>
                  <Link 
                    href="/admin/partners" 
                    className="text-xs bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-500/30 transition-colors font-bold font-mono"
                  >
                    Audit
                  </Link>
                </div>
              )}

              {(newFranchiseLeads || 0) > 0 && (
                <div className="flex items-center justify-between p-3.5 bg-accent-gold/10 border border-accent-gold/20 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 text-accent-gold shrink-0" />
                    <div>
                      <p className="text-xs text-white font-semibold">New Franchise Applications</p>
                      <p className="text-[10px] text-accent-gold/80 font-mono">
                        {newFranchiseLeads} new prospect inquiry
                      </p>
                    </div>
                  </div>
                  <Link 
                    href="/admin/partners" 
                    className="text-xs bg-accent-gold text-black px-3 py-1.5 rounded-lg hover:bg-white transition-colors font-bold font-mono"
                  >
                    View
                  </Link>
                </div>
              )}

              {(pendingGuestVerifications || 0) > 0 && (
                <div className="flex items-center justify-between p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xs text-white font-semibold">Pending Guest ID Vetting</p>
                      <p className="text-[10px] text-amber-400/80 font-mono">
                        {pendingGuestVerifications} guest(s) awaiting approval
                      </p>
                    </div>
                  </div>
                  <Link 
                    href="/admin/guests" 
                    className="text-xs bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-500/30 transition-colors font-bold font-mono"
                  >
                    Review
                  </Link>
                </div>
              )}

              {(pendingHousekeeping || 0) > 0 && (
                <div className="flex items-center justify-between p-3.5 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-accent-gold shrink-0" />
                    <div>
                      <p className="text-xs text-white font-semibold">Scheduled Cleanings</p>
                      <p className="text-[10px] text-white/50 font-mono">
                        {pendingHousekeeping} turnover task(s) active
                      </p>
                    </div>
                  </div>
                  <Link 
                    href="/admin/housekeeping" 
                    className="text-xs bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors font-mono"
                  >
                    View
                  </Link>
                </div>
              )}
              
              {!pendingGuestVerifications && !pendingHousekeeping && !pendingPartnerVerifications && !newFranchiseLeads && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-400/60 mb-2" />
                  <p className="text-sm text-white/60 font-mono">All operational queues clear.</p>
                  <p className="text-xs text-white/30 font-sans mt-0.5">Autonomous check-in &amp; booking pipeline active.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 mt-6">
            <Link
              href="/admin/settings"
              className="flex items-center justify-center gap-2 w-full py-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-xl text-xs text-white/70 hover:text-white transition-colors uppercase font-mono font-semibold"
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
