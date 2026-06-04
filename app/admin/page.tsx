import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowRight, CheckCircle, ShieldAlert, MessageSquare, Building2 } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = await createClient();
  
  // Fetch stats data
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, total_price, status, created_at, check_in, check_out, spaces(title)')
    .order('created_at', { ascending: false })
    .limit(10);
    
  const { data: allBookings } = await supabase
    .from('bookings')
    .select('status, total_price');

  const { count: unreadMessages } = await supabase
    .from('contact_messages')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'unread');
    
  const { count: newFranchiseLeads } = await supabase
    .from('franchise_leads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new');

  const totalRevenue = allBookings 
    ? allBookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + Number(b.total_price), 0) 
    : 0;
    
  const activeBookings = allBookings 
    ? allBookings.filter(b => b.status === 'confirmed').length 
    : 0;

  const stats = [
    { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}` },
    { label: "Active Bookings", value: activeBookings.toString() },
    { label: "Pending Tasks", value: ((unreadMessages || 0) + (newFranchiseLeads || 0)).toString() }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl mb-2 text-white">Dashboard Overview</h1>
        <p className="text-white/50 text-sm tracking-wide">Welcome to the Nothingness Command Center.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-3">{stat.label}</p>
            <h2 className="font-serif text-3xl text-white">{stat.value}</h2>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bookings */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-serif text-xl text-white">Recent Bookings</h3>
            <Link href="/admin/bookings" className="text-xs text-accent-gold hover:text-white flex items-center gap-1 transition-colors">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {bookings && bookings.length > 0 ? bookings.slice(0, 5).map((booking: any) => (
              <div key={booking.id} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-colors border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm text-white mb-1">{booking.spaces?.title}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">
                    {format(new Date(booking.check_in), 'MMM dd')} - {format(new Date(booking.check_out), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white mb-1">₹{Number(booking.total_price).toLocaleString()}</p>
                  <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm border ${
                    booking.status === 'confirmed' ? 'text-green-400 border-green-500/20' :
                    booking.status === 'cancelled' ? 'text-red-400 border-red-500/20' :
                    'text-accent-gold border-accent-gold/20'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-sm text-white/30 text-center py-4">No recent bookings</p>
            )}
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
          <h3 className="font-serif text-xl text-white mb-6">Attention Required</h3>
          
          <div className="space-y-3">
            {unreadMessages ? (
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-accent-gold" />
                  <div>
                    <p className="text-sm text-white">Unread Contact Messages</p>
                    <p className="text-[10px] text-white/50">{unreadMessages} new message(s)</p>
                  </div>
                </div>
                <Link href="/admin/messages" className="text-xs bg-white/10 px-3 py-1.5 rounded-md hover:bg-white/20 transition-colors">
                  Review
                </Link>
              </div>
            ) : null}
            
            {newFranchiseLeads ? (
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-accent-gold" />
                  <div>
                    <p className="text-sm text-white">New Franchise Inquiries</p>
                    <p className="text-[10px] text-white/50">{newFranchiseLeads} new application(s)</p>
                  </div>
                </div>
                <Link href="/admin/messages" className="text-xs bg-white/10 px-3 py-1.5 rounded-md hover:bg-white/20 transition-colors">
                  Review
                </Link>
              </div>
            ) : null}
            
            {!unreadMessages && !newFranchiseLeads && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle className="w-8 h-8 text-green-500/50 mb-3" />
                <p className="text-sm text-white/50">You're all caught up.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
